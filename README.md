# 🎓 Student Study Planner - Deep Productivity Analysis Todo App

A full-stack todo application focused on **behavioral analytics**, not just task management. Built with React (frontend) and Node.js + Express + MongoDB (backend).

**No fake AI. No buzzwords. Everything is logically defensible and data-driven.**

## ✨ Key Features

### � Dmeep Productivity Analytics

- **Completion Analytics**: Tasks created vs completed, completion rate, overdue percentage
- **Time-Based Productivity**: Most productive hours/days, average completion time
- **Priority vs Reality Analysis**: Are high-priority tasks actually treated as urgent?
- **Focus & Context Switching**: Track task category switches and focus streaks
- **Goal Alignment**: Link tasks to weekly goals, track goal completion rate
- **Procrastination Detection**: Identify tasks postponed 3+ times, overdue 7+ days, never started

### 🎯 Transparent Productivity Score

Formula: `Score = (CompletionRate × 0.30) + (OnTimeRate × 0.25) + (FocusScore × 0.20) + (AntiProcrastination × 0.25)`

Each component is:

- Calculated from real data (no dummy values)
- Normalized to 0-100 scale
- Explained with clear descriptions

### 📈 Data-Driven Reports

- Weekly and monthly report generation
- Every insight tied to actual metrics
- Actionable suggestions based on patterns
- No generic text or fake AI suggestions

### 🔐 Full Authentication

- JWT-based authentication
- User registration and login
- Secure password hashing with bcrypt

## 🛠️ Tech Stack

### Frontend

- **React 19** with Vite
- **TailwindCSS** for styling
- **Recharts** for data visualization
- **date-fns** for date manipulation

### Backend

- **Node.js + Express**
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Helmet** for security headers
- **Rate limiting** for API protection

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone and Install

```bash
git clone <repository-url>
cd todo-app

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 2. Configure Environment

**Frontend** (`todo-app/.env`):

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Student Study Planner
```

**Backend** (`todo-app/backend/.env`):

```env
MONGODB_URI=mongodb://localhost:27017/student-todo-app
JWT_SECRET=your-secure-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Start Development Servers

```bash
# Terminal 1: Start backend
cd todo-app/backend
npm start

# Terminal 2: Start frontend
cd todo-app
npm run dev
```

Open http://localhost:5173 in your browser.

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tasks

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/toggle` - Toggle completion

### Analytics

- `GET /api/analytics/completion` - Completion analytics
- `GET /api/analytics/time-patterns` - Time-based productivity
- `GET /api/analytics/priority` - Priority vs reality analysis
- `GET /api/analytics/focus` - Focus & context switching
- `GET /api/analytics/procrastination` - Procrastination detection
- `GET /api/analytics/productivity-score` - Overall productivity score

### Reports

- `GET /api/reports/weekly` - Weekly report
- `GET /api/reports/monthly` - Monthly report

### Goals

- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal

## 📊 Analytics Deep Dive

### Productivity Score Components

| Component            | Weight | Description                            |
| -------------------- | ------ | -------------------------------------- |
| Completion Rate      | 30%    | Percentage of tasks completed          |
| On-Time Rate         | 25%    | Tasks completed by deadline            |
| Focus Score          | 20%    | Low context switching, sustained focus |
| Anti-Procrastination | 25%    | Inverse of procrastination behaviors   |

### Procrastination Detection Criteria

- Tasks postponed more than 3 times
- Tasks overdue more than 7 days
- Tasks created but never started (pending 3+ days)

### Priority Effectiveness

Measures if high-priority tasks are:

- Completed faster than low-priority
- Started sooner
- Have fewer missed deadlines

## 🔒 Security Features

- JWT authentication with secure secrets
- Password hashing with bcrypt
- Helmet security headers
- CORS configuration
- Rate limiting (100 requests/15 min)
- Input validation with express-validator
- Graceful error handling

## 📁 Project Structure

```
todo-app/
├── src/                    # Frontend React app
│   ├── components/         # React components
│   ├── context/           # React context (Auth, Todo)
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── backend/               # Backend Express app
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── services/          # Business logic (analytics)
│   └── middleware/        # Auth, validation middleware
├── public/                # Static assets
└── docs/                  # Documentation
```

## 🧪 Testing

```bash
# Run tests
npm run test:run

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## 🚢 Deployment

See [DEPLOYMENT.md](todo-app/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Checklist

1. Set production environment variables
2. Generate secure JWT_SECRET: `openssl rand -base64 32`
3. Deploy backend to Render/Railway
4. Deploy frontend to Vercel/Netlify
5. Update CORS and API URLs

## 📄 Documentation

- [Deep Productivity Analysis](todo-app/docs/DEEP_PRODUCTIVITY_ANALYSIS.md) - Detailed explanation of analytics methodology
- [Deployment Guide](todo-app/DEPLOYMENT.md) - Production deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

MIT License

---

**Built for students who want data-driven insights into their productivity, not fake AI suggestions.**
