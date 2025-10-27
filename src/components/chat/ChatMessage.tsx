import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { ReceiptPreview } from './ReceiptPreview';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

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

interface ChatMessageProps {
  message: Message;
  editedData: any;
  editMode: boolean;
  isProcessing: boolean;
  updateEditedField: (path: string, value: any) => void;
  handleEditToggle: () => void;
  handleConfirmReceipt: () => void;
  handleCancelReceipt: () => void;
  userMessage?: string;
}

export const ChatMessage = ({
  message,
  editedData,
  editMode,
  isProcessing,
  updateEditedField,
  handleEditToggle,
  handleConfirmReceipt,
  handleCancelReceipt,
  userMessage,
}: ChatMessageProps) => {
  const [feedbackSent, setFeedbackSent] = useState<'positive' | 'negative' | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Скопировано');
  };

  const handleFeedback = async (type: 'positive' | 'negative') => {
    if (feedbackSent) return;
    
    try {
      const response = await fetch('https://functions.poehali.dev/6eedb517-4a92-4cc9-bb6f-210d8d684016', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: message.id,
          user_message: userMessage || '',
          agent_response: message.content,
          feedback_type: type
        })
      });
      
      if (response.ok) {
        setFeedbackSent(type);
        toast.success(type === 'positive' ? 'Спасибо за отзыв!' : 'Спасибо, буду лучше!');
      }
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  };

  return (
    <div
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
              ? message.hasError 
                ? 'bg-card border-destructive/30'
                : 'bg-card border-primary/20'
              : message.type === 'preview'
              ? 'bg-accent/10 border-accent'
              : 'bg-primary text-primary-foreground border-primary'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
          {message.previewData && editedData && (
            <ReceiptPreview
              editedData={editedData}
              editMode={editMode}
              isProcessing={isProcessing}
              updateEditedField={updateEditedField}
              handleEditToggle={handleEditToggle}
              handleConfirmReceipt={handleConfirmReceipt}
              handleCancelReceipt={handleCancelReceipt}
            />
          )}
          {message.hasError && message.errorMessage && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <Icon name="AlertCircle" size={16} className="mt-0.5 flex-shrink-0" />
                <span>{message.errorMessage}</span>
              </div>
            </div>
          )}
          {message.receiptData && !message.hasError && (
            <div className="mt-3 pt-3 border-t border-primary/20 space-y-2">
              <div className="flex items-center gap-2 text-xs text-accent">
                <Icon name="FileText" size={16} />
                {message.receiptUuid && message.receiptPermalink ? (
                  <a 
                    href={message.receiptPermalink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Чек №{message.receiptUuid}
                  </a>
                ) : (
                  <span>Чек создан</span>
                )}
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
        <div className={`flex items-center gap-2 mt-1 px-2 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {message.type === 'user' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              <Icon name="Copy" size={14} />
            </Button>
          )}
          {(message.type === 'agent' || message.type === 'preview') && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 text-xs ${feedbackSent === 'positive' ? 'text-green-600' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleFeedback('positive')}
                disabled={feedbackSent !== null}
              >
                <Icon name="ThumbsUp" size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 text-xs ${feedbackSent === 'negative' ? 'text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleFeedback('negative')}
                disabled={feedbackSent !== null}
              >
                <Icon name="ThumbsDown" size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};