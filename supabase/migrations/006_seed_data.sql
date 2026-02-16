-- =====================================================
-- CRM Omnicanal Esotérico - Seed Data (SIMPLIFIED)
-- Migration 006: Demo data and initial tags
-- =====================================================

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
-- NOTE: Demo users, leads, and conversations
-- =====================================================
-- 
-- Los usuarios demo (admin y maestro) deben crearse manualmente:
-- 1. Ve a Authentication → Users en Supabase
-- 2. Crea: admin@crm-esoterico.com
-- 3. Crea: maestro@crm-esoterico.com
-- 4. Luego ejecuta este SQL para asignar roles:
--
-- INSERT INTO users (id, email, full_name, role, is_active)
-- SELECT id, email, 'Administrador', 'admin'::role_type, true
-- FROM auth.users WHERE email = 'admin@crm-esoterico.com'
-- ON CONFLICT (email) DO UPDATE SET role = 'admin';
--
-- INSERT INTO users (id, email, full_name, role, is_active)
-- SELECT id, email, 'Maestro Demo', 'maestro'::role_type, true
-- FROM auth.users WHERE email = 'maestro@crm-esoterico.com'
-- ON CONFLICT (email) DO UPDATE SET role = 'maestro';
--
-- =====================================================
