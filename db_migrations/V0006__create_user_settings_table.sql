CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    group_code VARCHAR(255),
    inn VARCHAR(12),
    sno VARCHAR(50) DEFAULT 'usn_income',
    default_vat VARCHAR(20) DEFAULT 'none',
    company_email VARCHAR(255),
    payment_address VARCHAR(500),
    ecomkassa_login VARCHAR(255),
    ecomkassa_password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

COMMENT ON TABLE user_settings IS 'Настройки екомкассы для каждого пользователя';
COMMENT ON COLUMN user_settings.user_id IS 'Уникальный ID пользователя (UUID из localStorage)';
COMMENT ON COLUMN user_settings.group_code IS 'Код кассы Екомкасса';
COMMENT ON COLUMN user_settings.inn IS 'ИНН организации';
COMMENT ON COLUMN user_settings.sno IS 'Система налогообложения';
COMMENT ON COLUMN user_settings.default_vat IS 'НДС по умолчанию';
COMMENT ON COLUMN user_settings.company_email IS 'Email организации';
COMMENT ON COLUMN user_settings.payment_address IS 'Адрес расчётов';