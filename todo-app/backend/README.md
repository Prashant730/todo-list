# Student Todo App - Backend API

Node.js/Express backend with MongoDB for the Student Todo App.

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Configure environment:

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

3. Start server:

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Tasks

- `GET /api/tasks` - Get all tasks (with filters)
- `POST /api/tasks` - Create task
- `POST /api/tasks/bulk` - Bulk create tasks
- `GET /api/tasks/:id` - Get single task
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/toggle` - Toggle completion
- `PUT /api/tasks/reorder` - Reorder tasks
- `DELETE /api/tasks/:id` - Delete task
- `DELETE /api/tasks/bulk` - Bulk delete
- `DELETE /api/tasks/clear-completed` - Clear completed

### Categories

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Templates

- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/:id/use` - Create tasks from template

### Analytics

- `GET /api/analytics/summary` - Get analytics summary
- `GET /api/analytics/streaks` - Get streak data
- `GET /api/analytics/history` - Get historical data
- `POST /api/analytics/reset` - Reset productivity data

### Settings

- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings

## Query Parameters for Tasks

- `status`: all, completed, active, overdue, today, week
- `priority`: all, low, medium, high
- `category`: category ID
- `search`: search term
- `sortBy`: field name
- `sortOrder`: asc, desc
