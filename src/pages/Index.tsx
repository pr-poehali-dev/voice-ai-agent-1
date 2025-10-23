import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'preview';
  content: string;
  timestamp: Date;
  receiptData?: any;
  previewData?: any;
}

const Index = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: 'Привет! Я ИИ-агент для создания чеков в екомкасса. Опиши чек голосом или текстом, и я создам его для тебя.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [operationType, setOperationType] = useState('sell');
  const [pendingReceipt, setPendingReceipt] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('https://functions.poehali.dev/734da785-2867-4c5d-b20c-90fc6d86b11c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput, operation_type: operationType, preview_only: true }),
      });

      const data = await response.json();

      const operationNames: Record<string, string> = {
        sell: 'Продажа',
        refund: 'Возврат',
        sell_correction: 'Коррекция прихода',
        refund_correction: 'Коррекция расхода'
      };

      const detectedType = data.operation_type || operationType;
      const typeName = operationNames[detectedType] || detectedType;

      const previewMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'preview',
        content: 'Проверь данные чека перед отправкой',
        timestamp: new Date(),
        previewData: { ...data.receipt, operation_type: detectedType, typeName },
      };

      setMessages((prev) => [...prev, previewMessage]);
      setPendingReceipt({ userInput, operationType: detectedType });
      setEditedData({ ...data.receipt, operation_type: detectedType, typeName });
      toast.info('Проверь данные и подтверди отправку');
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'agent',
        content: 'Произошла ошибка при обработке запроса. Попробуй еще раз.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error('Ошибка соединения с сервером');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!pendingReceipt) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('https://functions.poehali.dev/734da785-2867-4c5d-b20c-90fc6d86b11c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: pendingReceipt.userInput, 
          operation_type: pendingReceipt.operationType,
          preview_only: false,
          edited_data: editMode ? editedData : null
        }),
      });

      const data = await response.json();

      const operationNames: Record<string, string> = {
        sell: 'Продажа',
        refund: 'Возврат',
        sell_correction: 'Коррекция прихода',
        refund_correction: 'Коррекция расхода'
      };

      const typeName = operationNames[pendingReceipt.operationType] || pendingReceipt.operationType;

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: `${data.message || 'Чек отправлен'} (${typeName})`,
        timestamp: new Date(),
        receiptData: data.receipt,
      };

      setMessages((prev) => [...prev, agentMessage]);
      setPendingReceipt(null);
      setEditMode(false);
      setEditedData(null);
      
      if (data.success) {
        toast.success(`Чек успешно создан! Тип: ${typeName}`);
      } else {
        toast.error('Произошла ошибка при создании чека');
      }
    } catch (error) {
      toast.error('Ошибка соединения с сервером');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelReceipt = () => {
    setPendingReceipt(null);
    setEditMode(false);
    setEditedData(null);
    toast.info('Отменено');
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const updateEditedField = (path: string, value: any) => {
    setEditedData((prev: any) => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Голосовой ввод не поддерживается в вашем браузере');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info('Говорите...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Ошибка распознавания речи');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      <div className="container max-w-5xl mx-auto h-screen flex flex-col p-6">
        <header className="flex items-center justify-between mb-8 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Icon name="Sparkles" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AI Receipt Agent
              </h1>
              <p className="text-sm text-muted-foreground">Екомкасса ИИ-помощник</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => navigate('/history')}>
              <Icon name="History" size={20} />
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl">
              <Icon name="Settings" size={20} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-fade-in ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <Avatar
                className={`w-10 h-10 flex items-center justify-center ${
                  message.type === 'agent' || message.type === 'preview'
                    ? 'bg-gradient-to-br from-primary to-secondary'
                    : 'bg-muted'
                }`}
              >
                {message.type === 'agent' || message.type === 'preview' ? (
                  <Icon name="Bot" size={20} className="text-white" />
                ) : (
                  <Icon name="User" size={20} className="text-foreground" />
                )}
              </Avatar>

              <div
                className={`flex-1 max-w-[80%] ${
                  message.type === 'user' ? 'items-end' : 'items-start'
                } flex flex-col`}
              >
                <Card
                  className={`p-4 ${
                    message.type === 'agent'
                      ? 'bg-card border-primary/20'
                      : message.type === 'preview'
                      ? 'bg-accent/10 border-accent'
                      : 'bg-primary text-primary-foreground border-primary'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.previewData && editedData && (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-background/50 p-2 rounded">
                          <div className="text-xs text-muted-foreground">Тип операции</div>
                          {editMode ? (
                            <select 
                              value={editedData.operation_type}
                              onChange={(e) => updateEditedField('operation_type', e.target.value)}
                              className="w-full bg-background border rounded px-2 py-1 text-sm"
                            >
                              <option value="sell">Продажа</option>
                              <option value="refund">Возврат</option>
                              <option value="sell_correction">Коррекция прихода</option>
                              <option value="refund_correction">Коррекция расхода</option>
                            </select>
                          ) : (
                            <div className="font-medium">{editedData.typeName}</div>
                          )}
                        </div>
                        <div className="bg-background/50 p-2 rounded">
                          <div className="text-xs text-muted-foreground">Тип оплаты</div>
                          {editMode ? (
                            <select 
                              value={editedData.payments?.[0]?.type || 'electronically'}
                              onChange={(e) => updateEditedField('payments.0.type', e.target.value)}
                              className="w-full bg-background border rounded px-2 py-1 text-sm"
                            >
                              <option value="electronically">Безналичный</option>
                              <option value="cash">Наличные</option>
                            </select>
                          ) : (
                            <div className="font-medium">
                              {editedData.payments?.[0]?.type === 'cash' ? 'Наличные' : 'Безналичный'}
                            </div>
                          )}
                        </div>
                        <div className="bg-background/50 p-2 rounded">
                          <div className="text-xs text-muted-foreground">Email клиента</div>
                          {editMode ? (
                            <Input 
                              value={editedData.client?.email || ''}
                              onChange={(e) => updateEditedField('client.email', e.target.value)}
                              className="h-7 text-sm"
                              placeholder="email@example.com"
                            />
                          ) : (
                            <div className="font-medium text-xs truncate">{editedData.client?.email || 'Не указан'}</div>
                          )}
                        </div>
                        <div className="bg-background/50 p-2 rounded">
                          <div className="text-xs text-muted-foreground">Телефон клиента</div>
                          {editMode ? (
                            <Input 
                              value={editedData.client?.phone || ''}
                              onChange={(e) => updateEditedField('client.phone', e.target.value)}
                              className="h-7 text-sm"
                              placeholder="+79991234567"
                            />
                          ) : (
                            <div className="font-medium text-xs">{editedData.client?.phone || 'Не указан'}</div>
                          )}
                        </div>
                        <div className="bg-background/50 p-2 rounded">
                          <div className="text-xs text-muted-foreground">ИНН продавца</div>
                          {editMode ? (
                            <Input 
                              value={editedData.company?.inn || ''}
                              onChange={(e) => updateEditedField('company.inn', e.target.value)}
                              className="h-7 text-sm"
                              placeholder="1234567890"
                            />
                          ) : (
                            <div className="font-medium">{editedData.company?.inn || 'Не указан'}</div>
                          )}
                        </div>
                        <div className="bg-background/50 p-2 rounded">
                          <div className="text-xs text-muted-foreground">СНО</div>
                          {editMode ? (
                            <select 
                              value={editedData.company?.sno || 'usn_income'}
                              onChange={(e) => updateEditedField('company.sno', e.target.value)}
                              className="w-full bg-background border rounded px-2 py-1 text-sm"
                            >
                              <option value="osn">ОСН</option>
                              <option value="usn_income">УСН доход</option>
                              <option value="usn_income_outcome">УСН доход-расход</option>
                              <option value="envd">ЕНВД</option>
                              <option value="esn">ЕСН</option>
                              <option value="patent">Патент</option>
                            </select>
                          ) : (
                            <div className="font-medium text-xs">{editedData.company?.sno || 'usn_income'}</div>
                          )}
                        </div>
                        <div className="bg-background/50 p-2 rounded col-span-2">
                          <div className="text-xs text-muted-foreground">Адрес расчетов</div>
                          {editMode ? (
                            <Input 
                              value={editedData.company?.payment_address || ''}
                              onChange={(e) => updateEditedField('company.payment_address', e.target.value)}
                              className="h-7 text-sm"
                              placeholder="site.ru"
                            />
                          ) : (
                            <div className="font-medium text-xs truncate">{editedData.company?.payment_address || 'Не указан'}</div>
                          )}
                        </div>
                      </div>
                      <div className="bg-background/50 p-3 rounded space-y-2">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Товары и услуги</div>
                        {editedData.items?.map((item: any, idx: number) => (
                          <div key={idx} className="space-y-2 pb-2 border-b border-border/50 last:border-0">
                            {editMode ? (
                              <div className="space-y-1">
                                <div className="grid grid-cols-2 gap-1">
                                  <Input 
                                    value={item.name}
                                    onChange={(e) => {
                                      const newItems = [...editedData.items];
                                      newItems[idx].name = e.target.value;
                                      updateEditedField('items', newItems);
                                    }}
                                    className="h-7 text-sm"
                                    placeholder="Название"
                                  />
                                  <Input 
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => {
                                      const newItems = [...editedData.items];
                                      newItems[idx].price = parseFloat(e.target.value);
                                      updateEditedField('items', newItems);
                                    }}
                                    className="h-7 text-sm"
                                    placeholder="Цена"
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <Input 
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newItems = [...editedData.items];
                                      newItems[idx].quantity = parseFloat(e.target.value);
                                      updateEditedField('items', newItems);
                                    }}
                                    className="h-7 text-sm"
                                    placeholder="Кол-во"
                                  />
                                  <select 
                                    value={item.vat || 'none'}
                                    onChange={(e) => {
                                      const newItems = [...editedData.items];
                                      newItems[idx].vat = e.target.value;
                                      updateEditedField('items', newItems);
                                    }}
                                    className="h-7 text-sm bg-background border rounded px-1"
                                  >
                                    <option value="none">Без НДС</option>
                                    <option value="vat20">НДС 20%</option>
                                    <option value="vat10">НДС 10%</option>
                                    <option value="vat0">НДС 0%</option>
                                  </select>
                                  <select 
                                    value={item.payment_object || 'commodity'}
                                    onChange={(e) => {
                                      const newItems = [...editedData.items];
                                      newItems[idx].payment_object = e.target.value;
                                      updateEditedField('items', newItems);
                                    }}
                                    className="h-7 text-sm bg-background border rounded px-1"
                                  >
                                    <option value="commodity">Товар</option>
                                    <option value="service">Услуга</option>
                                    <option value="work">Работа</option>
                                  </select>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium">{item.name}</span>
                                  <span className="font-medium">{item.price}₽</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{item.quantity} {item.measure || 'шт'} • {item.vat === 'none' ? 'Без НДС' : item.vat}</span>
                                  <span>{(item.price * item.quantity).toFixed(2)}₽</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                          <span>Итого</span>
                          <span>{editedData.total}₽</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={handleEditToggle}
                          variant="outline"
                          size="sm"
                          disabled={isProcessing}
                        >
                          <Icon name={editMode ? "Save" : "Edit"} size={16} className="mr-2" />
                          {editMode ? 'Готово' : 'Редактировать'}
                        </Button>
                        <Button 
                          onClick={handleConfirmReceipt} 
                          disabled={isProcessing}
                          className="flex-1"
                        >
                          <Icon name="Check" size={16} className="mr-2" />
                          Отправить чек
                        </Button>
                        <Button 
                          onClick={handleCancelReceipt}
                          variant="outline"
                          disabled={isProcessing}
                        >
                          <Icon name="X" size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                  {message.receiptData && (
                    <div className="mt-3 pt-3 border-t border-primary/20 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-accent">
                        <Icon name="FileText" size={16} />
                        <span>Чек создан</span>
                      </div>
                      <div className="text-xs opacity-70 space-y-1">
                        {message.receiptData.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.name} x{item.quantity}</span>
                            <span>{item.price}₽</span>
                          </div>
                        ))}
                        <div className="pt-1 border-t border-primary/10 font-semibold">
                          Итого: {message.receiptData.total}₽
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
                <span className="text-xs text-muted-foreground mt-1 px-2">
                  {message.timestamp.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="flex gap-3 items-end">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-2xl h-14 w-14 transition-all ${
                isListening
                  ? 'bg-accent text-accent-foreground animate-pulse'
                  : 'hover:bg-accent/10'
              }`}
              onClick={handleVoiceInput}
            >
              <Icon name="Mic" size={24} />
            </Button>

            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Опиши чек: товары, цены, покупатель..."
                className="h-14 rounded-2xl bg-card border-primary/20 pr-14 text-base"
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="absolute right-2 top-2 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                <Icon name="Send" size={20} />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <Button
                variant={operationType === 'sell' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOperationType('sell')}
                className="text-xs"
              >
                Продажа
              </Button>
              <Button
                variant={operationType === 'refund' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOperationType('refund')}
                className="text-xs"
              >
                Возврат
              </Button>
              <Button
                variant={operationType === 'sell_correction' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOperationType('sell_correction')}
                className="text-xs"
              >
                Коррекция прихода
              </Button>
              <Button
                variant={operationType === 'refund_correction' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOperationType('refund_correction')}
                className="text-xs"
              >
                Коррекция расхода
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Icon name="Mic" size={14} />
              <span>Голос</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="MessageSquare" size={14} />
              <span>Текст</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="FileText" size={14} />
              <span>API</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Sparkles" size={14} />
              <span>ИИ-обработка</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;