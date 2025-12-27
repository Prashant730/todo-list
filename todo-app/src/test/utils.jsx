import { render } from '@testing-library/react';
import { TodoProvider } from '../context/TodoContext';

// Custom render function that includes providers
export function renderWithProviders(ui, options = {}) {
  const { initialState, ...renderOptions } = options;

  function Wrapper({ children }) {
    return (
      <TodoProvider initialState={initialState}>
        {children}
      </TodoProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock task data for testing
export const mockTasks = [
  {
    id: '1',
    title: 'Complete React project',
    description: 'Build a todo app with AI features',
    priority: 'high',
    categories: ['📚 Assignments'],
    dueDate: '2024-02-15T10:00',
    completed: false,
    createdAt: '2024-02-01T09:00:00.000Z',
    completedAt: null,
  },
  {
    id: '2',
    title: 'Study for exam',
    description: 'Review chapters 1-5',
    priority: 'medium',
    categories: ['📖 Study'],
    dueDate: '2024-02-10T14:00',
    completed: true,
    createdAt: '2024-01-28T10:00:00.000Z',
    completedAt: '2024-02-08T13:30:00.000Z',
  },
  {
    id: '3',
    title: 'Buy groceries',
    description: 'Milk, bread, eggs',
    priority: 'low',
    categories: ['🛒 Shopping'],
    dueDate: null,
    completed: false,
    createdAt: '2024-02-02T15:00:00.000Z',
    completedAt: null,
  },
];

// Mock AI service responses
export const mockAIResponses = {
  insights: [
    {
      type: 'study',
      title: 'Study Schedule',
      description: 'Consider breaking down large assignments into smaller daily tasks.',
    },
  ],
  breakdown: {
    dailyTasks: [
      {
        date: '2024-02-12',
        tasks: [
          {
            title: 'Research phase',
            description: 'Gather resources and create outline',
            priority: 'high',
            estimatedTime: '2 hours',
          },
        ],
      },
    ],
  },
  analytics: {
    productivityProfile: 'You are a consistent learner with good time management skills.',
    strengths: ['Regular task completion', 'Good prioritization'],
    weaknesses: ['Sometimes procrastinates on large tasks'],
    behavioralPatterns: ['More productive in mornings', 'Prefers shorter tasks'],
    actionableRecommendations: [
      'Break large tasks into smaller chunks',
      'Schedule difficult tasks in the morning',
    ],
    predictiveInsights: ['You will likely complete 85% of tasks this week'],
    gamificationSuggestions: ['Set daily completion streaks'],
  },
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';