import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { FinancialAnalysisEngine } from '../services/financialAnalysisEngine.js';
import { GeminiService } from '../services/geminiService.js';
import { ConversationService } from '../services/conversationService.js';

const router = express.Router();

// Apply auth to all AI routes
router.use(requireAuth);

/**
 * POST /api/ai/chat
 * Primary chat endpoint for SpendWise AI
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationId, currency = 'INR', clientData = null } = req.body;
    const userId = req.user.id;
    const token = req.token;
    const isDemo = req.isDemo;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    // 1. Resolve or verify active conversation
    let activeConvId = conversationId;
    if (!activeConvId) {
      const activeConv = await ConversationService.getOrCreateActiveConversation(userId, token, isDemo);
      activeConvId = activeConv.id;
    }

    // 2. Fetch ground-truth user financial data
    const rawFinancials = await FinancialAnalysisEngine.getUserFinancialData(userId, token, isDemo, clientData);

    // 3. Deterministic calculation engine
    const analysis = FinancialAnalysisEngine.analyzeFinancials(rawFinancials, currency);
    const summaryText = FinancialAnalysisEngine.buildFinancialSummaryContext(analysis);

    // 4. Save user message to history
    await ConversationService.saveMessage(
      activeConvId,
      userId,
      'user',
      message.trim(),
      { currency },
      token,
      isDemo
    );

    // 5. Fetch message history for context
    const history = await ConversationService.getMessages(activeConvId, token, isDemo);

    // 6. Generate AI response (using Gemini or deterministic fallback engine)
    const { reply, suggestedQuestions, engine } = await GeminiService.generateChatResponse(
      message.trim(),
      analysis,
      summaryText,
      history
    );

    // 7. Save assistant reply to history
    const savedAssistantMsg = await ConversationService.saveMessage(
      activeConvId,
      userId,
      'assistant',
      reply,
      { engine, currency },
      token,
      isDemo
    );

    res.json({
      success: true,
      reply,
      messageId: savedAssistantMsg.id,
      conversationId: activeConvId,
      suggestedQuestions,
      analysis: {
        metrics: analysis.metrics,
        budget: analysis.budget,
        categoryAlerts: analysis.categoryAlerts,
        currency: analysis.currency,
        currencySymbol: analysis.currencySymbol,
      },
      engine,
    });
  } catch (err) {
    console.error('AI chat endpoint error:', err);
    res.status(500).json({ error: 'Failed to generate financial advisory response.', details: err.message });
  }
});

/**
 * GET /api/ai/insights
 * Returns computed metrics, budget analysis, category alerts, and top recommendations
 */
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.token;
    const isDemo = req.isDemo;
    const currency = req.query.currency || 'INR';

    // Support passing client-side cached data if offline
    let clientData = null;
    if (req.query.clientData) {
      try {
        clientData = JSON.parse(req.query.clientData);
      } catch (e) {
        // ignore parse error
      }
    }

    const rawFinancials = await FinancialAnalysisEngine.getUserFinancialData(userId, token, isDemo, clientData);
    const analysis = FinancialAnalysisEngine.analyzeFinancials(rawFinancials, currency);

    res.json({
      success: true,
      insights: analysis,
    });
  } catch (err) {
    console.error('AI insights error:', err);
    res.status(500).json({ error: 'Failed to compute financial insights.', details: err.message });
  }
});

/**
 * GET /api/ai/conversations
 * List conversation threads
 */
router.get('/conversations', async (req, res) => {
  try {
    const list = await ConversationService.listConversations(req.user.id, req.token, req.isDemo);
    res.json({ success: true, conversations: list });
  } catch (err) {
    console.error('List conversations error:', err);
    res.status(500).json({ error: 'Failed to retrieve conversations.' });
  }
});

/**
 * POST /api/ai/conversations
 * Start a new conversation thread
 */
router.post('/conversations', async (req, res) => {
  try {
    const { title = 'Financial Advisory' } = req.body;
    const newConv = await ConversationService.createNewConversation(req.user.id, title, req.token, req.isDemo);
    res.json({ success: true, conversation: newConv });
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ error: 'Failed to create new conversation.' });
  }
});

/**
 * GET /api/ai/conversations/:id/messages
 * Get message history for a specific conversation
 */
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const messages = await ConversationService.getMessages(req.params.id, req.token, req.isDemo);
    res.json({ success: true, messages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

/**
 * POST /api/ai/conversations/:id/clear
 * Clear all messages in a conversation
 */
router.post('/conversations/:id/clear', async (req, res) => {
  try {
    await ConversationService.clearMessages(req.params.id, req.user.id, req.token, req.isDemo);
    res.json({ success: true, message: 'Conversation history cleared.' });
  } catch (err) {
    console.error('Clear conversation error:', err);
    res.status(500).json({ error: 'Failed to clear conversation history.' });
  }
});

export default router;

