import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';

interface AIProvider {
  id: string;
  name: string;
  description: string;
  secret_name: string;
  has_secret: boolean;
}

interface AISettingsSectionNewProps {
  adminToken: string;
}

export const AISettingsSectionNew = ({ adminToken }: AISettingsSectionNewProps) => {
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/0924c3f7-bb48-46bb-9dbb-fddba37c9280', {
        headers: {
          'X-Admin-Token': adminToken
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      setActiveProvider(data.active_provider || '');
      setProviders(data.available_providers || []);
    } catch (error) {
      toast.error('Ошибка загрузки настроек ИИ');
    } finally {
      setLoading(false);
    }
  };

  const validateKey = async (providerId: string) => {
    const validatingToast = toast.loading('Проверяю API ключ...');
    
    try {
      const response = await fetch('https://functions.poehali.dev/0924c3f7-bb48-46bb-9dbb-fddba37c9280', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken
        },
        body: JSON.stringify({ provider_id: providerId })
      });

      const data = await response.json();
      toast.dismiss(validatingToast);

      if (!response.ok) {
        toast.error(data.message || data.error || 'Ключ невалиден');
        return false;
      }

      toast.success('Ключ валиден ✓');
      return true;
    } catch (error) {
      toast.dismiss(validatingToast);
      toast.error('Ошибка подключения');
      return false;
    }
  };

  const handleProviderChange = async (providerId: string) => {
    const isValid = await validateKey(providerId);
    
    if (isValid) {
      setActiveProvider(providerId);
      toast.success(providerId ? `Провайдер активирован ✓` : 'Провайдер отключен');
    }
  };

  const handleTestKey = async (providerId: string) => {
    await validateKey(providerId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  const activeProviderData = providers.find(p => p.id === activeProvider);
  const providersWithKeys = providers.filter(p => p.has_secret);
  const hasAnyKey = providersWithKeys.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройки ИИ-провайдера</CardTitle>
        <CardDescription>
          Выберите активного провайдера для обработки запросов. API-ключи хранятся в секретах проекта.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeProviderData ? (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-800">
                <Icon name="Check" size={16} />
                <span>
                  <strong>Подключен:</strong> {activeProviderData.name}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleProviderChange('')}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                Отключить
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertDescription className="flex items-center gap-2 text-gray-700">
              <Icon name="Plug" size={16} />
              <span>AI провайдер не подключен. {hasAnyKey ? 'Активируйте один из провайдеров с настроенным ключом.' : 'Добавьте секрет для провайдера.'}</span>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {providers.map((provider) => {
            const isActive = activeProvider === provider.id;
            const hasOtherActiveKey = hasAnyKey && !provider.has_secret;
            
            if (isActive) {
              return (
                <div
                  key={provider.id}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-green-500 bg-green-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-green-900">{provider.name}</h3>
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">
                        Активно
                      </span>
                    </div>
                    <p className="text-sm text-green-700">{provider.description}</p>
                  </div>
                </div>
              );
            }
            
            if (activeProvider || hasOtherActiveKey) return null;
            
            return (
              <div
                key={provider.id}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{provider.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {provider.has_secret ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Icon name="CheckCircle2" size={12} />
                        Ключ настроен ({provider.secret_name})
                      </span>
                    ) : (
                      <span className="text-xs text-orange-600 flex items-center gap-1">
                        <Icon name="AlertCircle" size={12} />
                        Требуется настроить секрет: {provider.secret_name}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {provider.has_secret && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestKey(provider.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Icon name="TestTube2" size={14} className="mr-1" />
                      Проверить ключ
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProviderChange(provider.id)}
                    disabled={!provider.has_secret}
                  >
                    Активировать
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {providers.some(p => !p.has_secret) && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm text-blue-800">
              <Icon name="Info" size={14} className="inline mr-1" />
              Для активации провайдера добавьте соответствующий секрет в настройках проекта.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};