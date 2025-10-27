import { useState, useRef, useEffect } from 'react';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useReceiptState } from '@/hooks/useReceiptState';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useReceiptHandlers } from '@/hooks/useReceiptHandlers';
import { getUserId } from '@/utils/userId';

interface IndexProps {
  repeatCommand: string;
  setRepeatCommand: (value: string) => void;
}

const Index = ({ repeatCommand, setRepeatCommand }: IndexProps) => {
  const [input, setInput] = useState('');
  const [operationType, setOperationType] = useState('sell');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { messages, setMessages } = useChatMessages();
  
  useEffect(() => {
    getUserId();
  }, []);
  
  useEffect(() => {
    if (repeatCommand) {
      setInput(repeatCommand);
      setRepeatCommand('');
    }
  }, [repeatCommand, setRepeatCommand]);
  
  const {
    pendingReceipt,
    setPendingReceipt,
    editMode,
    setEditMode,
    editedData,
    setEditedData,
    lastReceiptData,
    setLastReceiptData,
    updateEditedField
  } = useReceiptState();

  const { isListening, handleVoiceInput } = useVoiceInput(setInput);

  const {
    isProcessing,
    handleSendMessage: sendMessage,
    handleConfirmReceipt,
    handleCancelReceipt,
    handleEditToggle
  } = useReceiptHandlers(
    setMessages,
    pendingReceipt,
    setPendingReceipt,
    editedData,
    setEditedData,
    lastReceiptData,
    setLastReceiptData,
    setEditMode
  );

  const handleSendMessage = () => {
    sendMessage(input, operationType, setInput);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-purple-950/20 flex flex-col">
      <div className="w-full max-w-5xl mx-auto h-full flex flex-col px-3 py-4 md:px-6 md:py-6">
        <ChatHeader />

        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto mb-4 md:mb-6 space-y-4 overflow-x-hidden">
          {messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const userMessageContext = prevMessage?.type === 'user' ? prevMessage.content : undefined;
            
            return (
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
                userMessage={userMessageContext}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {showScrollButton && (
          <div className="flex justify-center mb-3">
            <button
              onClick={scrollToBottom}
              className="inline-flex items-center gap-2 bg-background/80 hover:bg-background border border-border text-foreground rounded-full pl-4 pr-3 py-1.5 shadow-sm hover:shadow-md transition-all text-sm font-medium backdrop-blur-sm"
              aria-label="Прокрутить вниз"
            >
              Вниз
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
          </div>
        )}

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