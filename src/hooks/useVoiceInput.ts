import { useState } from 'react';
import { toast } from 'sonner';

export const useVoiceInput = (setInput: (value: string) => void) => {
  const [isListening, setIsListening] = useState(false);

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

  return { isListening, handleVoiceInput };
};
