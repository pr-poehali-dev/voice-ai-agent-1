CREATE TABLE IF NOT EXISTS message_feedback (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    user_message TEXT,
    agent_response TEXT,
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_type ON message_feedback(feedback_type);
CREATE INDEX idx_feedback_created_at ON message_feedback(created_at);