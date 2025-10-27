import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink } from 'lucide-react';
import { AIProvider, IntegrationSettings } from './types';

interface AIProviderModalProps {
  provider: AIProvider | null;
  settings: IntegrationSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (providerId: string, apiKey: string, folderId?: string) => void;
}

export const AIProviderModal = ({
  provider,
  settings,
  isOpen,
  onClose,
  onSave
}: AIProviderModalProps) => {
  const [apiKey, setApiKey] = useState('');
  const [folderId, setFolderId] = useState('');

  const handleOpen = (open: boolean) => {
    if (!open) {
      setApiKey('');
      setFolderId('');
      onClose();
    }
  };

  const handleSave = () => {
    if (!provider || !apiKey.trim()) return;
    
    if (provider.id === 'yandexgpt' && !folderId.trim()) {
      return;
    }
    
    onSave(provider.id, apiKey, folderId);
    setApiKey('');
    setFolderId('');
    onClose();
  };

  if (!provider) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Подключить {provider.name}</DialogTitle>
          <DialogDescription>
            {provider.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api_key">{provider.apiKeyLabel}</Label>
            <Input
              id="api_key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider.apiKeyPlaceholder}
            />
          </div>

          {provider.id === 'yandexgpt' && (
            <div className="space-y-2">
              <Label htmlFor="folder_id">Folder ID</Label>
              <Input
                id="folder_id"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                placeholder="b1gxxxxxxxxxx"
              />
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900 mb-2">
              <strong>Где получить ключ:</strong>
            </p>
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-700 hover:underline inline-flex items-center gap-1"
            >
              {provider.docsUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!apiKey.trim() || (provider.id === 'yandexgpt' && !folderId.trim())}
          >
            Подключить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
