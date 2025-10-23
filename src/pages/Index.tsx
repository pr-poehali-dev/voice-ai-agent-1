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
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  receiptData?: any;
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
        body: JSON.stringify({ message: userInput }),
      });

      const data = await response.json();

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: data.message || 'Чек обработан',
        timestamp: new Date(),
        receiptData: data.receipt,
      };

      setMessages((prev) => [...prev, agentMessage]);
      
      if (data.success) {
        toast.success('Чек успешно создан!');
      } else {
        toast.error('Произошла ошибка при создании чека');
      }
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
                  message.type === 'agent'
                    ? 'bg-gradient-to-br from-primary to-secondary'
                    : 'bg-muted'
                }`}
              >
                {message.type === 'agent' ? (
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
                      : 'bg-primary text-primary-foreground border-primary'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
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

          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
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