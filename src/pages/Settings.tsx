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

interface Shop {
  storeId: string;
  storeName: string;
  storeAddress: string;
}

interface IntegrationSettings {
  group_code: string;
  inn: string;
  sno: string;
  default_vat: string;
  company_email: string;
  payment_address: string;
  gigachat_auth_key: string;
  ecomkassa_login: string;
  ecomkassa_password: string;
  available_shops: Shop[];
}

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<IntegrationSettings>({
    group_code: '',
    inn: '',
    sno: 'usn_income',
    default_vat: 'none',
    company_email: '',
    payment_address: '',
    gigachat_auth_key: '',
    ecomkassa_login: '',
    ecomkassa_password: '',
    available_shops: []
  });
  const [isLoadingShops, setIsLoadingShops] = useState(false);

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
        gigachat_auth_key: parsed.gigachat_auth_key || '',
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

      setSettings({ 
        ...settings, 
        inn: taxIdentity,
        sno: taxVariant,
        available_shops: shops 
      });
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
      setSettings({
        ...settings,
        group_code: shop.storeId,
        payment_address: shop.storeAddress
      });
      toast.info(`Выбран магазин: ${shop.storeName}`);
    }
  };

  const handleSave = () => {
    localStorage.setItem('ecomkassa_settings', JSON.stringify(settings));
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
                Ключи API хранятся безопасно на сервере
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gigachat_auth_key">GigaChat Authorization Key</Label>
                <Input
                  id="gigachat_auth_key"
                  type="password"
                  value={settings.gigachat_auth_key}
                  onChange={(e) => setSettings({ ...settings, gigachat_auth_key: e.target.value })}
                  placeholder="Введите ключ или оставьте пустым для использования серверного"
                />
                <p className="text-sm text-muted-foreground">
                  Формат: base64(Client_ID:Client_Secret). Получить ключи можно в{' '}
                  <a 
                    href="https://developers.sber.ru/studio/workspaces" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    GigaChat Studio
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Параметры Екомкасса</CardTitle>
              <CardDescription>
                API ключи хранятся на сервере, настройки организации — локально
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ecomkassa_login">Логин API Екомкасса</Label>
                <Input
                  id="ecomkassa_login"
                  value={settings.ecomkassa_login}
                  onChange={(e) => setSettings({ ...settings, ecomkassa_login: e.target.value })}
                  placeholder="Введите логин или оставьте пустым для использования серверного"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ecomkassa_password">Пароль API Екомкасса</Label>
                <Input
                  id="ecomkassa_password"
                  type="password"
                  value={settings.ecomkassa_password}
                  onChange={(e) => setSettings({ ...settings, ecomkassa_password: e.target.value })}
                  placeholder="Введите пароль или оставьте пустым для использования серверного"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="group_code">Магазин</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadShops}
                    disabled={isLoadingShops || !settings.ecomkassa_login || !settings.ecomkassa_password}
                  >
                    {isLoadingShops ? 'Загрузка...' : 'Загрузить профиль'}
                  </Button>
                </div>
                {settings.available_shops.length > 0 ? (
                  <Select value={settings.group_code} onValueChange={handleShopSelect}>
                    <SelectTrigger id="group_code">
                      <SelectValue placeholder="Выберите магазин" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.available_shops.map((shop) => (
                        <SelectItem key={shop.storeId} value={shop.storeId}>
                          {shop.storeName} - {shop.storeId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="group_code"
                    value={settings.group_code}
                    onChange={(e) => setSettings({ ...settings, group_code: e.target.value })}
                    placeholder="Введите ID магазина или загрузите список"
                  />
                )}
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