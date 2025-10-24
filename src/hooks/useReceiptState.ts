import { useState, useEffect } from 'react';

export const useReceiptState = () => {
  const [pendingReceipt, setPendingReceipt] = useState<any>(() => {
    const saved = localStorage.getItem('pending_receipt');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [editMode, setEditMode] = useState(false);
  
  const [editedData, setEditedData] = useState<any>(() => {
    const saved = localStorage.getItem('edited_data');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [lastReceiptData, setLastReceiptData] = useState<any>(() => {
    const saved = localStorage.getItem('last_receipt_data');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (pendingReceipt) {
      localStorage.setItem('pending_receipt', JSON.stringify(pendingReceipt));
    } else {
      localStorage.removeItem('pending_receipt');
    }
  }, [pendingReceipt]);
  
  useEffect(() => {
    if (editedData) {
      localStorage.setItem('edited_data', JSON.stringify(editedData));
    } else {
      localStorage.removeItem('edited_data');
    }
  }, [editedData]);
  
  useEffect(() => {
    if (lastReceiptData) {
      localStorage.setItem('last_receipt_data', JSON.stringify(lastReceiptData));
    } else {
      localStorage.removeItem('last_receipt_data');
    }
  }, [lastReceiptData]);

  useEffect(() => {
    if (!editedData || !editedData.items) return;
    
    const calculatedTotal = editedData.items.reduce((sum: number, item: any) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseFloat(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
    
    const roundedTotal = Math.round(calculatedTotal * 100) / 100;
    
    if (editedData.total !== roundedTotal) {
      setEditedData((prev: any) => ({
        ...prev,
        total: roundedTotal,
        payments: prev.payments ? prev.payments.map((p: any) => ({
          ...p,
          sum: roundedTotal
        })) : [{ type: '1', sum: roundedTotal }]
      }));
    }
  }, [editedData?.items]);

  const updateEditedField = (path: string, value: any) => {
    setEditedData((prev: any) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const isArrayIndex = !isNaN(Number(key));
        
        if (isArrayIndex) {
          const index = Number(key);
          if (!Array.isArray(current)) current = [];
          if (!current[index]) current[index] = {};
          current = current[index];
        } else {
          if (!current[key]) {
            const nextKey = keys[i + 1];
            current[key] = !isNaN(Number(nextKey)) ? [] : {};
          }
          current = current[key];
        }
      }
      
      const lastKey = keys[keys.length - 1];
      current[lastKey] = value;
      return newData;
    });
  };

  return {
    pendingReceipt,
    setPendingReceipt,
    editMode,
    setEditMode,
    editedData,
    setEditedData,
    lastReceiptData,
    setLastReceiptData,
    updateEditedField
  };
};
