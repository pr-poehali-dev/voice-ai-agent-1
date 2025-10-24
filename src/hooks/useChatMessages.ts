import { useState, useEffect } from 'react';
import { Message } from '@/types/message';
import { loadMessages, saveMessages } from '@/utils/messageHelpers';

export const useChatMessages = () => {
  const [messages, setMessages] = useState<Message[]>(loadMessages());

  useEffect(() => {
    const timer = setTimeout(() => {
      saveMessages(messages);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [messages]);

  return { messages, setMessages };
};
