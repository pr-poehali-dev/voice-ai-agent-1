import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IntegrationSettings {
  group_code: string;
  inn: string;
  sno: string;
  default_vat: string;
  company_email: string;
  payment_address: string;
}

interface ApiSettings {
  ecomkassa_login: string;
  ecomkassa_password: string;
  gigachat_auth_key: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<IntegrationSettings>({
    group_code: '',
    inn: '',
    sno: 'usn_income',
    default_vat: 'none',
    company_email: '',
    payment_address: ''
  });

  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    ecomkassa_login: '',
    ecomkassa_password: '',
    gigachat_auth_key: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('ecomkassa_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    
    const savedApi = localStorage.getItem('api_settings');
    if (savedApi) {
      setApiSettings(JSON.parse(savedApi));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('ecomkassa_settings', JSON.stringify(settings));
    localStorage.setItem('api_settings', JSON.stringify(apiSettings));
    toast.success('Настройки сохранены');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Настройки интеграции</h1>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Интеграция с ИИ</CardTitle>
              <CardDescription>
                Настройка подключения к GigaChat для обработки текста
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gigachat_auth_key">GigaChat Authorization Key</Label>
                <Input
                  id="gigachat_auth_key"
                  type="password"
                  value={apiSettings.gigachat_auth_key}
                  onChange={(e) => setApiSettings({ ...apiSettings, gigachat_auth_key: e.target.value })}
                  placeholder="Введите Authorization Key (base64)"
                />
                <p className="text-sm text-muted-foreground">
                  Формат: base64(Client_ID:Client_Secret)
                </p>
              </div>
              
              <Alert>
                <AlertDescription className="flex items-center gap-2">
                  <span>Получить ключи можно в</span>
                  <a 
                    href="https://developers.sber.ru/studio/workspaces" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    GigaChat Studio
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Параметры Екомкасса</CardTitle>
              <CardDescription>
                Настройки API и параметры организации для создания чеков
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ecomkassa_login">Логин API Екомкасса</Label>
                <Input
                  id="ecomkassa_login"
                  value={apiSettings.ecomkassa_login}
                  onChange={(e) => setApiSettings({ ...apiSettings, ecomkassa_login: e.target.value })}
                  placeholder="Введите логин"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ecomkassa_password">Пароль API Екомкасса</Label>
                <Input
                  id="ecomkassa_password"
                  type="password"
                  value={apiSettings.ecomkassa_password}
                  onChange={(e) => setApiSettings({ ...apiSettings, ecomkassa_password: e.target.value })}
                  placeholder="Введите пароль"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group_code">ID магазина (Group Code)</Label>
              <Input
                id="group_code"
                value={settings.group_code}
                onChange={(e) => setSettings({ ...settings, group_code: e.target.value })}
                placeholder="Введите ID магазина"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inn">ИНН организации</Label>
              <Input
                id="inn"
                value={settings.inn}
                onChange={(e) => setSettings({ ...settings, inn: e.target.value })}
                placeholder="1234567890"
                maxLength={12}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sno">Система налогообложения (СНО)</Label>
              <Select value={settings.sno} onValueChange={(value) => setSettings({ ...settings, sno: value })}>
                <SelectTrigger id="sno">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="osn">ОСН - Общая</SelectItem>
                  <SelectItem value="usn_income">УСН доход</SelectItem>
                  <SelectItem value="usn_income_outcome">УСН доход-расход</SelectItem>
                  <SelectItem value="envd">ЕНВД</SelectItem>
                  <SelectItem value="esn">ЕСН</SelectItem>
                  <SelectItem value="patent">Патент</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_vat">НДС по умолчанию</Label>
              <Select value={settings.default_vat} onValueChange={(value) => setSettings({ ...settings, default_vat: value })}>
                <SelectTrigger id="default_vat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без НДС</SelectItem>
                  <SelectItem value="vat0">НДС 0%</SelectItem>
                  <SelectItem value="vat10">НДС 10%</SelectItem>
                  <SelectItem value="vat20">НДС 20%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_email">Email компании (по умолчанию)</Label>
              <Input
                id="company_email"
                type="email"
                value={settings.company_email}
                onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                placeholder="company@example.com"
              />
              <p className="text-sm text-muted-foreground">
                Используется если клиент не указал свой email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_address">Адрес сайта (payment_address)</Label>
              <Input
                id="payment_address"
                value={settings.payment_address}
                onChange={(e) => setSettings({ ...settings, payment_address: e.target.value })}
                placeholder="example.com"
              />
            </div>

            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-full" size="lg">
            <Save className="h-4 w-4 mr-2" />
            Сохранить все настройки
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;