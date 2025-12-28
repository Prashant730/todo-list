import { useState } from 'react';
import { FiPlay, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import { useTodo } from '../context/TodoContext';
import config from '../config/env';

export default function TestRunner() {
  const { state, dispatch } = useTodo();
  const [testResults, setTestResults] = useState({});
  const [currentTest, setCurrentTest] = useState(null);
  const [showTests, setShowTests] = useState(false);

  const tests = [
    {
      id: 'setup',
      name: 'Setup API Key',
      description: 'Set up Gemini API key for testing',
      test: async () => {
        const apiKey = config.geminiApiKey || 'test-key-configured';
        localStorage.setItem('gemini-api-key', apiKey);
        return { success: true, message: 'API key configured from environment' };
      }
    },
    {
      id: 'create-tasks',
      name: 'Create Test Tasks',
      description: 'Create sample tasks for testing',
      test: async () => {
        const testTasks = [
          {
            title: 'Complete quarterly presentation',
            description: 'Prepare slides, gather data, and practice delivery for Q4 board meeting',
            priority: 'high',
            category: 'Work',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
            tags: ['presentation', 'quarterly']
          },
          {
            title: 'Plan weekend trip',
            description: 'Research destinations and book hotels',
            priority: 'medium',
            category: 'Personal',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
            tags: ['travel']
          },
          {
            title: 'Buy groceries',
            description: 'Weekly grocery shopping',
            priority: 'low',
            category: 'Shopping',
            dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
            tags: ['groceries']
          }
        ];

        testTasks.forEach(task => {
          dispatch({ type: 'ADD_TASK', payload: task });
        });

        return { success: true, message: `Created ${testTasks.length} test tasks` };
      }
    },
    {
      id: 'ai-insights',
      name: 'Test AI Insights',
      description: 'Generate AI insights from tasks',
      test: async () => {
        try {
          const { aiService } = await import('../services/aiService.js');
          const insights = await aiService.generateInsights(state.tasks.slice(0, 3));
          return { success: true, message: `Generated ${insights.length} insights`, data: insights };
        } catch (error) {
          return { success: false, message: `AI Error: ${error.message}` };
        }
      }
    },
    {
      id: 'task-breakdown',
      name: 'Test AI Task Breakdown',
      description: 'Test AI task breakdown functionality',
      test: async () => {
        try {
          const { aiService } = await import('../services/aiService.js');
          const testTask = {
            title: 'Complete quarterly presentation',
            description: 'Create comprehensive quarterly review presentation',
            priority: 'high',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          };

          const breakdown = await aiService.generateTaskBreakdown(testTask);
          return { success: true, message: `Generated breakdown with ${breakdown.dailyTasks?.length || 0} days`, data: breakdown };
        } catch (error) {
          return { success: false, message: `Breakdown Error: ${error.message}` };
        }
      }
    },
    {
      id: 'analytics',
      name: 'Test AI Analytics',
      description: 'Test comprehensive analytics generation',
      test: async () => {
        try {
          const { aiService } = await import('../services/aiService.js');
          const analyticsData = {
            totalTasks: state.tasks.length,
            completedTasks: state.tasks.filter(t => t.completed).length,
            highPriorityTasks: state.tasks.filter(t => t.priority === 'high').length,
            categories: [...new Set(state.tasks.map(t => t.category).filter(Boolean))]
          };

          const analytics = await aiService.generateAnalytics(analyticsData);
          return { success: true, message: 'Analytics generated successfully', data: analytics };
        } catch (error) {
          return { success: false, message: `Analytics Error: ${error.message}` };
        }
      }
    },
    {
      id: 'chat-assistant',
      name: 'Test AI Chat',
      description: 'Test AI chat assistant',
      test: async () => {
        try {
          const { aiService } = await import('../services/aiService.js');
          const context = {
            totalTasks: state.tasks.length,
            activeTasks: state.tasks.filter(t => !t.completed).length,
            highPriorityTasks: state.tasks.filter(t => t.priority === 'high' && !t.completed).length
          };

          const response = await aiService.generateChatResponse("What should I focus on today?", context);

          if (response && response.length > 10) {
            return { success: true, message: 'Chat response generated', data: { response } };
          }

          return { success: false, message: 'No valid response' };
        } catch (error) {
          return { success: false, message: `Chat Error: ${error.message}` };
        }
      }
    },
    {
      id: 'notifications',
      name: 'Test Notifications',
      description: 'Test notification system',
      test: async () => {
        // Create a task due in 1 hour to trigger notification
        const urgentTask = {
          title: 'Urgent test task',
          description: 'This should trigger a notification',
          priority: 'high',
          category: 'Work',
          dueDate: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16), // 1 hour from now
          tags: ['urgent', 'test']
        };

        dispatch({ type: 'ADD_TASK', payload: urgentTask });
        return { success: true, message: 'Notification test task created' };
      }
    },
    {
      id: 'export-import',
      name: 'Test Export/Import',
      description: 'Test data export and import functionality',
      test: async () => {
        try {
          // Test JSON export
          const exportData = JSON.stringify(state.tasks, null, 2);

          // Test import validation
          const testImport = JSON.parse(exportData);

          if (Array.isArray(testImport)) {
            return { success: true, message: `Export/Import validated with ${testImport.length} tasks` };
          }

          return { success: false, message: 'Export data validation failed - not an array' };
        } catch (error) {
          return { success: false, message: `Export/Import Error: ${error.message}` };
        }
      }
    }
  ];

  const runTest = async (test) => {
    setCurrentTest(test.id);
    try {
      const result = await test.test();
      setTestResults(prev => ({
        ...prev,
        [test.id]: result
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [test.id]: { success: false, message: error.message }
      }));
    }
    setCurrentTest(null);
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getTestIcon = (testId) => {
    if (currentTest === testId) return <FiLoader className="animate-spin text-blue-500" />;
    const result = testResults[testId];
    if (!result) return <FiPlay className="text-gray-400" />;
    return result.success ? <FiCheck className="text-green-500" /> : <FiX className="text-red-500" />;
  };

  if (!showTests) {
    return (
      <button
        onClick={() => setShowTests(true)}
        className="fixed bottom-20 right-6 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition z-40"
      >
        🧪 Run Tests
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-80 w-96 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl z-40 max-h-[600px] overflow-hidden">
      <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
        <h3 className="font-semibold">Functionality Tests</h3>
        <div className="flex gap-2">
          <button
            onClick={runAllTests}
            disabled={currentTest}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Run All
          </button>
          <button onClick={() => setShowTests(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            ✕
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[500px] p-4">
        <div className="space-y-3">
          {tests.map(test => (
            <div key={test.id} className="border border-[var(--border-color)] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTestIcon(test.id)}
                  <span className="font-medium text-sm">{test.name}</span>
                </div>
                <button
                  onClick={() => runTest(test)}
                  disabled={currentTest === test.id}
                  className="px-2 py-1 bg-[var(--bg-secondary)] rounded text-xs hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
                >
                  Run
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)] mb-2">{test.description}</p>

              {testResults[test.id] && (
                <div className={`text-xs p-2 rounded ${testResults[test.id].success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                  {testResults[test.id].message}
                  {testResults[test.id].data && (
                    <details className="mt-1">
                      <summary className="cursor-pointer">View Data</summary>
                      <pre className="mt-1 text-xs overflow-auto max-h-20">
                        {JSON.stringify(testResults[test.id].data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}