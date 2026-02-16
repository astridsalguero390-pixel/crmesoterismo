-- =====================================================
-- CRM Omnicanal Esotérico - Additional Indexes
-- Migration 005: Performance optimization indexes
-- =====================================================

-- Note: Many indexes were already created in 001_core_schema.sql
-- This file contains additional indexes for specific query patterns

-- =====================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================

-- Conversations by owner and status
CREATE INDEX idx_conversations_owner_status 
  ON conversations(owner_id, status_pipeline, updated_at DESC)
  WHERE is_archived = false;

-- Conversations by status and channel
CREATE INDEX idx_conversations_status_channel 
  ON conversations(status_pipeline, channel, updated_at DESC)
  WHERE is_archived = false;

-- Unassigned conversations (for admin)
CREATE INDEX idx_conversations_unassigned 
  ON conversations(updated_at DESC)
  WHERE owner_id IS NULL AND is_archived = false;

-- Messages by channel and type
CREATE INDEX idx_messages_channel_type 
  ON messages(channel, message_type, created_at DESC);

-- Messages with media
CREATE INDEX idx_messages_with_media 
  ON messages(conversation_id, created_at DESC)
  WHERE media_url IS NOT NULL;

-- =====================================================
-- FULL TEXT SEARCH INDEXES (Optional)
-- =====================================================

-- Search in message content
CREATE INDEX idx_messages_content_search 
  ON messages USING gin(to_tsvector('spanish', content))
  WHERE content IS NOT NULL;

-- Search in lead names
CREATE INDEX idx_leads_name_search 
  ON leads USING gin(to_tsvector('spanish', full_name))
  WHERE full_name IS NOT NULL;

-- =====================================================
-- PARTIAL INDEXES FOR ACTIVE RECORDS
-- =====================================================

-- Active assignment rules
CREATE INDEX idx_assignment_rules_active_priority 
  ON assignment_rules(priority DESC, created_at)
  WHERE is_active = true;

-- Active quick replies
CREATE INDEX idx_quick_replies_active_category 
  ON quick_replies(category, shortcut)
  WHERE is_active = true;

-- Active users by role
CREATE INDEX idx_users_active_maestros 
  ON users(created_at)
  WHERE role = 'maestro' AND is_active = true;

-- =====================================================
-- COVERING INDEXES FOR COMMON QUERIES
-- =====================================================

-- Conversation list query optimization
CREATE INDEX idx_conversations_list_covering 
  ON conversations(owner_id, updated_at DESC)
  INCLUDE (status_pipeline, unread_count, last_message_at)
  WHERE is_archived = false;
