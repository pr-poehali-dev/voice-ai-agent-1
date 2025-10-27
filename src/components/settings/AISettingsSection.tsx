import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, ChevronRight, Plug } from 'lucide-react';
import { AIProviderModal } from './AIProviderModal';
import { AIProvider, IntegrationSettings } from './types';

interface AISettingsSectionProps {
  settings: IntegrationSettings;
  aiProviders: AIProvider[];
  onConnect: (providerId: string, apiKey: string, folderId?: string) => void;
  onDisconnect: () => void;
}

export const AISettingsSection = ({
  settings,
  aiProviders,
  onConnect,
  onDisconnect
}: AISettingsSectionProps) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeProvider = aiProviders.find(p => p.id === settings.active_ai_provider);

  const handleProviderClick = (provider: AIProvider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const handleSave = (providerId: string, apiKey: string, folderId?: string) => {
    onConnect(providerId, apiKey, folderId);
    setIsModalOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Настройки ИИ-кассира</CardTitle>
          <CardDescription>
            Подключите AI провайдера для обработки запросов. Активным может быть только один провайдер.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeProvider ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-800">
                  <Check className="h-4 w-4" />
                  <span>
                    <strong>Подключен:</strong> {activeProvider.name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDisconnect}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  Отключить
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertDescription className="flex items-center gap-2 text-gray-700">
                <Plug className="h-4 w-4" />
                <span>AI провайдер не подключен. Выберите провайдера из списка ниже.</span>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            {aiProviders
              .filter((provider) => {
                const isActive = settings.active_ai_provider === provider.id;
                return !activeProvider || isActive;
              })
              .map((provider) => {
              const isActive = settings.active_ai_provider === provider.id;
              
              return (
                <button
                  key={provider.id}
                  onClick={() => handleProviderClick(provider)}
                  disabled={!!activeProvider && !isActive}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all text-left ${
                    isActive
                      ? 'border-green-500 bg-green-50'
                      : activeProvider
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-primary hover:bg-primary/5 cursor-pointer'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${isActive ? 'text-green-900' : activeProvider ? 'text-gray-900' : 'text-white'}`}>{provider.name}</h3>
                      {isActive && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                          Активен
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${isActive ? 'text-green-700' : activeProvider ? 'text-muted-foreground' : 'text-gray-300'}`}>{provider.description}</p>
                  </div>
                  {!activeProvider && (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                  {isActive && (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AIProviderModal
        provider={selectedProvider}
        settings={settings}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
};