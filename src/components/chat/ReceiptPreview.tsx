import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface ReceiptPreviewProps {
  editedData: any;
  editMode: boolean;
  isProcessing: boolean;
  updateEditedField: (path: string, value: any) => void;
  handleEditToggle: () => void;
  handleConfirmReceipt: () => void;
  handleCancelReceipt: () => void;
}

export const ReceiptPreview = ({
  editedData,
  editMode,
  isProcessing,
  updateEditedField,
  handleEditToggle,
  handleConfirmReceipt,
  handleCancelReceipt,
}: ReceiptPreviewProps) => {
  if (!editedData) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-background/50 p-2 rounded">
          <div className="text-xs text-muted-foreground">Тип операции</div>
          {editMode ? (
            <select 
              value={editedData.operation_type}
              onChange={(e) => updateEditedField('operation_type', e.target.value)}
              className="w-full bg-background border rounded px-2 py-1 text-sm"
            >
              <option value="sell">Продажа</option>
              <option value="refund">Возврат</option>
              <option value="sell_correction">Коррекция прихода</option>
              <option value="refund_correction">Коррекция расхода</option>
            </select>
          ) : (
            <div className="font-medium">{editedData.typeName}</div>
          )}
        </div>
        <div className="bg-background/50 p-2 rounded">
          <div className="text-xs text-muted-foreground">Тип оплаты</div>
          {editMode ? (
            <select 
              value={editedData.payments?.[0]?.type || '1'}
              onChange={(e) => updateEditedField('payments.0.type', e.target.value)}
              className="w-full bg-background border rounded px-2 py-1 text-sm"
            >
              <option value="0">Наличные</option>
              <option value="1">Безналичный</option>
              <option value="2">Предварительная оплата (аванс)</option>
              <option value="3">Последующая оплата (кредит)</option>
              <option value="4">Иная форма оплаты</option>
              <option value="5">Расширенный аванс</option>
              <option value="6">Расширенный кредит</option>
            </select>
          ) : (
            <div className="font-medium">
              {editedData.payments?.[0]?.type === '0' ? 'Наличные' : 
               editedData.payments?.[0]?.type === '1' ? 'Безналичный' :
               editedData.payments?.[0]?.type === '2' ? 'Аванс' :
               editedData.payments?.[0]?.type === '3' ? 'Кредит' :
               editedData.payments?.[0]?.type === '4' ? 'Иная форма' :
               editedData.payments?.[0]?.type === '5' ? 'Расширенный аванс' :
               editedData.payments?.[0]?.type === '6' ? 'Расширенный кредит' : 'Безналичный'}
            </div>
          )}
        </div>
        <div className="bg-background/50 p-2 rounded">
          <div className="text-xs text-muted-foreground">Email клиента</div>
          {editMode ? (
            <Input 
              value={editedData.client?.email || ''}
              onChange={(e) => updateEditedField('client.email', e.target.value)}
              className="h-7 text-sm"
              placeholder="email@example.com"
            />
          ) : (
            <div className="font-medium text-xs truncate">{editedData.client?.email || 'Не указан'}</div>
          )}
        </div>
        <div className="bg-background/50 p-2 rounded">
          <div className="text-xs text-muted-foreground">Телефон клиента</div>
          {editMode ? (
            <Input 
              value={editedData.client?.phone || ''}
              onChange={(e) => updateEditedField('client.phone', e.target.value)}
              className="h-7 text-sm"
              placeholder="+79991234567"
            />
          ) : (
            <div className="font-medium text-xs">{editedData.client?.phone || 'Не указан'}</div>
          )}
        </div>
        <div className="bg-background/50 p-2 rounded">
          <div className="text-xs text-muted-foreground">ИНН продавца</div>
          {editMode ? (
            <Input 
              value={editedData.company?.inn || ''}
              onChange={(e) => updateEditedField('company.inn', e.target.value)}
              className="h-7 text-sm"
              placeholder="1234567890"
            />
          ) : (
            <div className="font-medium">{editedData.company?.inn || 'Не указан'}</div>
          )}
        </div>
        <div className="bg-background/50 p-2 rounded">
          <div className="text-xs text-muted-foreground">СНО</div>
          {editMode ? (
            <select 
              value={editedData.company?.sno || 'usn_income'}
              onChange={(e) => updateEditedField('company.sno', e.target.value)}
              className="w-full bg-background border rounded px-2 py-1 text-sm"
            >
              <option value="osn">ОСН</option>
              <option value="usn_income">УСН доход</option>
              <option value="usn_income_outcome">УСН доход-расход</option>
              <option value="envd">ЕНВД</option>
              <option value="esn">ЕСН</option>
              <option value="patent">Патент</option>
            </select>
          ) : (
            <div className="font-medium text-xs">{editedData.company?.sno || 'usn_income'}</div>
          )}
        </div>
        <div className="bg-background/50 p-2 rounded col-span-2">
          <div className="text-xs text-muted-foreground">Адрес расчетов</div>
          {editMode ? (
            <Input 
              value={editedData.company?.payment_address || ''}
              onChange={(e) => updateEditedField('company.payment_address', e.target.value)}
              className="h-7 text-sm"
              placeholder="site.ru"
            />
          ) : (
            <div className="font-medium text-xs truncate">{editedData.company?.payment_address || 'Не указан'}</div>
          )}
        </div>
      </div>
      <div className="bg-background/50 p-3 rounded space-y-2">
        <div className="text-xs font-medium text-muted-foreground mb-2">Товары и услуги</div>
        {editedData.items?.map((item: any, idx: number) => (
          <div key={idx} className="space-y-2 pb-2 border-b border-border/50 last:border-0">
            {editMode ? (
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-1">
                  <Input 
                    value={item.name}
                    onChange={(e) => {
                      const newItems = [...editedData.items];
                      newItems[idx].name = e.target.value;
                      updateEditedField('items', newItems);
                    }}
                    className="h-7 text-sm"
                    placeholder="Название"
                  />
                  <Input 
                    type="number"
                    value={item.price}
                    onChange={(e) => {
                      const newItems = [...editedData.items];
                      newItems[idx].price = parseFloat(e.target.value);
                      updateEditedField('items', newItems);
                    }}
                    className="h-7 text-sm"
                    placeholder="Цена"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Input 
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...editedData.items];
                      newItems[idx].quantity = parseFloat(e.target.value);
                      updateEditedField('items', newItems);
                    }}
                    className="h-7 text-sm"
                    placeholder="Кол-во"
                  />
                  <select 
                    value={item.measurement_unit || '0'}
                    onChange={(e) => {
                      const newItems = [...editedData.items];
                      newItems[idx].measurement_unit = e.target.value;
                      updateEditedField('items', newItems);
                    }}
                    className="h-7 text-sm bg-background border rounded px-1"
                  >
                    <option value="0">Штука</option>
                    <option value="10">Грамм</option>
                    <option value="11">Килограмм</option>
                    <option value="12">Тонна</option>
                    <option value="20">Сантиметр</option>
                    <option value="21">Дециметр</option>
                    <option value="22">Метр</option>
                    <option value="30">Кв. см</option>
                    <option value="31">Кв. дм</option>
                    <option value="32">Кв. м</option>
                    <option value="40">Миллилитр</option>
                    <option value="41">Литр</option>
                    <option value="42">Куб. м</option>
                    <option value="50">кВт⋅ч</option>
                    <option value="51">Гкал</option>
                    <option value="70">Сутки</option>
                    <option value="71">Час</option>
                    <option value="72">Минута</option>
                    <option value="73">Секунда</option>
                    <option value="80">Кбайт</option>
                    <option value="81">Мбайт</option>
                    <option value="82">Гбайт</option>
                    <option value="83">Тбайт</option>
                    <option value="255">Иная</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <select 
                    value={item.vat?.type || 'none'}
                    onChange={(e) => {
                      const newItems = [...editedData.items];
                      newItems[idx].vat = { type: e.target.value };
                      updateEditedField('items', newItems);
                    }}
                    className="h-7 text-sm bg-background border rounded px-1"
                  >
                    <option value="none">Без НДС</option>
                    <option value="vat0">НДС 0%</option>
                    <option value="vat10">НДС 10%</option>
                    <option value="vat110">НДС 10/110</option>
                    <option value="vat20">НДС 20%</option>
                    <option value="vat120">НДС 20/120</option>
                  </select>
                  <select 
                    value={item.payment_object || 'commodity'}
                    onChange={(e) => {
                      const newItems = [...editedData.items];
                      newItems[idx].payment_object = e.target.value;
                      updateEditedField('items', newItems);
                    }}
                    className="h-7 text-sm bg-background border rounded px-1"
                  >
                    <option value="commodity">Товар</option>
                    <option value="excise">Подакцизный</option>
                    <option value="job">Работа</option>
                    <option value="service">Услуга</option>
                    <option value="gambling_bet">Ставка</option>
                    <option value="gambling_prize">Выигрыш</option>
                    <option value="lottery">Лотерея</option>
                    <option value="lottery_prize">Приз</option>
                    <option value="intellectual_activity">РИД</option>
                    <option value="payment">Платеж</option>
                    <option value="agent_commission">Агентское</option>
                    <option value="composite">Составной</option>
                    <option value="another">Иной</option>
                    <option value="property_right">Имущество</option>
                    <option value="non_operating_gain">Внереализ.</option>
                    <option value="insurance_premium">Страховка</option>
                    <option value="sales_tax">Торг. сбор</option>
                    <option value="resort_fee">Курорт. сбор</option>
                    <option value="deposit">Залог</option>
                  </select>
                </div>
                <select 
                  value={item.payment_method || 'full_payment'}
                  onChange={(e) => {
                    const newItems = [...editedData.items];
                    newItems[idx].payment_method = e.target.value;
                    updateEditedField('items', newItems);
                  }}
                  className="h-7 text-sm bg-background border rounded px-1"
                >
                  <option value="full_prepayment">Предоплата 100%</option>
                  <option value="prepayment">Предоплата</option>
                  <option value="advance">Аванс</option>
                  <option value="full_payment">Полный расчет</option>
                  <option value="partial_payment">Частичный расчет и кредит</option>
                  <option value="credit">Передача в кредит</option>
                  <option value="credit_payment">Оплата кредита</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="font-medium">{item.price}₽</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{item.quantity} {item.measure || 'шт'} • {item.vat === 'none' ? 'Без НДС' : item.vat}</span>
                  <span>{(item.price * item.quantity).toFixed(2)}₽</span>
                </div>
              </div>
            )}
          </div>
        ))}
        <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
          <span>Итого</span>
          <span>{editedData.total}₽</span>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button 
          onClick={handleEditToggle}
          variant="outline"
          size="sm"
          disabled={isProcessing}
        >
          <Icon name={editMode ? "Save" : "Edit"} size={16} className="mr-2" />
          {editMode ? 'Готово' : 'Редактировать'}
        </Button>
        <Button 
          onClick={handleConfirmReceipt} 
          disabled={isProcessing}
          className="flex-1"
        >
          <Icon name="Check" size={16} className="mr-2" />
          Отправить чек
        </Button>
        <Button 
          onClick={handleCancelReceipt}
          variant="outline"
          disabled={isProcessing}
        >
          <Icon name="X" size={16} />
        </Button>
      </div>
    </div>
  );
};