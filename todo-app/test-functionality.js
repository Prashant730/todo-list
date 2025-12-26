// Test script to validate all functionality
// Note: API key should be set via environment variables in production

// Create test tasks
const testTasks = [
  {
    title: 'Complete quarterly presentation',
    description:
      'Prepare slides, gather data, and practice delivery for Q4 board meeting',
    priority: 'high',
    category: 'Work',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16), // 7 days from now
    tags: ['presentation', 'quarterly', 'board-meeting'],
  },
  {
    title: 'Plan weekend trip',
    description: 'Research destinations, book hotels, and create itinerary',
    priority: 'medium',
    category: 'Personal',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16), // 3 days from now
    tags: ['travel', 'weekend'],
  },
  {
    title: 'Buy groceries',
    description: 'Weekly grocery shopping for meal prep',
    priority: 'low',
    category: 'Shopping',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16), // tomorrow
    tags: ['groceries', 'weekly'],
  },
  {
    title: 'Exercise routine',
    description: 'Morning workout - cardio and strength training',
    priority: 'medium',
    category: 'Health',
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16), // 2 hours from now
    tags: ['fitness', 'daily'],
    recurring: 'daily',
  },
]

console.log('Test data prepared:', testTasks)
console.log('API key should be configured via environment variables')
