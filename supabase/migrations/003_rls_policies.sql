-- =====================================================
-- CRM Omnicanal Esotérico - RLS Policies
-- Migration 003: Row Level Security for all tables
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Admin can see all users
CREATE POLICY "Admin can view all users"
  ON users FOR SELECT
  USING (is_admin());

-- Maestro can see all users (for assignment purposes)
CREATE POLICY "Maestro can view all users"
  ON users FOR SELECT
  USING (is_maestro());

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Admin can update all users
CREATE POLICY "Admin can update all users"
  ON users FOR UPDATE
  USING (is_admin());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Admin can insert users
CREATE POLICY "Admin can insert users"
  ON users FOR INSERT
  WITH CHECK (is_admin());

-- =====================================================
-- LEADS TABLE POLICIES
-- =====================================================

-- Admin can do everything with leads
CREATE POLICY "Admin full access to leads"
  ON leads FOR ALL
  USING (is_admin());

-- Maestro can view leads from their assigned conversations
CREATE POLICY "Maestro can view assigned leads"
  ON leads FOR SELECT
  USING (
    is_maestro() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.lead_id = leads.id
      AND conversations.owner_id = auth.uid()
    )
  );

-- =====================================================
-- CONVERSATIONS TABLE POLICIES
-- =====================================================

-- Admin can do everything with conversations
CREATE POLICY "Admin full access to conversations"
  ON conversations FOR ALL
  USING (is_admin());

-- Maestro can view only assigned conversations
CREATE POLICY "Maestro can view assigned conversations"
  ON conversations FOR SELECT
  USING (
    is_maestro() AND
    owner_id = auth.uid()
  );

-- Maestro can update assigned conversations (limited fields via trigger)
CREATE POLICY "Maestro can update assigned conversations"
  ON conversations FOR UPDATE
  USING (
    is_maestro() AND
    owner_id = auth.uid()
  );

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================

-- Admin can do everything with messages
CREATE POLICY "Admin full access to messages"
  ON messages FOR ALL
  USING (is_admin());

-- Maestro can view messages from assigned conversations
CREATE POLICY "Maestro can view assigned messages"
  ON messages FOR SELECT
  USING (
    is_maestro() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.owner_id = auth.uid()
    )
  );

-- Maestro can insert outbound messages in assigned conversations
CREATE POLICY "Maestro can insert messages in assigned conversations"
  ON messages FOR INSERT
  WITH CHECK (
    is_maestro() AND
    sender_type = 'agent' AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.owner_id = auth.uid()
    )
  );

-- Maestro CANNOT update or delete messages (admin only)

-- =====================================================
-- TAGS TABLE POLICIES
-- =====================================================

-- Everyone can view tags
CREATE POLICY "All users can view tags"
  ON tags FOR SELECT
  USING (is_active_user());

-- Admin can manage tags
CREATE POLICY "Admin can manage tags"
  ON tags FOR ALL
  USING (is_admin());

-- =====================================================
-- CONVERSATION_TAGS TABLE POLICIES
-- =====================================================

-- Admin can do everything
CREATE POLICY "Admin full access to conversation_tags"
  ON conversation_tags FOR ALL
  USING (is_admin());

-- Maestro can view tags on assigned conversations
CREATE POLICY "Maestro can view assigned conversation tags"
  ON conversation_tags FOR SELECT
  USING (
    is_maestro() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_tags.conversation_id
      AND conversations.owner_id = auth.uid()
    )
  );

-- Maestro can add tags to assigned conversations
CREATE POLICY "Maestro can add tags to assigned conversations"
  ON conversation_tags FOR INSERT
  WITH CHECK (
    is_maestro() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_tags.conversation_id
      AND conversations.owner_id = auth.uid()
    )
  );

-- Maestro can remove tags from assigned conversations
CREATE POLICY "Maestro can remove tags from assigned conversations"
  ON conversation_tags FOR DELETE
  USING (
    is_maestro() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_tags.conversation_id
      AND conversations.owner_id = auth.uid()
    )
  );

-- =====================================================
-- NOTES TABLE POLICIES
-- =====================================================

-- Admin can do everything with notes
CREATE POLICY "Admin full access to notes"
  ON notes FOR ALL
  USING (is_admin());

-- Maestro can view notes on assigned conversations
CREATE POLICY "Maestro can view assigned notes"
  ON notes FOR SELECT
  USING (
    is_maestro() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = notes.conversation_id
      AND conversations.owner_id = auth.uid()
    )
  );

-- Maestro can insert notes on assigned conversations
CREATE POLICY "Maestro can insert notes on assigned conversations"
  ON notes FOR INSERT
  WITH CHECK (
    is_maestro() AND
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = notes.conversation_id
      AND conversations.owner_id = auth.uid()
    )
  );

-- Maestro can update only their own notes
CREATE POLICY "Maestro can update own notes"
  ON notes FOR UPDATE
  USING (
    is_maestro() AND
    created_by = auth.uid()
  );

-- Maestro can delete only their own notes
CREATE POLICY "Maestro can delete own notes"
  ON notes FOR DELETE
  USING (
    is_maestro() AND
    created_by = auth.uid()
  );

-- =====================================================
-- ASSIGNMENT_RULES TABLE POLICIES
-- =====================================================

-- Admin only
CREATE POLICY "Admin full access to assignment_rules"
  ON assignment_rules FOR ALL
  USING (is_admin());

-- =====================================================
-- QUICK_REPLIES TABLE POLICIES
-- =====================================================

-- Everyone can view quick replies
CREATE POLICY "All users can view quick_replies"
  ON quick_replies FOR SELECT
  USING (is_active_user());

-- Admin can manage quick replies
CREATE POLICY "Admin can manage quick_replies"
  ON quick_replies FOR ALL
  USING (is_admin());

-- =====================================================
-- PUSH_SUBSCRIPTIONS TABLE POLICIES
-- =====================================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- Admin can view all subscriptions
CREATE POLICY "Admin can view all push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (is_admin());

-- =====================================================
-- AUDIT_LOGS TABLE POLICIES
-- =====================================================

-- Admin only
CREATE POLICY "Admin full access to audit_logs"
  ON audit_logs FOR ALL
  USING (is_admin());
