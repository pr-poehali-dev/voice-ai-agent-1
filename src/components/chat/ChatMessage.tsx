import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { ReceiptPreview } from './ReceiptPreview';

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

interface ChatMessageProps {
  message: Message;
  editedData: any;
  editMode: boolean;
  isProcessing: boolean;
  updateEditedField: (path: string, value: any) => void;
  handleEditToggle: () => void;
  handleConfirmReceipt: () => void;
  handleCancelReceipt: () => void;
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
}: ChatMessageProps) => {
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
          {message.receiptData && (
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
        <span className="text-xs text-muted-foreground mt-1 px-2">
          {message.timestamp.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};