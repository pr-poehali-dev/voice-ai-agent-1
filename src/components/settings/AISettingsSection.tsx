import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIProviderCard } from './AIProviderCard';
import { AIProvider, IntegrationSettings } from './types';

interface AISettingsSectionProps {
  settings: IntegrationSettings;
  aiProviders: AIProvider[];
  onProviderSelect: (providerId: string) => void;
  onApiKeyChange: (providerId: string, value: string) => void;
  onYandexFolderIdChange: (value: string) => void;
}

export const AISettingsSection = ({
  settings,
  aiProviders,
  onProviderSelect,
  onApiKeyChange,
  onYandexFolderIdChange
}: AISettingsSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройки ИИ-кассира</CardTitle>
        <CardDescription>
          Выберите AI провайдера для обработки запросов. Активным становится провайдер с заполненным API ключом.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings.active_ai_provider && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              ✅ Активный провайдер: <strong>{aiProviders.find(p => p.id === settings.active_ai_provider)?.name}</strong>
            </AlertDescription>
          </Alert>
        )}

        {aiProviders.map((provider) => (
          <AIProviderCard
            key={provider.id}
            provider={provider}
            settings={settings}
            activeProvider={settings.active_ai_provider}
            onProviderSelect={onProviderSelect}
            onApiKeyChange={onApiKeyChange}
            onYandexFolderIdChange={onYandexFolderIdChange}
          />
        ))}
      </CardContent>
    </Card>
  );
};
