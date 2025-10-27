CREATE TABLE IF NOT EXISTS ai_settings (
    id SERIAL PRIMARY KEY,
    active_provider VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO ai_settings (active_provider) VALUES ('') ON CONFLICT DO NOTHING;
