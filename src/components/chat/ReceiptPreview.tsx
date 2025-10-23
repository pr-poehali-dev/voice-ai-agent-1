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
                    title="Предмет расчета (тег 1212)"
                  >
                    <option value="commodity">1. Товар</option>
                    <option value="excise">2. Подакцизный товар</option>
                    <option value="job">3. Работа</option>
                    <option value="service">4. Услуга</option>
                    <option value="gambling_bet">5. Ставка азартной игры</option>
                    <option value="gambling_prize">6. Выигрыш азартной игры</option>
                    <option value="lottery">7. Лотерейный билет</option>
                    <option value="lottery_prize">8. Выигрыш лотереи</option>
                    <option value="intellectual_activity">9. РИД</option>
                    <option value="payment">10. Платеж</option>
                    <option value="agent_commission">11. Агентское вознаграждение</option>
                    <option value="composite">12. Составной</option>
                    <option value="another">13. Иной</option>
                    <option value="property_right">14. Имущественное право</option>
                    <option value="non_operating_gain">15. Внереализационный доход</option>
                    <option value="insurance_premium">16. Страховые взносы</option>
                    <option value="sales_tax">17. Торговый сбор</option>
                    <option value="resort_fee">18. Курортный сбор</option>
                    <option value="deposit">19. Залог</option>
                    <option value="expense">20. Расход (ФФД 1.2)</option>
                    <option value="pension_insurance">21. Пенсионное страхование ИП (ФФД 1.2)</option>
                    <option value="health_insurance">22. Медицинское страхование ИП (ФФД 1.2)</option>
                    <option value="social_insurance">23. Социальное страхование ИП (ФФД 1.2)</option>
                    <option value="casino_payment">24. Выплата казино (ФФД 1.2)</option>
                    <option value="vendor_commission">25. Вознаграждение оператора (ФФД 1.2)</option>
                    <option value="marked_commodity">30. Товар с маркировкой (ФФД 1.2)</option>
                    <option value="marked_excise">31. Подакцизный с маркировкой (ФФД 1.2)</option>
                    <option value="unmarked_commodity">32. Товар без маркировки (ФФД 1.2)</option>
                    <option value="unmarked_excise">33. Подакцизный без маркировки (ФФД 1.2)</option>
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
                  title="Признак способа расчета (тег 1214)"
                >
                  <option value="full_prepayment">1. Предоплата 100%</option>
                  <option value="prepayment">2. Предоплата</option>
                  <option value="advance">3. Аванс</option>
                  <option value="full_payment">4. Полный расчет</option>
                  <option value="partial_payment">5. Частичный расчет и кредит</option>
                  <option value="credit">6. Передача в кредит</option>
                  <option value="credit_payment">7. Оплата кредита</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="font-medium">{item.price}₽</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>{item.quantity} {item.measure || 'шт'} • {item.vat === 'none' ? 'Без НДС' : item.vat}</span>
                  <span className="text-right">{(item.price * item.quantity).toFixed(2)}₽</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Предмет: {
                    item.payment_object === 'commodity' ? 'Товар' :
                    item.payment_object === 'excise' ? 'Подакцизный' :
                    item.payment_object === 'job' ? 'Работа' :
                    item.payment_object === 'service' ? 'Услуга' :
                    item.payment_object === 'gambling_bet' ? 'Ставка' :
                    item.payment_object === 'gambling_prize' ? 'Выигрыш' :
                    item.payment_object === 'lottery' ? 'Лотерея' :
                    item.payment_object === 'lottery_prize' ? 'Приз' :
                    item.payment_object === 'intellectual_activity' ? 'РИД' :
                    item.payment_object === 'payment' ? 'Платеж' :
                    item.payment_object === 'agent_commission' ? 'Агентское' :
                    item.payment_object === 'composite' ? 'Составной' :
                    item.payment_object === 'another' ? 'Иной' :
                    item.payment_object === 'property_right' ? 'Имущество' :
                    item.payment_object === 'non_operating_gain' ? 'Внереализ.' :
                    item.payment_object === 'insurance_premium' ? 'Страховка' :
                    item.payment_object === 'sales_tax' ? 'Торг. сбор' :
                    item.payment_object === 'resort_fee' ? 'Курорт. сбор' :
                    item.payment_object === 'deposit' ? 'Залог' :
                    item.payment_object === 'expense' ? 'Расход' :
                    item.payment_object === 'pension_insurance' ? 'Пенсионное' :
                    item.payment_object === 'health_insurance' ? 'Медицинское' :
                    item.payment_object === 'social_insurance' ? 'Социальное' :
                    item.payment_object === 'casino_payment' ? 'Выплата казино' :
                    item.payment_object === 'vendor_commission' ? 'Комиссия' :
                    item.payment_object === 'marked_commodity' ? 'Товар (марк.)' :
                    item.payment_object === 'marked_excise' ? 'Подакциз (марк.)' :
                    item.payment_object === 'unmarked_commodity' ? 'Товар (без марк.)' :
                    item.payment_object === 'unmarked_excise' ? 'Подакциз (без марк.)' : 'Товар'
                  } • Метод: {
                    item.payment_method === 'full_prepayment' ? 'Предоплата 100%' :
                    item.payment_method === 'prepayment' ? 'Предоплата' :
                    item.payment_method === 'advance' ? 'Аванс' :
                    item.payment_method === 'full_payment' ? 'Полный расчет' :
                    item.payment_method === 'partial_payment' ? 'Частичный' :
                    item.payment_method === 'credit' ? 'Кредит' :
                    item.payment_method === 'credit_payment' ? 'Оплата кредита' : 'Полный расчет'
                  }
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