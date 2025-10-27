import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { IntegrationSettings } from './types';

interface EcomkassaSettingsSectionProps {
  settings: IntegrationSettings;
  isLoadingShops: boolean;
  onSettingsChange: (updates: Partial<IntegrationSettings>) => void;
  onLoadShops: () => void;
  onShopSelect: (shopId: string) => void;
}

export const EcomkassaSettingsSection = ({
  settings,
  isLoadingShops,
  onSettingsChange,
  onLoadShops,
  onShopSelect
}: EcomkassaSettingsSectionProps) => {
  return (
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
            onChange={(e) => onSettingsChange({ ecomkassa_login: e.target.value })}
            placeholder="Введите логин или оставьте пустым для использования серверного"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ecomkassa_password">Пароль API Екомкасса</Label>
          <Input
            id="ecomkassa_password"
            type="password"
            value={settings.ecomkassa_password}
            onChange={(e) => onSettingsChange({ ecomkassa_password: e.target.value })}
            placeholder="Введите пароль или оставьте пустым для использования серверного"
          />
        </div>

        <Button
          onClick={onLoadShops}
          disabled={isLoadingShops}
          variant="outline"
          className="w-full"
        >
          {isLoadingShops ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Загрузка...
            </>
          ) : (
            'Загрузить профиль организации'
          )}
        </Button>

        {settings.available_shops.length > 0 && (
          <div className="space-y-2">
            <Label>Выберите магазин</Label>
            <Select
              value={settings.group_code}
              onValueChange={onShopSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите магазин из списка" />
              </SelectTrigger>
              <SelectContent>
                {settings.available_shops.map((shop) => (
                  <SelectItem key={shop.storeId} value={shop.storeId}>
                    {shop.storeName} ({shop.storeAddress})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Alert>
              <AlertDescription>
                После выбора магазина автоматически подставятся: Group Code и Payment Address
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="group_code">Group Code (Код кассы)</Label>
          <Input
            id="group_code"
            value={settings.group_code}
            onChange={(e) => onSettingsChange({ group_code: e.target.value })}
            placeholder="Введите group_code"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="inn">ИНН</Label>
          <Input
            id="inn"
            value={settings.inn}
            onChange={(e) => onSettingsChange({ inn: e.target.value })}
            placeholder="ИНН организации"
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Загружается автоматически из профиля Екомкасса
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sno">Система налогообложения (СНО)</Label>
          <Select
            value={settings.sno}
            onValueChange={(value) => onSettingsChange({ sno: value })}
          >
            <SelectTrigger id="sno">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="osn">ОСН</SelectItem>
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
          <Select
            value={settings.default_vat}
            onValueChange={(value) => onSettingsChange({ default_vat: value })}
          >
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
          <Label htmlFor="company_email">Email организации</Label>
          <Input
            id="company_email"
            type="email"
            value={settings.company_email}
            onChange={(e) => onSettingsChange({ company_email: e.target.value })}
            placeholder="company@example.com"
          />
          <p className="text-xs text-muted-foreground">
            Используется если клиент не указал свой email
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_address">Адрес расчётов</Label>
          <Input
            id="payment_address"
            value={settings.payment_address}
            onChange={(e) => onSettingsChange({ payment_address: e.target.value })}
            placeholder="example.com"
          />
          <p className="text-xs text-muted-foreground">
            Сайт или физический адрес
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
