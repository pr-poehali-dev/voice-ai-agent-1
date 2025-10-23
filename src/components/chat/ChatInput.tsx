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
    <div className="relative">
      <div className="flex gap-3 items-end">
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

        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Button
              variant={operationType === 'sell' ? 'default' : 'outline'}
              size="sm"
              className="rounded-lg"
              onClick={() => setOperationType('sell')}
              disabled={isProcessing}
            >
              Продажа
            </Button>
            <Button
              variant={operationType === 'refund' ? 'default' : 'outline'}
              size="sm"
              className="rounded-lg"
              onClick={() => setOperationType('refund')}
              disabled={isProcessing}
            >
              Возврат
            </Button>
            <Button
              variant={operationType === 'sell_correction' ? 'default' : 'outline'}
              size="sm"
              className="rounded-lg"
              onClick={() => setOperationType('sell_correction')}
              disabled={isProcessing}
            >
              Коррекция
            </Button>
          </div>

          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Опиши чек голосом или текстом..."
              className="pr-12 rounded-2xl h-12 text-sm resize-none"
              disabled={isProcessing}
            />
            <Button
              size="icon"
              className="absolute right-1 top-1 rounded-xl h-10 w-10"
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
    </div>
  );
};
