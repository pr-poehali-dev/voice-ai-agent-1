import { Input } from '@/components/ui/input';

interface ReceiptMetadataProps {
  editedData: any;
  editMode: boolean;
  updateEditedField: (path: string, value: any) => void;
}

export const ReceiptMetadata = ({ editedData, editMode, updateEditedField }: ReceiptMetadataProps) => {
  return (
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
  );
};
