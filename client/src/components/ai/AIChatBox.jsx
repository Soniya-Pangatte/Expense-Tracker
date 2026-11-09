import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  RefreshCw,
  HelpCircle,
  TrendingDown,
  PieChart,
  ShieldCheck,
  Check,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useTransactions } from '../../context/TransactionContext';
import { sendChatMessage, fetchConversationHistory, clearConversationMessages } from '../../services/aiService';

const DEFAULT_SUGGESTED_QUESTIONS = [
  'Am I on track with my monthly budget?',
  'Where is most of my money going?',
  'How can I save ₹5,000 this month?',
  'What is my daily burn rate and projection?',
];

export default function AIChatBox({ className = '', height = 'h-[550px]', isCompact = false }) {
  const { session, isDemoUser } = useAuth();
  const { currency, formatCurrency } = useCurrency();
  const { transactions, monthlyBudget, budgets, categories } = useTransactions();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState(DEFAULT_SUGGESTED_QUESTIONS);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize with greeting message
  useEffect(() => {
    const initialGreeting = {
      id: 'greeting-welcome',
      role: 'assistant',
      content: `👋 **Hello! I'm SpendWise AI**, your personal finance assistant.\n\nI analyze your real-time expenses, monthly budgets, and spending habits to give you clear, actionable financial guidance.\n\nAsk me anything about your finances or choose a question below!`,
      created_at: new Date().toISOString(),
    };
    setMessages([initialGreeting]);
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const clientData = {
        transactions,
        monthlyBudget,
        budgets,
        categories,
      };

      const res = await sendChatMessage({
        message: text,
        conversationId,
        currency,
        clientData,
        session,
        isDemoUser,
      });

      if (res && res.reply) {
        if (res.conversationId) {
          setConversationId(res.conversationId);
        }
        if (res.suggestedQuestions && res.suggestedQuestions.length > 0) {
          setSuggestedQuestions(res.suggestedQuestions);
        }

        const assistantMsg = {
          id: res.messageId || `reply-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          created_at: new Date().toISOString(),
          engine: res.engine,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ I encountered a temporary connection glitch. Please check your connection or try asking again.`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClearChat = async () => {
    if (conversationId) {
      await clearConversationMessages({ conversationId, session, isDemoUser });
    }
    const freshGreeting = {
      id: `greeting-${Date.now()}`,
      role: 'assistant',
      content: `🧹 Conversation cleared! How else can I assist your financial journey today?`,
      created_at: new Date().toISOString(),
    };
    setMessages([freshGreeting]);
    setSuggestedQuestions(DEFAULT_SUGGESTED_QUESTIONS);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Simple Markdown renderer for paragraphs, bullet points, and bold text
  const renderFormattedContent = (content) => {
    if (!content) return null;

    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      // Format bold markdown **text**
      const parseBold = (text) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-semibold text-[#243D49] dark:text-[#D6EBF3]">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em key={pIdx} className="italic text-[#526C78] dark:text-[#83BDCF]">
                {part.slice(1, -1)}
              </em>
            );
          }
          return part;
        });
      };

      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const bulletText = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#447F98] mt-2 flex-shrink-0" />
            <span className="text-sm leading-relaxed">{parseBold(bulletText)}</span>
          </div>
        );
      }

      // Numbered items
      const numberedMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="font-bold text-xs text-[#447F98] mt-1 flex-shrink-0 min-w-[16px]">
              {numberedMatch[1]}.
            </span>
            <span className="text-sm leading-relaxed">{parseBold(numberedMatch[2])}</span>
          </div>
        );
      }

      // Normal paragraph
      return (
        <p key={idx} className="text-sm leading-relaxed my-0.5">
          {parseBold(line)}
        </p>
      );
    });
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-[#D6EBF3] via-[#B9D9E1] to-[#C4DCE3] dark:from-[#447F98] dark:to-[#1B3541] border-b border-[#C4DCE3] dark:border-[#365765] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#447F98] flex items-center justify-center text-white shadow-sm ring-2 ring-white/60 dark:ring-[#447F98]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#243D49] dark:text-[#EAF4F7] text-sm sm:text-base leading-tight">
                SpendWise AI
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#B9D9E1]/40 text-[#243D49] dark:text-[#EAF4F7] border border-[#C4DCE3]/60">
                Live Advisor
              </span>
            </div>
            <p className="text-xs text-[#526C78] dark:text-[#C0D5DC]">
              Your Personal Finance Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearChat}
            title="Clear Chat History"
            className="p-1.5 text-[#526C78] hover:text-[#243D49] dark:text-[#C0D5DC] dark:hover:text-[#EAF4F7] hover:bg-white/60 dark:hover:bg-[#203D49]/60 rounded-lg transition-colors text-xs flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${height} bg-[#F4FAFC] dark:bg-[#152B35]`}>
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-sm mt-0.5 ${
                  isUser
                    ? 'bg-[#203D49] text-white'
                    : 'bg-[#447F98] text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-xs ${
                  isUser
                    ? 'bg-[#447F98] text-white rounded-tr-xs font-medium'
                    : 'bg-white dark:bg-[#203D49] text-[#243D49] dark:text-[#EAF4F7] border border-[#C4DCE3] dark:border-[#365765] rounded-tl-xs'
                }`}
              >
                <div className="break-words">
                  {isUser ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    renderFormattedContent(msg.content)
                  )}
                </div>

                <div
                  className={`mt-1.5 text-[10px] flex items-center gap-1 ${
                    isUser
                      ? 'text-[#243D49]/70 justify-end'
                      : 'text-[#526C78] dark:text-[#83BDCF]/70 justify-start'
                  }`}
                >
                  <span>{formatMessageTime(msg.created_at)}</span>
                  {!isUser && msg.engine === 'gemini' && (
                    <span className="inline-flex items-center text-[9px] bg-[#B9D9E1] dark:bg-[#203D49] text-[#243D49] dark:text-[#B9D9E1] px-1.5 py-0.2 rounded font-mono">
                      Gemini
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#447F98] text-[#D6EBF3] flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-white dark:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#447F98] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#447F98] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#447F98] animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-[#526C78] dark:text-[#83BDCF] ml-2">
                  Analyzing financial records...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Pills */}
      {suggestedQuestions && suggestedQuestions.length > 0 && !loading && (
        <div className="px-3 py-2 bg-[#D6EBF3]/50 dark:bg-[#1B3541]/60 border-t border-[#C4DCE3]/80 dark:border-[#365765] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 flex-nowrap text-xs">
            <span className="text-[11px] font-semibold text-[#526C78] dark:text-[#83BDCF] flex items-center gap-1 flex-shrink-0 mr-1">
              <Sparkles className="w-3 h-3 text-[#447F98]" /> Suggested:
            </span>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-[#203D49] hover:bg-[#B9D9E1] dark:hover:bg-[#203D49] border border-[#C4DCE3] dark:border-[#365765] text-[#243D49] dark:text-[#D6EBF3] text-xs whitespace-nowrap transition-colors flex-shrink-0 shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 bg-white dark:bg-[#1B3541] border-t border-[#C4DCE3] dark:border-[#365765]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask SpendWise AI about your budget, spending or savings..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm bg-white dark:bg-[#1B3541] border border-[#C4DCE3] dark:border-[#365765] rounded-xl text-[#243D49] dark:text-[#EAF4F7] placeholder-[#758D97] dark:placeholder-[#91ADB8] focus:outline-hidden focus:ring-2 focus:ring-[#447F98] dark:focus:ring-[#83BDCF] transition-all"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="px-4 py-2.5 bg-[#447F98] hover:bg-[#36687D] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-bold">Send</span>
          </button>
        </form>
        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-[#526C78] dark:text-[#C0D5DC]/70">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#447F98]" />
            Private & verified financial analysis
          </span>
          <span>Currency: {currency}</span>
        </div>
      </div>
    </div>
  );
}

