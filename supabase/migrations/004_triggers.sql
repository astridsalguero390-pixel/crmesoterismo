-- =====================================================
-- CRM Omnicanal Esotérico - Triggers
-- Migration 004: Protective triggers and automation
-- =====================================================

-- =====================================================
-- PROTECT CONVERSATION FIELDS FROM MAESTRO
-- =====================================================

CREATE OR REPLACE FUNCTION protect_conversation_fields()
RETURNS TRIGGER AS $$
DECLARE
  user_role role_type;
BEGIN
  -- Get current user's role
  user_role := get_user_role();
  
  -- If user is maestro, check for protected field changes
  IF user_role = 'maestro' THEN
    -- Check if any protected fields are being changed
    IF (OLD.owner_id IS DISTINCT FROM NEW.owner_id) OR
       (OLD.lead_id IS DISTINCT FROM NEW.lead_id) OR
       (OLD.channel IS DISTINCT FROM NEW.channel) OR
       (OLD.channel_thread_id IS DISTINCT FROM NEW.channel_thread_id) OR
       (OLD.locked_by IS DISTINCT FROM NEW.locked_by) OR
       (OLD.locked_at IS DISTINCT FROM NEW.locked_at) OR
       (OLD.is_archived IS DISTINCT FROM NEW.is_archived) THEN
      
      RAISE EXCEPTION 'Maestros cannot modify protected conversation fields (owner_id, lead_id, channel, channel_thread_id, locked_by, locked_at, is_archived)';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER protect_conversation_fields_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION protect_conversation_fields();

-- =====================================================
-- AUTO-UPDATE CONVERSATION TIMESTAMP ON MESSAGE
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation's last_message_at
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    unread_count = CASE 
      WHEN NEW.sender_type = 'customer' THEN unread_count + 1
      ELSE unread_count
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- =====================================================
-- AUDIT LOG TRIGGER (Optional - for critical actions)
-- =====================================================

CREATE OR REPLACE FUNCTION log_conversation_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when conversation is assigned or reassigned
  IF (OLD.owner_id IS DISTINCT FROM NEW.owner_id) THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      details
    ) VALUES (
      auth.uid(),
      'conversation_assigned',
      'conversation',
      NEW.id,
      jsonb_build_object(
        'old_owner_id', OLD.owner_id,
        'new_owner_id', NEW.owner_id,
        'conversation_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_conversation_assignment_trigger
  AFTER UPDATE ON conversations
  FOR EACH ROW
  WHEN (OLD.owner_id IS DISTINCT FROM NEW.owner_id)
  EXECUTE FUNCTION log_conversation_assignment();

-- =====================================================
-- AUDIT LOG FOR STATUS CHANGES
-- =====================================================

CREATE OR REPLACE FUNCTION log_pipeline_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when pipeline status changes
  IF (OLD.status_pipeline IS DISTINCT FROM NEW.status_pipeline) THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      details
    ) VALUES (
      auth.uid(),
      'pipeline_status_changed',
      'conversation',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.status_pipeline,
        'new_status', NEW.status_pipeline,
        'conversation_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_pipeline_status_change_trigger
  AFTER UPDATE ON conversations
  FOR EACH ROW
  WHEN (OLD.status_pipeline IS DISTINCT FROM NEW.status_pipeline)
  EXECUTE FUNCTION log_pipeline_status_change();
