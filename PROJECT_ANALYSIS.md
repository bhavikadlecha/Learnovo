# Learnovo - Project Analysis & Documentation

## Table of Contents
- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Frontend Components](#frontend-components)
- [Key Features](#key-features)
- [Authentication & Authorization](#authentication--authorization)
- [Development Setup](#development-setup)
- [Project Status](#project-status)

---

## Project Overview

**Learnovo** is a full-stack AI-powered personalized learning management platform that helps users create customized study plans, track their learning progress, and access curated educational resources. The platform provides adaptive learning paths tailored to individual goals, pace, and proficiency levels.

### Core Purpose
- **Personalized Learning**: AI-driven study plans based on user preferences and goals
- **Progress Tracking**: Comprehensive monitoring of learning sessions and achievements
- **Resource Management**: Curated learning materials organized by subjects and topics
- **Study Planning**: Visual roadmaps with hierarchical topic dependencies
- **User Analytics**: Dashboard with learning statistics and recommendations

---

## Tech Stack

### Backend
- **Framework**: Django 5.2.4
- **API**: Django REST Framework 3.16.0
- **Authentication**: JWT (Simple JWT)
- **Database**: SQLite (development), PostgreSQL (production ready)
- **AI Integration**: GROQ API for roadmap generation
- **CORS**: django-cors-headers for frontend communication

### Frontend
- **Framework**: React 18.2.0
- **Routing**: React Router DOM 7.6.2
- **State Management**: Zustand 5.0.7
- **Data Visualization**: 
  - React Flow (roadmap graphs)
  - Recharts (progress charts)
  - D3.js (advanced visualizations)
  - React Calendar Heatmap (activity tracking)
- **HTTP Client**: Axios 1.11.0
- **Styling**: CSS Modules, Tailwind CSS

### Development Tools
- **Environment Management**: python-dotenv
- **Testing**: React Testing Library
- **Build Tool**: Create React App

---

## Architecture

```
┌─────────────────┐    HTTP/REST API    ┌──────────────────┐
│   React Frontend │ ←─────────────────→ │  Django Backend  │
│   (Port 3000)    │                     │   (Port 8000)    │
└─────────────────┘                     └──────────────────┘
                                                   │
                                                   ▼
                                        ┌──────────────────┐
                                        │   SQLite/PostgreSQL │
                                        │     Database      │
                                        └──────────────────┘
                                                   │
                                                   ▼
                                        ┌──────────────────┐
                                        │   GROQ AI API    │
                                        │ (Roadmap Generation) │
                                        └──────────────────┘
```

### Application Flow
1. **User Authentication**: JWT-based login/signup system
2. **Profile Setup**: Learning preferences and goals configuration
3. **Roadmap Generation**: AI-powered study plan creation
4. **Progress Tracking**: Real-time learning session monitoring
5. **Resource Management**: Access to curated learning materials
6. **Analytics Dashboard**: Progress visualization and insights

---

## File Structure

```
Learnovo/
├── backend/                           # Django Backend
│   ├── manage.py                      # Django management script
│   ├── requirements.txt               # Python dependencies
│   ├── db.sqlite3                     # SQLite database
│   ├── key.env                        # Environment variables
│   │
│   ├── learning_roadmap_django/       # Main Django project
│   │   ├── __init__.py
│   │   ├── settings.py                # Django configuration
│   │   ├── urls.py                    # Main URL routing
│   │   ├── wsgi.py                    # WSGI config
│   │   └── asgi.py                    # ASGI config
│   │
│   ├── accounts/                      # User authentication app
│   │   ├── views.py                   # Auth views (signup, login, profile)
│   │   ├── urls.py                    # Auth URL patterns
│   │   ├── serializers.py             # JWT serializers
│   │   └── authentication.py          # Custom auth logic
│   │
│   └── roadmap/                       # Learning roadmap app
│       ├── models.py                  # Data models (Topic, StudyPlan, Progress)
│       ├── views.py                   # API views & GROQ integration
│       ├── serializers.py             # API serializers
│       ├── urls.py                    # Roadmap URL patterns
│       ├── admin.py                   # Django admin config
│       └── migrations/                # Database migrations
│
└── frontend/                          # React Frontend
    ├── package.json                   # Node.js dependencies
    ├── public/                        # Static assets
    │   ├── index.html                 # Main HTML template
    │   └── favicon.ico                # App icon
    │
    └── src/                           # React source code
        ├── App.js                     # Main application component
        ├── index.js                   # React entry point
        ├── index.css                  # Global styles
        │
        ├── components/                # React components
        │   ├── Navbar.js              # Navigation bar
        │   ├── Home.js                # Landing page
        │   ├── About.js               # About page
        │   ├── Hero.js                # Hero section with slides
        │   ├── signup.jsx             # User registration
        │   ├── login.jsx              # User authentication
        │   ├── Profile.jsx            # User profile management
        │   ├── Form.jsx               # Learning preferences form
        │   ├── StudyPlan.jsx          # Study plan listing
        │   ├── StudyPlanCard.jsx      # Individual plan cards
        │   ├── RoadmapPage.jsx        # Roadmap visualization page
        │   ├── RoadmapGraph.jsx       # Interactive roadmap graph
        │   ├── Progress.jsx           # Progress tracking
        │   ├── ProgressCalendar.jsx   # Calendar heatmap
        │   ├── Dashboard.js           # User dashboard
        │   ├── AuthContext.jsx        # Authentication context
        │   ├── AuthenticatedLayout.jsx # Protected route layout
        │   ├── PrivateRoute.jsx       # Route protection
        │   ├── Resources.js           # Learning resources
        │   ├── Sidebar.jsx            # Navigation sidebar
        │   ├── CustomNode.jsx         # Custom graph nodes
        │   └── ThemeContext.js        # Theme management
        │
        └── store/                     # State management
            └── userStore.js           # Zustand user store
```

---

## Database Models

### Core Models (roadmap app)

#### Topic
```python
class Topic(models.Model):
    name = models.CharField(max_length=200)
    subject = models.CharField(max_length=200)
    estimated_time = models.FloatField(null=True, blank=True)
```

#### StudyPlan
```python
class StudyPlan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    main_topic = models.CharField(max_length=255)
    available_time = models.IntegerField()
    created_at = models.DateField(auto_now_add=True)
```

#### UserProgress
```python
class UserProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    time_spent = models.FloatField(default=0)
    target_time = models.FloatField(default=0)
    completed = models.BooleanField(default=False)
    date = models.DateField(auto_now_add=True)
```

#### RoadmapTopic
```python
class RoadmapTopic(models.Model):
    study_plan = models.ForeignKey(StudyPlan, on_delete=models.CASCADE, related_name='roadmaps')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Extended Learning Models (learning app)

The codebase also includes a more comprehensive learning system with additional models:

- **Subject & Topic**: Hierarchical organization of learning content
- **LearningPreference**: User's learning goals and proficiency levels
- **LearningGoal**: Specific learning objectives with progress tracking
- **LearningSession**: Individual study session tracking
- **Resource**: Learning materials (videos, articles, courses)
- **UserResource**: User interaction with resources
- **Progress**: Comprehensive progress tracking across subjects

---

## API Endpoints

### Authentication (`/api/users/`)
- `POST /register/` - User registration
- `POST /login/` - User authentication (JWT)
- `POST /logout/` - User logout
- `GET /profile/` - User profile retrieval

### Roadmap Management (`/roadmap/`)
- `GET /generate_roadmap/` - AI-powered roadmap generation
- `GET /user_study_plans/` - User's study plans
- `POST /save_plan/` - Save generated study plan
- `GET /get_plan/{id}/` - Retrieve specific plan
- `DELETE /delete_plan/{id}/` - Delete study plan
- `GET /topics/` - List available topics
- `GET /progress/` - User progress data

### Learning System (`/api/learning/`)
- `GET /subjects/` - List subjects
- `GET /topics/` - List topics by subject
- `GET|PUT /preferences/` - Learning preferences
- `GET|POST /goals/` - Learning goals management
- `GET|POST /sessions/` - Learning session tracking
- `GET /resources/` - Learning resources
- `GET /progress/` - Progress tracking
- `GET /dashboard/` - Dashboard analytics

---

## Frontend Components

### Core Layout Components
- **App.js**: Main application with routing logic
- **Navbar.js**: Navigation bar with authentication state
- **AuthenticatedLayout.jsx**: Protected route wrapper
- **Sidebar.jsx**: Navigation sidebar for authenticated users

### Authentication Components
- **signup.jsx**: User registration form
- **login.jsx**: User authentication form
- **AuthContext.jsx**: Authentication state management
- **PrivateRoute.jsx**: Route protection component

### Learning Management Components
- **Form.jsx**: Learning preferences configuration
- **StudyPlan.jsx**: Study plan listing and management
- **StudyPlanCard.jsx**: Individual study plan cards
- **RoadmapPage.jsx**: Roadmap visualization page
- **RoadmapGraph.jsx**: Interactive study roadmap with React Flow

### Progress Tracking Components
- **Progress.jsx**: Main progress tracking interface
- **ProgressCalendar.jsx**: GitHub-style activity heatmap
- **Dashboard.js**: User analytics dashboard

### Visualization Components
- **CustomNode.jsx**: Custom nodes for roadmap graphs
- **RoadmapGraph.jsx**: Interactive learning path visualization

---

## Key Features

### 1. AI-Powered Roadmap Generation
- **GROQ Integration**: Uses GROQ API for generating personalized study roadmaps
- **Hierarchical Planning**: Creates topic dependencies and learning sequences
- **Time-based Planning**: Allocates study time based on user availability

### 2. Interactive Study Roadmaps
- **Visual Graph**: React Flow-based interactive roadmap visualization
- **Node Dependencies**: Clear prerequisite relationships between topics
- **Progress Tracking**: Visual indicators of completion status

### 3. Progress Analytics
- **Calendar Heatmap**: GitHub-style activity visualization
- **Session Tracking**: Detailed learning session monitoring
- **Progress Metrics**: Time spent, completion rates, and learning velocity

### 4. Personalized Learning
- **Preference System**: Proficiency levels, time availability, deadlines
- **Adaptive Content**: Resources matched to user skill level
- **Goal Management**: SMART goal setting and tracking

### 5. Resource Management
- **Curated Content**: Organized learning materials by subject/topic
- **Resource Types**: Videos, articles, courses, and practice materials
- **Progress Tracking**: Individual resource completion tracking

---

## Authentication & Authorization

### JWT Implementation
- **Token-based**: Uses Django REST Framework Simple JWT
- **Access & Refresh**: Secure token rotation system
- **Local Storage**: Frontend token persistence

### User Management
- **Registration**: Email-based user accounts
- **Profile Management**: Learning preferences and goals
- **Progress Isolation**: User-specific data segregation

### Route Protection
- **Frontend Guards**: Private route components
- **Backend Permissions**: API endpoint protection
- **Authentication State**: Global authentication context

---

## Development Setup

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Environment Configuration
Create `backend/key.env`:
```env
DEBUG=True
DJANGO_SECRET_KEY=your-secret-key
GROQ_API_KEY=your-groq-api-key
```

---

## Project Status

### Completed Features ✅
- User authentication system (JWT)
- AI-powered roadmap generation
- Interactive roadmap visualization
- Progress tracking with calendar heatmap
- Study plan management
- Basic dashboard functionality
- CORS configuration for API communication

### In Development 🚧
- Extended learning system (parallel implementation)
- Resource management system
- Advanced analytics dashboard
- Mobile responsiveness
- API optimization

### Architecture Notes 📝
- **Dual Systems**: The project has both a basic roadmap system and an extended learning system
- **Database**: Currently using SQLite for development, PostgreSQL configuration available
- **API Design**: RESTful API with comprehensive endpoint coverage
- **State Management**: Combination of React Context and Zustand
- **Styling**: Mix of CSS Modules and Tailwind CSS

### Future Enhancements 🔮
- Machine learning recommendations
- Social learning features
- Mobile application
- Advanced analytics
- Integration with external learning platforms
- Gamification elements

---

## Technical Highlights

1. **AI Integration**: GROQ API for intelligent roadmap generation
2. **Interactive Visualizations**: React Flow for complex graph representations
3. **Real-time Progress**: Dynamic progress tracking and analytics
4. **Modular Architecture**: Clean separation of concerns
5. **Responsive Design**: Mobile-first approach
6. **Security**: JWT-based authentication with proper token handling
7. **Performance**: Optimized React components with proper state management

This project demonstrates a modern full-stack approach to educational technology, combining AI-powered content generation with intuitive user interfaces and comprehensive progress tracking.
