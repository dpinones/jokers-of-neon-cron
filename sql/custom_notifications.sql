-- Tabla para notificaciones custom programadas
CREATE TABLE custom_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('push_reminders_enabled', 'push_events_enabled')),
    scheduled_date DATE NOT NULL,
    scheduled_hour INTEGER NOT NULL CHECK (scheduled_hour >= 0 AND scheduled_hour <= 23),
    messages JSONB NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por fecha y estado
CREATE INDEX idx_custom_notifications_scheduled
ON custom_notifications(scheduled_date, scheduled_hour, active);

-- Ejemplo de inserción:
-- INSERT INTO custom_notifications (notification_type, scheduled_date, scheduled_hour, messages)
-- VALUES (
--     'push_events_enabled',
--     '2024-01-15',
--     18,
--     '{
--         "es": {
--             "title": "🎮 Evento especial!",
--             "body": "No te pierdas el torneo de hoy"
--         },
--         "en": {
--             "title": "🎮 Special event!",
--             "body": "Don''t miss today''s tournament"
--         },
--         "pt": {
--             "title": "🎮 Evento especial!",
--             "body": "Não perca o torneio de hoje"
--         }
--     }'
-- );
