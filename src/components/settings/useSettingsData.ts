import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { IntegrationSettings, AIProvider, Shop } from './types';

export const useSettingsData = () => {
  const [settings, setSettings] = useState<IntegrationSettings>({
    group_code: '',
    inn: '',
    sno: 'usn_income',
    default_vat: 'none',
    company_email: '',
    payment_address: '',
    active_ai_provider: '',
    gigachat_auth_key: '',
    anthropic_api_key: '',
    openrouter_api_key: '',
    openai_api_key: '',
    yandexgpt_api_key: '',
    yandexgpt_folder_id: '',
    ecomkassa_login: '',
    ecomkassa_password: '',
    available_shops: []
  });
  const [isLoadingShops, setIsLoadingShops] = useState(false);

  const aiProviders: AIProvider[] = [
    {
      id: 'gigachat',
      name: 'GigaChat (Сбер)',
      description: 'Российская модель от Сбера',
      apiKeyLabel: 'Authorization Key',
      apiKeyPlaceholder: 'base64(Client_ID:Client_Secret)',
      docsUrl: 'https://developers.sber.ru/studio/workspaces',
      isActive: !!settings.gigachat_auth_key
    },
    {
      id: 'openrouter',
      name: 'Claude via OpenRouter',
      description: 'Claude 3.5 через OpenRouter (работает в РФ)',
      apiKeyLabel: 'OpenRouter API Key',
      apiKeyPlaceholder: 'sk-or-v1-...',
      docsUrl: 'https://openrouter.ai',
      isActive: !!settings.openrouter_api_key
    },
    {
      id: 'anthropic',
      name: 'Claude (Anthropic)',
      description: 'Прямое подключение к Anthropic API',
      apiKeyLabel: 'Anthropic API Key',
      apiKeyPlaceholder: 'sk-ant-api03-...',
      docsUrl: 'https://console.anthropic.com',
      isActive: !!settings.anthropic_api_key
    },
    {
      id: 'openai',
      name: 'OpenAI GPT-4',
      description: 'GPT-4 Turbo от OpenAI',
      apiKeyLabel: 'OpenAI API Key',
      apiKeyPlaceholder: 'sk-proj-...',
      docsUrl: 'https://platform.openai.com/api-keys',
      isActive: !!settings.openai_api_key
    },
    {
      id: 'yandexgpt',
      name: 'YandexGPT',
      description: 'Российская модель от Яндекса',
      apiKeyLabel: 'YandexGPT API Key',
      apiKeyPlaceholder: 'AQVNxxxxxx...',
      docsUrl: 'https://cloud.yandex.ru/docs/yandexgpt',
      isActive: !!settings.yandexgpt_api_key && !!settings.yandexgpt_folder_id
    }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('ecomkassa_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings({
        group_code: parsed.group_code || '',
        inn: parsed.inn || '',
        sno: parsed.sno || 'usn_income',
        default_vat: parsed.default_vat || 'none',
        company_email: parsed.company_email || '',
        payment_address: parsed.payment_address || '',
        active_ai_provider: parsed.active_ai_provider || '',
        gigachat_auth_key: parsed.gigachat_auth_key || '',
        anthropic_api_key: parsed.anthropic_api_key || '',
        openrouter_api_key: parsed.openrouter_api_key || '',
        openai_api_key: parsed.openai_api_key || '',
        yandexgpt_api_key: parsed.yandexgpt_api_key || '',
        yandexgpt_folder_id: parsed.yandexgpt_folder_id || '',
        ecomkassa_login: parsed.ecomkassa_login || '',
        ecomkassa_password: parsed.ecomkassa_password || '',
        available_shops: parsed.available_shops || []
      });
    }
  }, []);

  const loadShops = async () => {
    if (!settings.ecomkassa_login || !settings.ecomkassa_password) {
      toast.error('Введите логин и пароль API Екомкасса');
      return;
    }

    setIsLoadingShops(true);
    try {
      const response = await fetch('https://functions.poehali.dev/43959fb6-01cc-48d6-83ce-8160cf016d09', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          login: settings.ecomkassa_login,
          password: settings.ecomkassa_password,
          endpoint: '/api/mobile/v1/profile/firm'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || `Ошибка ${response.status}`;
        toast.error(`API Екомкасса: ${errorMsg}`);
        return;
      }

      if (typeof data === 'string') {
        toast.error('API вернул некорректные данные. Проверьте логин и пароль.');
        return;
      }

      if (data.errorCode !== 0) {
        toast.error(`API Екомкасса: ${data.error || 'Неизвестная ошибка'}`);
        return;
      }

      const payload = data.payload || {};
      const taxIdentity = payload.taxIdentity || '';
      const taxVariant = payload.taxVariant || 'usn_income';
      const stores = payload.stores || [];

      const shops: Shop[] = stores.map((shop: any) => ({
        storeId: shop.storeId || '',
        storeName: shop.storeName || 'Без названия',
        storeAddress: shop.storeAddress || ''
      }));

      const updatedSettings = {
        ...settings,
        inn: taxIdentity,
        sno: taxVariant,
        available_shops: shops
      };

      setSettings(updatedSettings);
      localStorage.setItem('ecomkassa_settings', JSON.stringify(updatedSettings));
      toast.success(`Загружен профиль. Магазинов: ${shops.length}`);
    } catch (error) {
      toast.error('Ошибка соединения с сервером');
    } finally {
      setIsLoadingShops(false);
    }
  };

  const handleShopSelect = (shopId: string) => {
    const shop = settings.available_shops.find(s => s.storeId === shopId);
    if (shop) {
      const updatedSettings = {
        ...settings,
        group_code: shop.storeId,
        payment_address: shop.storeAddress
      };
      setSettings(updatedSettings);
      localStorage.setItem('ecomkassa_settings', JSON.stringify(updatedSettings));
      toast.info(`Выбран магазин: ${shop.storeName}`);
    }
  };

  const handleProviderSelect = (providerId: string) => {
    const provider = aiProviders.find(p => p.id === providerId);
    if (provider && provider.isActive) {
      const updatedSettings = { ...settings, active_ai_provider: providerId };
      setSettings(updatedSettings);
      localStorage.setItem('ecomkassa_settings', JSON.stringify(updatedSettings));
      toast.success(`Активирован провайдер: ${provider.name}`);
    } else {
      toast.error('Сначала укажите API ключ для этого провайдера');
    }
  };

  const handleApiKeyChange = (providerId: string, value: string) => {
    const keyMap: Record<string, string> = {
      gigachat: 'gigachat_auth_key',
      openrouter: 'openrouter_api_key',
      anthropic: 'anthropic_api_key',
      openai: 'openai_api_key',
      yandexgpt: 'yandexgpt_api_key'
    };

    const key = keyMap[providerId];
    if (key) {
      const updatedSettings = { ...settings, [key]: value };

      if (value && !settings.active_ai_provider) {
        updatedSettings.active_ai_provider = providerId;
      }

      if (!value && settings.active_ai_provider === providerId) {
        updatedSettings.active_ai_provider = '';
      }

      setSettings(updatedSettings);
    }
  };

  const updateSettings = (updates: Partial<IntegrationSettings>) => {
    setSettings({ ...settings, ...updates });
  };

  const saveSettings = () => {
    localStorage.setItem('ecomkassa_settings', JSON.stringify(settings));
    toast.success('Настройки сохранены');
  };

  return {
    settings,
    aiProviders,
    isLoadingShops,
    loadShops,
    handleShopSelect,
    handleProviderSelect,
    handleApiKeyChange,
    updateSettings,
    saveSettings
  };
};
