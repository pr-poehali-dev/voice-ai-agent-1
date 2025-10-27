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

  const handleConnect = (providerId: string, apiKey: string, folderId?: string) => {
    const keyMap: Record<string, string> = {
      gigachat: 'gigachat_auth_key',
      yandexgpt: 'yandexgpt_api_key'
    };

    const key = keyMap[providerId];
    if (!key) return;

    const updatedSettings = {
      ...settings,
      [key]: apiKey,
      active_ai_provider: providerId
    };

    if (providerId === 'yandexgpt' && folderId) {
      updatedSettings.yandexgpt_folder_id = folderId;
    }

    setSettings(updatedSettings);
    localStorage.setItem('ecomkassa_settings', JSON.stringify(updatedSettings));
    
    const provider = aiProviders.find(p => p.id === providerId);
    toast.success(`Подключен провайдер: ${provider?.name}`);
  };

  const handleDisconnect = () => {
    const currentProvider = settings.active_ai_provider;
    
    const keyMap: Record<string, string> = {
      gigachat: 'gigachat_auth_key',
      yandexgpt: 'yandexgpt_api_key'
    };

    const key = keyMap[currentProvider];
    
    const updatedSettings = {
      ...settings,
      [key]: '',
      active_ai_provider: ''
    };

    if (currentProvider === 'yandexgpt') {
      updatedSettings.yandexgpt_folder_id = '';
    }

    setSettings(updatedSettings);
    localStorage.setItem('ecomkassa_settings', JSON.stringify(updatedSettings));
    toast.info('AI провайдер отключен');
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
    handleConnect,
    handleDisconnect,
    updateSettings,
    saveSettings
  };
};