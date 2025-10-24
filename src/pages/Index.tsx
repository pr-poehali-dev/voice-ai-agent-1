import { useState } from 'react';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useReceiptState } from '@/hooks/useReceiptState';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useReceiptHandlers } from '@/hooks/useReceiptHandlers';

const Index = () => {
  const [input, setInput] = useState('');
  const [operationType, setOperationType] = useState('sell');

  const { messages, setMessages } = useChatMessages();
  
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
