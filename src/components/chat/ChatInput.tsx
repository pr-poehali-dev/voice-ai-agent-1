import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isListening: boolean;
  isProcessing: boolean;
  operationType: string;
  setOperationType: (value: string) => void;
  handleSendMessage: () => void;
  handleVoiceInput: () => void;
}

export const ChatInput = ({
  input,
  setInput,
  isListening,
  isProcessing,
  operationType,
  setOperationType,
  handleSendMessage,
  handleVoiceInput,
}: ChatInputProps) => {
  return (
    <div className="relative pb-safe">
      <div className="space-y-2">
        <div className="flex gap-1.5 md:gap-2">
          <Button
            variant={operationType === 'sell' ? 'default' : 'outline'}
            size="sm"
            className="rounded-lg text-xs md:text-sm flex-1"
            onClick={() => setOperationType('sell')}
            disabled={isProcessing}
          >
            Продажа
          </Button>
          <Button
            variant={operationType === 'refund' ? 'default' : 'outline'}
            size="sm"
            className="rounded-lg text-xs md:text-sm flex-1"
            onClick={() => setOperationType('refund')}
            disabled={isProcessing}
          >
            Возврат
          </Button>
          <Button
            variant={operationType === 'sell_correction' ? 'default' : 'outline'}
            size="sm"
            className="rounded-lg text-xs md:text-sm flex-1"
            onClick={() => setOperationType('sell_correction')}
            disabled={isProcessing}
          >
            Коррекция
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Опиши чек голосом или текстом..."
              className="rounded-2xl h-12 text-sm resize-none"
              disabled={isProcessing}
            />
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl h-12 w-12 flex-shrink-0"
            onClick={handleVoiceInput}
            disabled={isProcessing}
          >
            <Icon
              name={isListening ? 'MicOff' : 'Mic'}
              size={20}
              className={isListening ? 'text-destructive' : ''}
            />
          </Button>

          <Button
            size="icon"
            className="rounded-xl h-12 w-12 flex-shrink-0"
            onClick={handleSendMessage}
            disabled={isProcessing || !input.trim()}
          >
            {isProcessing ? (
              <Icon name="Loader2" size={20} className="animate-spin" />
            ) : (
              <Icon name="Send" size={20} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};