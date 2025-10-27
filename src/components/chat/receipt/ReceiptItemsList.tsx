import { Input } from '@/components/ui/input';

interface ReceiptItemsListProps {
  items: any[];
  editMode: boolean;
  updateEditedField: (path: string, value: any) => void;
  getMeasureUnit: (code: string) => string;
}

export const ReceiptItemsList = ({ items, editMode, updateEditedField, getMeasureUnit }: ReceiptItemsListProps) => {
  return (
    <div className="bg-background/50 p-3 rounded space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">Товары и услуги</div>
      {items?.map((item: any, idx: number) => (
        <div key={idx} className="space-y-2 pb-2 border-b border-border/50 last:border-0">
          {editMode ? (
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-1">
                <Input 
                  value={item.name}
                  onChange={(e) => {
                    const newItems = [...items];
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
                    const newItems = [...items];
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
                    const newItems = [...items];
                    newItems[idx].quantity = parseFloat(e.target.value) || 1;
                    updateEditedField('items', newItems);
                  }}
                  className="h-7 text-sm"
                  placeholder="Кол-во"
                />
                <select 
                  value={item.measurement_unit || '0'}
                  onChange={(e) => {
                    const newItems = [...items];
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
                    const newItems = [...items];
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
                    const newItems = [...items];
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
                  const newItems = [...items];
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
            <div>
              <div className="flex justify-between items-baseline">
                <span className="font-medium text-sm">{item.name}</span>
                <span className="text-xs font-mono">{((item.price || 0) * (item.quantity || 1)).toFixed(2)} ₽</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {(item.price || 0).toFixed(2)} ₽ × {item.quantity || 1} {getMeasureUnit(item.measurement_unit || item.measure || '0')}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
