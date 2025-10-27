-- Добавляем колонку payments для хранения массива способов оплаты
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT NULL;

-- Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_receipts_payments ON receipts USING gin(payments);

-- Комментарий к колонке
COMMENT ON COLUMN receipts.payments IS 'Массив способов оплаты с типами и суммами: [{"type": "1", "sum": 500}, {"type": "3", "sum": 300}]';