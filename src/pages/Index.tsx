import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'preview';
  content: string;
  timestamp: Date;
  receiptData?: any;
  receiptUuid?: string;
  receiptPermalink?: string;
  previewData?: any;
  hasError?: boolean;
  errorMessage?: string;
}

const Index = () => {
  const navigate = useNavigate();
  
  const getInitialMessages = (): Message[] => {
    return [{
      id: '1',
      type: 'agent',
      content: 'Привет! Я твой ИИ Кассир, создам чеки за тебя. Напиши запрос текстом или голосом, например: консультация по бизнесу 5000 рублей',
      timestamp: new Date(),
    }];
  };
  
  const loadMessages = () => {
    try {
      const saved = localStorage.getItem('chat_messages');
      if (!saved) return getInitialMessages();
      
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return getInitialMessages();
      }
      
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch (e) {
      console.error('Error loading messages:', e);
      localStorage.removeItem('chat_messages');
      return getInitialMessages();
    }
  };
  
  const [messages, setMessages] = useState<Message[]>(loadMessages());
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [operationType, setOperationType] = useState('sell');
  const [pendingReceipt, setPendingReceipt] = useState<any>(() => {
    const saved = localStorage.getItem('pending_receipt');
    return saved ? JSON.parse(saved) : null;
  });
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any>(() => {
    const saved = localStorage.getItem('edited_data');
    return saved ? JSON.parse(saved) : null;
  });
  const [lastReceiptData, setLastReceiptData] = useState<any>(() => {
    const saved = localStorage.getItem('last_receipt_data');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const toSave = messages
          .slice(-50)
          .map(msg => ({
            id: msg.id,
            type: msg.type,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
            receiptUuid: msg.receiptUuid,
            receiptPermalink: msg.receiptPermalink,
            hasError: msg.hasError,
            errorMessage: msg.errorMessage,
            previewData: msg.previewData
          }));
        localStorage.setItem('chat_messages', JSON.stringify(toSave));
      } catch (e) {
        console.error('Error saving messages:', e);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [messages]);
  
  useEffect(() => {
    if (pendingReceipt) {
      localStorage.setItem('pending_receipt', JSON.stringify(pendingReceipt));
    } else {
      localStorage.removeItem('pending_receipt');
    }
  }, [pendingReceipt]);
  
  useEffect(() => {
    if (editedData) {
      localStorage.setItem('edited_data', JSON.stringify(editedData));
    } else {
      localStorage.removeItem('edited_data');
    }
  }, [editedData]);
  
  useEffect(() => {
    if (lastReceiptData) {
      localStorage.setItem('last_receipt_data', JSON.stringify(lastReceiptData));
    } else {
      localStorage.removeItem('last_receipt_data');
    }
  }, [lastReceiptData]);

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
    
    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'agent',
      content: 'Работаю, минуту...',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, processingMessage]);
    
    // Сбрасываем предыдущие данные формы
    setPendingReceipt(null);
    setEditMode(false);
    setEditedData(null);

    try {
      const savedSettings = localStorage.getItem('ecomkassa_settings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {};
      
      const response = await fetch('https://functions.poehali.dev/734da785-2867-4c5d-b20c-90fc6d86b11c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userInput, 
          operation_type: operationType, 
          preview_only: true,
          settings,
          previous_receipt: lastReceiptData
        }),
      });

      const data = await response.json();

      if (data.error && data.missing_field === 'email') {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          content: `❌ ${data.message}\n\nПерейди в настройки и заполни поле "Email компании" или укажи email клиента в сообщении.`,
          timestamp: new Date(),
        };
        setMessages((prev) => {
          const filtered = prev.filter(m => m.content !== 'Работаю, минуту...');
          return [...filtered, errorMessage];
        });
        toast.error('Не указан email', {
          action: {
            label: 'Настройки',
            onClick: () => navigate('/settings')
          }
        });
        return;
      }

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

      setMessages((prev) => {
        const filtered = prev.filter(m => m.content !== 'Работаю, минуту...');
        return [...filtered, previewMessage];
      });
      setPendingReceipt({ userInput, operationType: detectedType });
      setEditedData({ ...data.receipt, operation_type: detectedType, typeName });
      setLastReceiptData(data.receipt);
      toast.info('Проверь данные и подтверди отправку');
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'agent',
        content: 'Произошла ошибка при обработке запроса. Попробуй еще раз.',
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const filtered = prev.filter(m => m.content !== 'Работаю, минуту...');
        return [...filtered, errorMessage];
      });
      toast.error('Ошибка соединения с сервером');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!pendingReceipt) return;
    
    setIsProcessing(true);
    
    const processingMessage: Message = {
      id: Date.now().toString(),
      type: 'agent',
      content: 'Работаю, минуту...',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, processingMessage]);
    
    try {
      const savedSettings = localStorage.getItem('ecomkassa_settings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {};
      
      const externalId = `AI_${Date.now()}`;
      
      const response = await fetch('https://functions.poehali.dev/734da785-2867-4c5d-b20c-90fc6d86b11c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: pendingReceipt.userInput, 
          operation_type: pendingReceipt.operationType,
          preview_only: false,
          edited_data: editedData || lastReceiptData,
          external_id: externalId,
          settings
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

      const messageContent = data.success ? 'Чек создан' : 'Ошибка';
      
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: messageContent,
        timestamp: new Date(),
        receiptData: data.success ? data.receipt : null,
        receiptUuid: data.uuid,
        receiptPermalink: data.permalink,
        hasError: !data.success,
        errorMessage: !data.success ? (data.message || data.error || 'Неизвестная ошибка') : undefined,
      };

      setMessages((prev) => {
        const filtered = prev.filter(m => m.content !== 'Работаю, минуту...');
        return [...filtered, agentMessage];
      });
      setPendingReceipt(null);
      setEditMode(false);
      setEditedData(null);
      setLastReceiptData(null);
      
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
    setMessages((prev) => {
      const filtered = prev.filter(m => m.type !== 'preview');
      const cancelMessage: Message = {
        id: Date.now().toString(),
        type: 'agent',
        content: 'Проверка данных чека отменена',
        timestamp: new Date(),
      };
      return [...filtered, cancelMessage];
    });
    setPendingReceipt(null);
    setEditMode(false);
    setEditedData(null);
    setLastReceiptData(null);
    toast.info('Отменено');
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const updateEditedField = (path: string, value: any) => {
    setEditedData((prev: any) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const isArrayIndex = !isNaN(Number(key));
        
        if (isArrayIndex) {
          const index = Number(key);
          if (!Array.isArray(current)) current = [];
          if (!current[index]) current[index] = {};
          current = current[index];
        } else {
          if (!current[key]) {
            const nextKey = keys[i + 1];
            current[key] = !isNaN(Number(nextKey)) ? [] : {};
          }
          current = current[key];
        }
      }
      
      const lastKey = keys[keys.length - 1];
      current[lastKey] = value;
      return newData;
    });
  };

  useEffect(() => {
    if (!editedData || !editedData.items) return;
    
    const calculatedTotal = editedData.items.reduce((sum: number, item: any) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseFloat(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
    
    const roundedTotal = Math.round(calculatedTotal * 100) / 100;
    
    if (editedData.total !== roundedTotal) {
      setEditedData((prev: any) => ({
        ...prev,
        total: roundedTotal,
        payments: prev.payments ? prev.payments.map((p: any) => ({
          ...p,
          sum: roundedTotal
        })) : [{ type: '1', sum: roundedTotal }]
      }));
    }
  }, [editedData?.items]);

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
    <div className="h-screen bg-gradient-to-br from-background via-background to-purple-950/20 flex flex-col">
      <div className="w-full max-w-5xl mx-auto h-full flex flex-col px-3 py-4 md:px-6 md:py-6">
        <ChatHeader />

        <div className="flex-1 overflow-y-auto mb-4 md:mb-6 space-y-4 overflow-x-hidden">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              editedData={editedData}
              editMode={editMode}
              isProcessing={isProcessing}
              updateEditedField={updateEditedField}
              handleEditToggle={handleEditToggle}
              handleConfirmReceipt={handleConfirmReceipt}
              handleCancelReceipt={handleCancelReceipt}
            />
          ))}
        </div>

        <ChatInput
          input={input}
          setInput={setInput}
          isListening={isListening}
          isProcessing={isProcessing}
          operationType={operationType}
          setOperationType={setOperationType}
          handleSendMessage={handleSendMessage}
          handleVoiceInput={handleVoiceInput}
        />
      </div>
    </div>
  );
};

export default Index;