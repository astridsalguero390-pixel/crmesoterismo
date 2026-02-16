-- =====================================================
-- CRM Omnicanal Esotérico - Seed Data
-- Migration 006: Demo data and initial tags
-- =====================================================

-- =====================================================
-- CREATE DEMO USERS
-- =====================================================

-- Note: These users need to be created in Supabase Auth first
-- Then this migration will add them to the users table

-- Insert admin user (assuming auth.users already has this email)
INSERT INTO users (id, email, full_name, role, is_active)
SELECT 
  id,
  'admin@crm-esoterico.com',
  'Administrador',
  'admin'::role_type,
  true
FROM auth.users
WHERE email = 'admin@crm-esoterico.com'
ON CONFLICT (id) DO NOTHING;

-- Insert maestro user
INSERT INTO users (id, email, full_name, role, is_active)
SELECT 
  id,
  'maestro@crm-esoterico.com',
  'Maestro Demo',
  'maestro'::role_type,
  true
FROM auth.users
WHERE email = 'maestro@crm-esoterico.com'
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- CREATE ESOTERIC TAGS
-- =====================================================

INSERT INTO tags (name, color, description) VALUES
  ('Tarot', '#8b5cf6', 'Lecturas de tarot'),
  ('Videncia', '#6366f1', 'Consultas de videncia'),
  ('Amarres', '#ec4899', 'Amarres de amor'),
  ('Retorno de pareja', '#f43f5e', 'Trabajos para retorno de pareja'),
  ('Endulzamiento', '#fb7185', 'Endulzamientos'),
  ('Limpieza energética', '#10b981', 'Limpiezas energéticas y espirituales'),
  ('Protección y defensa', '#3b82f6', 'Protecciones y defensas espirituales'),
  ('Mal de ojo', '#ef4444', 'Limpieza de mal de ojo'),
  ('Bloqueos / caminos', '#f59e0b', 'Apertura de caminos y rompimiento de bloqueos'),
  ('Prosperidad / dinero', '#10b981', 'Trabajos de prosperidad y abundancia'),
  ('Trabajo / empleo', '#6366f1', 'Ayuda para conseguir trabajo'),
  ('Salud', '#14b8a6', 'Consultas sobre salud (sin claims médicos)'),
  ('Sueños / señales', '#8b5cf6', 'Interpretación de sueños y señales'),
  ('Brujería / hechizo', '#7c3aed', 'Trabajos de brujería'),
  ('Consulta urgente', '#dc2626', 'Requiere atención inmediata'),
  ('Cliente recurrente', '#059669', 'Cliente que regresa'),
  ('Cliente nuevo', '#0891b2', 'Primera vez'),
  ('Alto valor', '#ca8a04', 'Cliente de alto valor'),
  ('Sospecha spam', '#64748b', 'Posible spam'),
  ('Pendiente pago', '#f97316', 'Esperando pago'),
  ('Pagó', '#22c55e', 'Pago confirmado'),
  ('Seguimiento 24h', '#eab308', 'Requiere seguimiento en 24 horas'),
  ('Seguimiento 7d', '#84cc16', 'Seguimiento en 7 días'),
  ('No interesado', '#6b7280', 'Cliente no interesado')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- CREATE DEMO LEAD
-- =====================================================

INSERT INTO leads (phone_number, full_name, profile_pic_url, metadata)
VALUES (
  '+573001234567',
  'María García',
  'https://ui-avatars.com/api/?name=Maria+Garcia&background=8b5cf6&color=fff',
  '{"source": "whatsapp", "first_contact": "2026-02-16"}'::jsonb
)
ON CONFLICT (phone_number) DO NOTHING;

-- =====================================================
-- CREATE DEMO CONVERSATION
-- =====================================================

DO $$
DECLARE
  demo_lead_id UUID;
  demo_conversation_id UUID;
  maestro_user_id UUID;
BEGIN
  -- Get the demo lead ID
  SELECT id INTO demo_lead_id
  FROM leads
  WHERE phone_number = '+573001234567'
  LIMIT 1;
  
  -- Get maestro user ID
  SELECT id INTO maestro_user_id
  FROM users
  WHERE role = 'maestro'
  LIMIT 1;
  
  -- Create conversation if lead exists
  IF demo_lead_id IS NOT NULL THEN
    INSERT INTO conversations (
      lead_id,
      channel,
      channel_thread_id,
      status_pipeline,
      owner_id,
      last_message_at,
      unread_count
    ) VALUES (
      demo_lead_id,
      'whatsapp'::channel_type,
      'whatsapp_thread_123',
      'nuevo'::pipeline_status,
      maestro_user_id,
      NOW() - INTERVAL '5 minutes',
      1
    )
    ON CONFLICT (lead_id, channel) WHERE is_archived = false
    DO NOTHING
    RETURNING id INTO demo_conversation_id;
    
    -- Create demo messages if conversation was created
    IF demo_conversation_id IS NOT NULL THEN
      -- Customer message
      INSERT INTO messages (
        conversation_id,
        channel,
        sender_type,
        message_type,
        content,
        external_message_id,
        created_at
      ) VALUES (
        demo_conversation_id,
        'whatsapp'::channel_type,
        'customer'::sender_type,
        'text'::message_type,
        'Hola, necesito una consulta de tarot urgente. ¿Cuánto cuesta?',
        'wamid.demo123',
        NOW() - INTERVAL '5 minutes'
      );
      
      -- Agent response
      INSERT INTO messages (
        conversation_id,
        channel,
        sender_type,
        message_type,
        content,
        created_at
      ) VALUES (
        demo_conversation_id,
        'whatsapp'::channel_type,
        'agent'::sender_type,
        'text'::message_type,
        '¡Hola María! 🌟 Claro que sí. Una lectura de tarot completa tiene un valor de $50.000. ¿Te gustaría agendar una sesión?',
        NOW() - INTERVAL '3 minutes'
      );
      
      -- Apply some tags to the conversation
      INSERT INTO conversation_tags (conversation_id, tag_id)
      SELECT demo_conversation_id, id
      FROM tags
      WHERE name IN ('Tarot', 'Cliente nuevo', 'Consulta urgente')
      ON CONFLICT DO NOTHING;
      
      -- Add a demo note
      INSERT INTO notes (conversation_id, created_by, content)
      VALUES (
        demo_conversation_id,
        maestro_user_id,
        'Cliente interesada en lectura de tarot. Mencionó que tiene una decisión importante que tomar.'
      );
    END IF;
  END IF;
END $$;

-- =====================================================
-- CREATE QUICK REPLIES
-- =====================================================

INSERT INTO quick_replies (shortcut, content, category, is_active) VALUES
  ('/saludo', '¡Hola! 🌟 Bienvenido/a. ¿En qué puedo ayudarte hoy?', 'Saludos', true),
  ('/tarot', 'Nuestra lectura de tarot completa incluye:\n✨ Lectura de 10 cartas\n✨ Interpretación detallada\n✨ Guía espiritual\nValor: $50.000', 'Servicios', true),
  ('/amarres', 'Los amarres de amor son trabajos espirituales que requieren:\n💕 Consulta inicial\n💕 Materiales específicos\n💕 Ritual personalizado\nValor desde: $150.000', 'Servicios', true),
  ('/limpieza', 'La limpieza energética incluye:\n🕯️ Diagnóstico espiritual\n🕯️ Limpieza completa\n🕯️ Protección\nValor: $80.000', 'Servicios', true),
  ('/pago', 'Puedes realizar el pago por:\n💳 Transferencia bancaria\n💳 Nequi\n💳 Daviplata\nTe envío los datos por privado.', 'Pagos', true),
  ('/horario', 'Nuestro horario de atención es:\n📅 Lunes a Viernes: 9am - 7pm\n📅 Sábados: 10am - 5pm\n📅 Domingos: Cerrado', 'Información', true),
  ('/despedida', 'Gracias por contactarnos. ¡Que la luz te acompañe! 🌟✨', 'Saludos', true)
ON CONFLICT (shortcut) DO NOTHING;

-- =====================================================
-- CREATE DEMO ASSIGNMENT RULE
-- =====================================================

DO $$
DECLARE
  maestro_user_id UUID;
BEGIN
  SELECT id INTO maestro_user_id
  FROM users
  WHERE role = 'maestro'
  LIMIT 1;
  
  IF maestro_user_id IS NOT NULL THEN
    INSERT INTO assignment_rules (
      name,
      priority,
      is_active,
      rule_type,
      conditions,
      assign_to
    ) VALUES (
      'Asignación por defecto a Maestro Demo',
      1,
      false, -- Disabled by default
      'round_robin',
      '{"channels": ["whatsapp", "instagram", "messenger"]}'::jsonb,
      maestro_user_id
    );
  END IF;
END $$;
