CREATE TABLE IF NOT EXISTS receipts (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE NOT NULL,
    user_message TEXT NOT NULL,
    operation_type VARCHAR(50) DEFAULT 'sell',
    items JSONB NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    payment_type VARCHAR(50) DEFAULT 'card',
    customer_email VARCHAR(255),
    ecomkassa_response JSONB,
    status VARCHAR(50) DEFAULT 'created',
    demo_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receipts_created_at ON receipts(created_at DESC);
CREATE INDEX idx_receipts_external_id ON receipts(external_id);
CREATE INDEX idx_receipts_status ON receipts(status);
