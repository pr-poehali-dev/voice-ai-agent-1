import { BulkModeNotice } from './receipt/BulkModeNotice';
import { ReceiptMetadata } from './receipt/ReceiptMetadata';
import { ReceiptItemsList } from './receipt/ReceiptItemsList';
import { ReceiptActions } from './receipt/ReceiptActions';
import { getMeasureUnit } from './receipt/utils';

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

  const isBulkMode = editedData.bulk_count && editedData.original_uuid;

  return (
    <div className="mt-4 space-y-3">
      {isBulkMode && (
        <BulkModeNotice 
          bulkCount={editedData.bulk_count} 
          originalUuid={editedData.original_uuid}
        />
      )}
      
      <ReceiptMetadata 
        editedData={editedData}
        editMode={editMode}
        updateEditedField={updateEditedField}
      />
      
      <ReceiptItemsList 
        items={editedData.items}
        editMode={editMode}
        updateEditedField={updateEditedField}
        getMeasureUnit={getMeasureUnit}
      />
      
      <div className="flex justify-between text-base font-bold px-3">
        <span>Итого</span>
        <span>{editedData.total}₽</span>
      </div>
      
      <ReceiptActions 
        editedData={editedData}
        editMode={editMode}
        isProcessing={isProcessing}
        updateEditedField={updateEditedField}
        handleEditToggle={handleEditToggle}
        handleConfirmReceipt={handleConfirmReceipt}
        handleCancelReceipt={handleCancelReceipt}
      />
    </div>
  );
};
