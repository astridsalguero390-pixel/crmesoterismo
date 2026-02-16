-- =====================================================
-- CRM Omnicanal Esotérico - Helper Functions
-- Migration 002: Role checking and utility functions
-- =====================================================

-- =====================================================
-- GET USER ROLE
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS role_type AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- IS ADMIN
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' AND is_active = true
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- IS MAESTRO
-- =====================================================

CREATE OR REPLACE FUNCTION is_maestro()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'maestro' AND is_active = true
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- IS ACTIVE USER
-- =====================================================

CREATE OR REPLACE FUNCTION is_active_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_active = true
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GET CONVERSATION OWNER
-- =====================================================

CREATE OR REPLACE FUNCTION get_conversation_owner(conversation_uuid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT owner_id 
    FROM conversations 
    WHERE id = conversation_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USER OWNS CONVERSATION
-- =====================================================

CREATE OR REPLACE FUNCTION user_owns_conversation(conversation_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT owner_id = auth.uid()
    FROM conversations 
    WHERE id = conversation_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
