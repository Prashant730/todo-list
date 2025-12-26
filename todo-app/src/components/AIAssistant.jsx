import { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend, FiZap, FiTrendingUp, FiAlertCircle, FiTarget, FiLoader } from 'react-icons/fi';
import { aiService } from '../services/aiService.js';
import { useTodo } from '../context/TodoContext';
import { useTaskStats } from '../hooks/useFilteredTasks';
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { handleApiError, showErrorNotification } from '../utils/errorHandler';

const quickPrompts = [
  { icon: FiTrendingUp, label: 'Study schedule help', prompt: 'Help me create an effective study schedule for my assignments' },
  { icon: FiAlertCircle, label: 'Exam preparation', prompt: 'How should I prepare for my upcoming exams based on my tasks?' },
  { icon: FiTarget, label: 'Daily study plan', prompt: 'Create an optimal daily study plan based on my assignments' },
  { icon: FiZap, label: 'Beat procrastination', prompt: 'I\'m procrastinating on my assignments. How can I get motivated?' },
];

export default function AIAssistant() {
  const { state } = useTodo();
  const stats = useTaskStats(state.tasks);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Hi! I'm your AI study advisor 🎓 I can help you plan your study schedule, prepare for exams, manage assignments, and stay motivated. What academic challenge can I help you with today?" }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getTaskContext = () => {
    const overdueTasks = state.tasks.filter(t => t.dueDate && isPast(parseISO(t.dueDate)) && !t.completed);
    const highPriorityTasks = state.tasks.filter(t => t.priority === 'high' && !t.completed);
    const recentCompleted = state.tasks.filter(t => t.completed && t.completedAt).slice(-10);

    return `
CURRENT TASK DATA:
- Total tasks: ${stats.total}
- Completed: ${stats.completed} (${stats.completionRate}% completion rate)
- Active: ${stats.active}
- Overdue: ${stats.overdue}
- Due today: ${stats.today}

PRIORITY BREAKDOWN:
- High priority: ${stats.byPriority.high}
- Medium priority: ${stats.byPriority.medium}
- Low priority: ${stats.byPriority.low}

CATEGORIES: ${Object.entries(stats.byCategory).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None'}

OVERDUE TASKS (${overdueTasks.length}):
${overdueTasks.slice(0, 5).map(t => `- "${t.title}" (${t.priority} priority, due ${format(parseISO(t.dueDate), 'MMM d')})`).join('\n') || 'None'}

HIGH PRIORITY INCOMPLETE:
${highPriorityTasks.slice(0, 5).map(t => `- "${t.title}"${t.dueDate ? ` (due ${format(parseISO(t.dueDate), 'MMM d')})` : ''}`).join('\n') || 'None'}

ALL ACTIVE TASKS:
${state.tasks.filter(t => !t.completed).map(t => `- "${t.title}" [${t.priority || 'no'} priority]${t.category ? ` [${t.category}]` : ''}${t.dueDate ? ` [due: ${format(parseISO(t.dueDate), 'MMM d')}]` : ''}`).join('\n') || 'No active tasks'}

RECENTLY COMPLETED:
${recentCompleted.map(t => `- "${t.title}" completed on ${format(parseISO(t.completedAt), 'MMM d')}`).join('\n') || 'None yet'}
`;
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || loading) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const context = getTaskContext();
      const response = await aiService.generateChatResponse(messageText, context);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ ${error.message || 'Failed to get AI response'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform z-50">
        <FiMessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-[var(--bg-primary)] rounded-2xl shadow-2xl flex flex-col z-50 border border-[var(--border-color)] animate-slide-in">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-2xl">
        <div className="flex items-center gap-2 text-white">
          <FiZap size={20} />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
          <FiX size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-[var(--accent)] text-white rounded-br-md' : 'bg-[var(--bg-secondary)] rounded-bl-md'}`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-secondary)] p-3 rounded-2xl rounded-bl-md">
              <FiLoader className="animate-spin" size={20} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-[var(--border-color)]">
        <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
          {quickPrompts.map(({ icon: Icon, label, prompt }) => (
            <button key={label} onClick={() => sendMessage(prompt)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--bg-secondary)] rounded-full hover:bg-[var(--bg-tertiary)] whitespace-nowrap transition">
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            className="input-field flex-1 px-3 py-2 rounded-full text-sm" placeholder="Ask me anything..." disabled={loading} />
          <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
            className="btn-primary w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50">
            <FiSend size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
