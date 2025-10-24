import { Message } from '@/types/message';

export const getInitialMessages = (): Message[] => {
  const savedSettings = localStorage.getItem('ecomkassa_settings');
  const settings = savedSettings ? JSON.parse(savedSettings) : {};
  
  const hasEcomkassaSettings = settings.username && settings.password && settings.group_code;
  const hasGigachatSettings = settings.gigachat_auth_key;
  
  if (!hasEcomkassaSettings || !hasGigachatSettings) {
    return [{
      id: '1',
      type: 'agent',
      content: '👋 Привет! Я помогу создавать чеки через голос или текст.\n\n**Для начала работы заполни настройки:**\n\n🔧 ЕкомКасса (логин, пароль, код группы)\n🤖 GigaChat (ключ авторизации)\n📋 Данные компании (ИНН, email, адрес)\n\n👉 Нажми **Настройки** справа вверху\n\nПосле этого просто скажи или напиши:\n*"Консультация 5000₽ для ivan@mail.ru"*',
      timestamp: new Date(),
    }];
  }
  
  return [{
    id: '1',
    type: 'agent',
    content: 'Привет! Я твой ИИ Кассир, создам чеки за тебя. Напиши запрос текстом или голосом, например: консультация по бизнесу 5000 рублей',
    timestamp: new Date(),
  }];
};

export const loadMessages = (): Message[] => {
  try {
    const saved = localStorage.getItem('chat_messages');
    
    if (!saved) {
      return getInitialMessages();
    }
    
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return getInitialMessages();
    }
    
    const loadedMessages = parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    
    return [...getInitialMessages(), ...loadedMessages];
  } catch (e) {
    console.error('Error loading messages:', e);
    localStorage.removeItem('chat_messages');
    return getInitialMessages();
  }
};

export const saveMessages = (messages: Message[]) => {
  try {
    const toSave = messages
      .filter(msg => msg.id !== '1')
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
        previewData: msg.previewData,
        receiptData: msg.receiptData
      }));
    localStorage.setItem('chat_messages', JSON.stringify(toSave));
  } catch (e) {
    console.error('Error saving messages:', e);
  }
};