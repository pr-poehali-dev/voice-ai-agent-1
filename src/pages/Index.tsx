import { useState } from 'react';
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
  const [lastReceiptData, setLastReceiptData] = useState<any>(null);

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
        setMessages((prev) => [...prev, errorMessage]);
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

      setMessages((prev) => [...prev, previewMessage]);
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

      const messageContent = 'Запрос отправлен';
      
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: messageContent,
        timestamp: new Date(),
        receiptData: data.receipt,
        receiptUuid: data.uuid,
        receiptPermalink: data.permalink,
        hasError: !data.success,
      };

      setMessages((prev) => [...prev, agentMessage]);
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
        <ChatHeader />

        <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-2">
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