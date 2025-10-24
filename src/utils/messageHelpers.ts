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
      content: '👋 Привет! Я твой ИИ Кассир.\n\nДля начала работы нужно настроить интеграции:\n\n🔧 **Обязательные настройки:**\n\n1. **ЕкомКасса** — для отправки чеков в налоговую\n   • Логин и пароль от личного кабинета\n   • Код группы касс\n\n2. **GigaChat** — для распознавания запросов на русском\n   • Ключ авторизации API\n\n📝 **Дополнительные данные:**\n   • ИНН компании\n   • Email компании\n   • Адрес расчетов\n   • СНО (система налогообложения)\n\n👉 Перейди в **Настройки** (кнопка справа вверху) и заполни все поля.\n\nПосле настройки ты сможешь создавать чеки голосом или текстом, например:\n*"Консультация по бизнесу 5000 рублей для ivan@mail.ru"*',
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
