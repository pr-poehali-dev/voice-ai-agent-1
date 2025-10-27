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
        <div className="bg-background/50 p-2 rounded">
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
                    value={item.price || 0}
                    onChange={(e) => {
                      const newItems = [...editedData.items];
                      newItems[idx].price = parseFloat(e.target.value) || 0;
                      updateEditedField('items', newItems);
                    }}
                    className="h-7 text-sm"
                    placeholder="Цена"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Input 
                    type="number"
                    value={item.quantity || 1}
                    onChange={(e) => {
                      const newItems = [...editedData.items];
                      newItems[idx].quantity = parseFloat(e.target.value) || 1;
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
                    <option value="commodity">1. Товар (кроме подакцизного и маркированного)</option>
                    <option value="excise">2. Подакцизный товар (кроме маркированного)</option>
                    <option value="job">3. Работа</option>
                    <option value="service">4. Услуга</option>
                    <option value="gambling_bet">5. Прием ставок азартных игр</option>
                    <option value="gambling_prize">6. Выплата выигрыша азартных игр</option>
                    <option value="lottery">7. Прием денежных средств лотерей</option>
                    <option value="lottery_prize">8. Выплата выигрыша лотерей</option>
                    <option value="intellectual_activity">9. Предоставление прав на РИД</option>
                    <option value="payment">10. Аванс, задаток, предоплата, кредит</option>
                    <option value="agent_commission">11. Вознаграждение агента</option>
                    <option value="composite">12. Взнос, пеня, штраф, вознаграждение, бонус</option>
                    <option value="another">13. Иной предмет расчета</option>
                    <option value="property_right">14. Передача имущественных прав</option>
                    <option value="non_operating_gain">15. Внереализационный доход</option>
                    <option value="insurance_premium">16. Расходы, уменьшающие налог</option>
                    <option value="sales_tax">17. Торговый сбор</option>
                    <option value="resort_fee">18. Туристический налог</option>
                    <option value="deposit">19. Залог</option>
                    <option value="expense">20. Расходы по ст. 346.16 НК РФ</option>
                    <option value="pension_insurance_ip">21. Пенсионное страхование ИП (без выплат)</option>
                    <option value="pension_insurance_org">22. Пенсионное страхование (с выплатами)</option>
                    <option value="health_insurance_ip">23. Медицинское страхование ИП (без выплат)</option>
                    <option value="health_insurance_org">24. Медицинское страхование (с выплатами)</option>
                    <option value="social_insurance">25. Социальное страхование</option>
                    <option value="casino_payment">26. Прием/выплата казино</option>
                    <option value="agent_payment">27. Выдача денег банковским агентом</option>
                    <option value="marked_excise_no_code">30. Подакцизный маркир. без кода</option>
                    <option value="marked_excise_with_code">31. Подакцизный маркир. с кодом</option>
                    <option value="marked_commodity_no_code">32. Товар маркир. без кода</option>
                    <option value="marked_commodity_with_code">33. Товар маркир. с кодом</option>
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
                    item.payment_object === 'gambling_bet' ? 'Ставки' :
                    item.payment_object === 'gambling_prize' ? 'Выигрыш' :
                    item.payment_object === 'lottery' ? 'Лотерея' :
                    item.payment_object === 'lottery_prize' ? 'Приз' :
                    item.payment_object === 'intellectual_activity' ? 'РИД' :
                    item.payment_object === 'payment' ? 'Аванс/кредит' :
                    item.payment_object === 'agent_commission' ? 'Вознагр. агента' :
                    item.payment_object === 'composite' ? 'Взнос/штраф' :
                    item.payment_object === 'another' ? 'Иной' :
                    item.payment_object === 'property_right' ? 'Имущ. право' :
                    item.payment_object === 'non_operating_gain' ? 'Внереализ.' :
                    item.payment_object === 'insurance_premium' ? 'Расходы↓налог' :
                    item.payment_object === 'sales_tax' ? 'Торг. сбор' :
                    item.payment_object === 'resort_fee' ? 'Турист. налог' :
                    item.payment_object === 'deposit' ? 'Залог' :
                    item.payment_object === 'expense' ? 'Расходы 346.16' :
                    item.payment_object === 'pension_insurance_ip' ? 'Пенс. ИП' :
                    item.payment_object === 'pension_insurance_org' ? 'Пенс. орг' :
                    item.payment_object === 'health_insurance_ip' ? 'Мед. ИП' :
                    item.payment_object === 'health_insurance_org' ? 'Мед. орг' :
                    item.payment_object === 'social_insurance' ? 'Соц. страх.' :
                    item.payment_object === 'casino_payment' ? 'Казино' :
                    item.payment_object === 'agent_payment' ? 'Выдача БПА' :
                    item.payment_object === 'marked_excise_no_code' ? 'Подакциз марк. без кода' :
                    item.payment_object === 'marked_excise_with_code' ? 'Подакциз марк. с кодом' :
                    item.payment_object === 'marked_commodity_no_code' ? 'Товар марк. без кода' :
                    item.payment_object === 'marked_commodity_with_code' ? 'Товар марк. с кодом' : 'Товар'
                  } • Метод: {
                    item.payment_method === 'full_prepayment' ? 'Предоплата 100%' :
                    item.payment_method === 'prepayment' ? 'Предоплата' :
                    item.payment_method === 'advance' ? 'Аванс' :
                    item.payment_method === 'full_payment' ? 'Полный расчет' :
                    item.payment_method === 'partial_payment' ? 'Частичный + кредит' :
                    item.payment_method === 'credit' ? 'Передача в кредит' :
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
      
      <div className="bg-background/50 p-3 rounded space-y-2">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs font-medium text-muted-foreground">Способы оплаты</div>
          {editMode && (
            <Button
              onClick={() => {
                const newPayments = [...(editedData.payments || []), { type: '1', sum: 0 }];
                updateEditedField('payments', newPayments);
              }}
              variant="outline"
              size="sm"
              className="h-6 text-xs"
            >
              <Icon name="Plus" size={12} className="mr-1" />
              Добавить
            </Button>
          )}
        </div>
        {editedData.payments?.map((payment: any, idx: number) => {
          const paymentNames: Record<string, string> = {
            '0': 'Наличные',
            '1': 'Безналичный',
            '2': 'Предоплата (аванс)',
            '3': 'Последующая оплата (кредит)',
            '4': 'Иная форма',
            '5': 'Расширенный аванс',
            '6': 'Расширенный кредит'
          };
          
          return (
            <div key={idx} className="flex gap-2 items-center pb-2 border-b border-border/50 last:border-0">
              {editMode ? (
                <>
                  <select
                    value={payment.type}
                    onChange={(e) => {
                      const newPayments = [...editedData.payments];
                      newPayments[idx].type = e.target.value;
                      updateEditedField('payments', newPayments);
                    }}
                    className="flex-1 h-7 text-sm bg-background border rounded px-2"
                  >
                    <option value="0">Наличные</option>
                    <option value="1">Безналичный</option>
                    <option value="2">Предоплата (аванс)</option>
                    <option value="3">Последующая оплата (кредит)</option>
                    <option value="4">Иная форма оплаты</option>
                    <option value="5">Расширенный аванс</option>
                    <option value="6">Расширенный кредит</option>
                  </select>
                  <Input
                    type="number"
                    value={payment.sum || 0}
                    onChange={(e) => {
                      const newPayments = [...editedData.payments];
                      newPayments[idx].sum = parseFloat(e.target.value) || 0;
                      updateEditedField('payments', newPayments);
                    }}
                    className="w-24 h-7 text-sm"
                    placeholder="Сумма"
                  />
                  {editedData.payments.length > 1 && (
                    <Button
                      onClick={() => {
                        const newPayments = editedData.payments.filter((_: any, i: number) => i !== idx);
                        updateEditedField('payments', newPayments);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                    >
                      <Icon name="Trash2" size={14} />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{paymentNames[payment.type] || 'Безналичный'}</span>
                  <span className="text-sm font-medium">{payment.sum || 0}₽</span>
                </>
              )}
            </div>
          );
        })}
        {(() => {
          const paymentsTotal = editedData.payments?.reduce((sum: number, p: any) => sum + (parseFloat(p.sum) || 0), 0) || 0;
          const itemsTotal = editedData.total || 0;
          const isValid = Math.abs(paymentsTotal - itemsTotal) < 0.01;
          
          return (
            <div className={`flex justify-between text-sm font-bold pt-2 border-t border-border ${!isValid && editMode ? 'text-destructive' : ''}`}>
              <span>Сумма платежей</span>
              <span>{paymentsTotal.toFixed(2)}₽ {!isValid && editMode && '⚠️'}</span>
            </div>
          );
        })()}
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