import { createScopedClient, supabaseAdmin } from '../config/supabase.js';

// In-memory fallback store for demo users or when database table is unavailable
const inMemoryStore = {
  conversations: new Map(), // userId -> array of conversations
  messages: new Map(), // conversationId -> array of messages
};

export class ConversationService {
  /**
   * Get or create active conversation for a user
   */
  static async getOrCreateActiveConversation(userId, token, isDemo = false) {
    if (isDemo || userId === 'demo-user-id-001') {
      const userConvs = inMemoryStore.conversations.get(userId) || [];
      if (userConvs.length > 0) {
        return userConvs[0];
      }
      const newConv = {
        id: 'demo-conv-1',
        user_id: userId,
        title: 'Financial Advisory',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      inMemoryStore.conversations.set(userId, [newConv]);
      return newConv;
    }

    const client = token ? createScopedClient(token) : supabaseAdmin;
    try {
      const { data: convs, error } = await client
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!error && convs && convs.length > 0) {
        return convs[0];
      }

      // Create new conversation
      const { data: newConv, error: createError } = await client
        .from('ai_conversations')
        .insert([{ user_id: userId, title: 'Financial Advisory' }])
        .select()
        .single();

      if (!createError && newConv) {
        return newConv;
      }
    } catch (err) {
      console.warn('ai_conversations query error, using in-memory store:', err.message);
    }

    // In-memory fallback
    const fallbackConv = {
      id: `local-conv-${Date.now()}`,
      user_id: userId,
      title: 'Financial Advisory',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const list = inMemoryStore.conversations.get(userId) || [];
    list.unshift(fallbackConv);
    inMemoryStore.conversations.set(userId, list);
    return fallbackConv;
  }

  /**
   * List all conversations for user
   */
  static async listConversations(userId, token, isDemo = false) {
    if (isDemo || userId === 'demo-user-id-001') {
      return inMemoryStore.conversations.get(userId) || [];
    }

    const client = token ? createScopedClient(token) : supabaseAdmin;
    try {
      const { data, error } = await client
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) return data;
    } catch (err) {
      console.warn('listConversations error:', err.message);
    }
    return inMemoryStore.conversations.get(userId) || [];
  }

  /**
   * Get message history for a conversation
   */
  static async getMessages(conversationId, token, isDemo = false) {
    if (isDemo || conversationId?.startsWith('demo-') || conversationId?.startsWith('local-')) {
      return inMemoryStore.messages.get(conversationId) || [];
    }

    const client = token ? createScopedClient(token) : supabaseAdmin;
    try {
      const { data, error } = await client
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && data) return data;
    } catch (err) {
      console.warn('getMessages error:', err.message);
    }
    return inMemoryStore.messages.get(conversationId) || [];
  }

  /**
   * Save a message to conversation history
   */
  static async saveMessage(conversationId, userId, role, content, metadata = {}, token, isDemo = false) {
    const messageObj = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
      metadata,
      created_at: new Date().toISOString(),
    };

    if (isDemo || conversationId?.startsWith('demo-') || conversationId?.startsWith('local-')) {
      const list = inMemoryStore.messages.get(conversationId) || [];
      list.push(messageObj);
      inMemoryStore.messages.set(conversationId, list);
      return messageObj;
    }

    const client = token ? createScopedClient(token) : supabaseAdmin;
    try {
      const { data, error } = await client
        .from('ai_messages')
        .insert([{
          conversation_id: conversationId,
          user_id: userId,
          role,
          content,
          metadata,
        }])
        .select()
        .single();

      if (!error && data) {
        // Update conversation updated_at
        await client
          .from('ai_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
        return data;
      }
    } catch (err) {
      console.warn('saveMessage error, persisting in-memory:', err.message);
    }

    // In-memory fallback
    const list = inMemoryStore.messages.get(conversationId) || [];
    list.push(messageObj);
    inMemoryStore.messages.set(conversationId, list);
    return messageObj;
  }

  /**
   * Clear messages in a conversation
   */
  static async clearMessages(conversationId, userId, token, isDemo = false) {
    inMemoryStore.messages.set(conversationId, []);

    if (!isDemo && !conversationId?.startsWith('demo-') && !conversationId?.startsWith('local-')) {
      const client = token ? createScopedClient(token) : supabaseAdmin;
      try {
        await client
          .from('ai_messages')
          .delete()
          .eq('conversation_id', conversationId);
      } catch (err) {
        console.warn('clearMessages DB error:', err.message);
      }
    }
    return { success: true };
  }

  /**
   * Create a new fresh conversation
   */
  static async createNewConversation(userId, title = 'New Advisory', token, isDemo = false) {
    const convId = `conv-${Date.now()}`;
    const newConv = {
      id: convId,
      user_id: userId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isDemo || userId === 'demo-user-id-001') {
      const list = inMemoryStore.conversations.get(userId) || [];
      list.unshift(newConv);
      inMemoryStore.conversations.set(userId, list);
      return newConv;
    }

    const client = token ? createScopedClient(token) : supabaseAdmin;
    try {
      const { data, error } = await client
        .from('ai_conversations')
        .insert([{ user_id: userId, title }])
        .select()
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.warn('createNewConversation error:', err.message);
    }

    const list = inMemoryStore.conversations.get(userId) || [];
    list.unshift(newConv);
    inMemoryStore.conversations.set(userId, list);
    return newConv;
  }
}

