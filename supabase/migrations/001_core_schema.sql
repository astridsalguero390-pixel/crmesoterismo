-- =====================================================
-- CRM Omnicanal Esotérico - Core Schema
-- Migration 001: Enums, Tables, and Constraints
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE role_type AS ENUM ('admin', 'maestro');
CREATE TYPE pipeline_status AS ENUM ('nuevo', 'calificado', 'agendado', 'pago', 'seguimiento', 'perdido');
CREATE TYPE channel_type AS ENUM ('whatsapp', 'instagram', 'messenger');
CREATE TYPE message_type AS ENUM ('text', 'image', 'audio', 'video', 'document', 'interactive');
CREATE TYPE sender_type AS ENUM ('customer', 'agent', 'system');

-- =====================================================
-- USERS TABLE (extends auth.users)
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role role_type NOT NULL DEFAULT 'maestro',
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active users by role
CREATE INDEX idx_users_role_active ON users(role, is_active);

-- =====================================================
-- LEADS TABLE
-- =====================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT,
  ig_scoped_id TEXT,
  fb_psid TEXT,
  full_name TEXT,
  profile_pic_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- At least one identifier must be present
  CONSTRAINT at_least_one_identifier CHECK (
    phone_number IS NOT NULL OR 
    ig_scoped_id IS NOT NULL OR 
    fb_psid IS NOT NULL
  )
);

-- Unique constraints per channel
CREATE UNIQUE INDEX idx_leads_phone ON leads(phone_number) WHERE phone_number IS NOT NULL;
CREATE UNIQUE INDEX idx_leads_ig ON leads(ig_scoped_id) WHERE ig_scoped_id IS NOT NULL;
CREATE UNIQUE INDEX idx_leads_fb ON leads(fb_psid) WHERE fb_psid IS NOT NULL;

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel channel_type NOT NULL,
  channel_thread_id TEXT,
  status_pipeline pipeline_status NOT NULL DEFAULT 'nuevo',
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_owner ON conversations(owner_id, updated_at DESC);
CREATE INDEX idx_conversations_pipeline ON conversations(status_pipeline, updated_at DESC);
CREATE INDEX idx_conversations_lead ON conversations(lead_id);
CREATE INDEX idx_conversations_channel ON conversations(channel);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Unique constraint: one active conversation per lead per channel
CREATE UNIQUE INDEX idx_conversations_lead_channel ON conversations(lead_id, channel) 
WHERE is_archived = false;

-- =====================================================
-- MESSAGES TABLE
-- =====================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  channel channel_type NOT NULL,
  sender_type sender_type NOT NULL,
  message_type message_type NOT NULL DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  status TEXT DEFAULT 'sent',
  external_message_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_external_id ON messages(external_message_id) WHERE external_message_id IS NOT NULL;

-- =====================================================
-- TAGS TABLE
-- =====================================================

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CONVERSATION_TAGS TABLE (many-to-many)
-- =====================================================

CREATE TABLE conversation_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(conversation_id, tag_id)
);

CREATE INDEX idx_conversation_tags_conversation ON conversation_tags(conversation_id);
CREATE INDEX idx_conversation_tags_tag ON conversation_tags(tag_id);

-- =====================================================
-- NOTES TABLE
-- =====================================================

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_conversation ON notes(conversation_id, created_at DESC);
CREATE INDEX idx_notes_created_by ON notes(created_by);

-- =====================================================
-- ASSIGNMENT_RULES TABLE
-- =====================================================

CREATE TABLE assignment_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rule_type TEXT NOT NULL, -- 'round_robin', 'tag_based', 'channel_based', 'schedule_based'
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  assign_to UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignment_rules_active ON assignment_rules(is_active, priority DESC);

-- =====================================================
-- QUICK_REPLIES TABLE
-- =====================================================

CREATE TABLE quick_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shortcut TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quick_replies_active ON quick_replies(is_active);

-- =====================================================
-- PUSH_SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

-- =====================================================
-- AUDIT_LOGS TABLE
-- =====================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- =====================================================
-- AUTO-UPDATE TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_rules_updated_at BEFORE UPDATE ON assignment_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quick_replies_updated_at BEFORE UPDATE ON quick_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
