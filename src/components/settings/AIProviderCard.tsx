import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink } from 'lucide-react';
import { AIProvider, IntegrationSettings } from './types';

interface AIProviderCardProps {
  provider: AIProvider;
  settings: IntegrationSettings;
  activeProvider: string;
  onProviderSelect: (providerId: string) => void;
  onApiKeyChange: (providerId: string, value: string) => void;
  onYandexFolderIdChange: (value: string) => void;
}

export const AIProviderCard = ({
  provider,
  settings,
  activeProvider,
  onProviderSelect,
  onApiKeyChange,
  onYandexFolderIdChange
}: AIProviderCardProps) => {
  const isActive = activeProvider === provider.id;
  const hasKey = provider.isActive;

  const getApiKeyValue = () => {
    switch (provider.id) {
      case 'gigachat':
        return settings.gigachat_auth_key;
      case 'openrouter':
        return settings.openrouter_api_key;
      case 'anthropic':
        return settings.anthropic_api_key;
      case 'openai':
        return settings.openai_api_key;
      case 'yandexgpt':
        return settings.yandexgpt_api_key;
      default:
        return '';
    }
  };

  return (
    <div
      className={`p-4 border rounded-lg transition-all ${
        isActive ? 'border-primary bg-primary/5' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{provider.name}</h3>
            {isActive && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Активен
              </span>
            )}
            {!isActive && hasKey && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                Настроен
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{provider.description}</p>
        </div>
        {hasKey && !isActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onProviderSelect(provider.id)}
          >
            Активировать
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${provider.id}_key`}>{provider.apiKeyLabel}</Label>
        <Input
          id={`${provider.id}_key`}
          type="password"
          value={getApiKeyValue()}
          onChange={(e) => onApiKeyChange(provider.id, e.target.value)}
          placeholder={provider.apiKeyPlaceholder}
          className={hasKey ? 'border-green-300' : ''}
        />

        {provider.id === 'yandexgpt' && (
          <div className="mt-2">
            <Label htmlFor="yandex_folder_id">Folder ID</Label>
            <Input
              id="yandex_folder_id"
              value={settings.yandexgpt_folder_id}
              onChange={(e) => onYandexFolderIdChange(e.target.value)}
              placeholder="b1gxxxxxxxxxx"
            />
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Получить ключ:{' '}
          <a
            href={provider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            {provider.docsUrl.replace('https://', '')}
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>
    </div>
  );
};
