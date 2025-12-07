# Skills Tree Feature

## Overview
The Skills Tree is a game-like, visual resume builder that allows users to track their career progression in an engaging way, similar to character skill trees in video games like Diablo III.

## Features

### Visual Skills Tree
- **Interactive Tree Visualization**: SVG-based tree structure with zoom, pan, and node selection
- **Tiered Progression**: Skills organized in tiers (1-4) with prerequisite relationships
- **Visual Indicators**: 
  - Color-coded nodes based on skill level and unlock status
  - Progress rings showing skill level completion
  - Lock icons for locked skills
  - Category colors for visual organization

### Skill Categories
1. **Programming Languages** (💻) - JavaScript, Python, Java, C++, TypeScript
2. **Frameworks & Libraries** (⚙️) - React, Node.js, Express, Vue.js, Angular
3. **Databases** (🗄️) - SQL, MongoDB, PostgreSQL, Redis
4. **DevOps & Cloud** (☁️) - Docker, Kubernetes, AWS, Git
5. **Communication** (💬) - Team Communication, Public Speaking, Written Communication
6. **Leadership** (👥) - Team Leadership, Project Management, Mentoring
7. **Problem Solving** (🧩) - Critical Thinking, Debugging
8. **Design** (🎨) - UI Design, UX Design

### Skill Types
- **Hard Skills**: Technical, measurable abilities (programming, tools, technologies)
- **Soft Skills**: Interpersonal and behavioral skills (communication, leadership)

### User Features
- **Unlock Skills**: Add job experiences to automatically unlock related skills
- **Level Up**: Skills can be leveled from 0-10 based on experience
- **Experience Points**: Track experience points gained from jobs and activities
- **Statistics Dashboard**: View total skills unlocked, levels, experience points, and top skills
- **Job History**: Add and manage job experiences that contribute to skill progression

## Database Schema

### Tables Created
1. **skill_categories**: Categories for organizing skills
2. **skills**: Individual skills (hard and soft)
3. **skill_tree_nodes**: Tree structure with prerequisites and positions
4. **user_skills**: User's skill progress (level, experience, unlock status)
5. **job_experiences**: User's job history
6. **skill_unlocks**: Mapping of jobs to skills unlocked

## API Endpoints

### Skills Tree
- `GET /api/skills/tree` - Get skill tree structure
- `GET /api/skills/user/tree` - Get user's skill tree with progress
- `GET /api/skills` - Get all skills (with optional filters)
- `GET /api/skills/categories` - Get skill categories

### User Skills
- `GET /api/skills/user` - Get user's skills
- `POST /api/skills/user/:skillId` - Update user skill (level, experience)

### Job Experience
- `GET /api/skills/user/jobs` - Get user's job experiences
- `POST /api/skills/user/jobs` - Add job experience
- `POST /api/skills/user/jobs/:jobId/unlock-skills` - Unlock skills based on job

## Frontend Components

### Pages
- **SkillsTree.js**: Main page with tabs for tree, jobs, and statistics

### Components
- **SkillsTreeVisual.js**: SVG-based tree visualization with zoom/pan
- **SkillNode.js**: Individual skill node with visual indicators
- **JobExperienceForm.js**: Form for adding job experiences

## User Experience

### Skills Tree Tab
- Interactive tree visualization
- Click nodes to view details
- Zoom and pan controls
- Visual connections between parent and child skills
- Color-coded by category and unlock status

### Job Experience Tab
- Add job experiences with company, position, dates, description
- List of previous jobs
- Skills gained from each job
- Automatic skill unlocking based on job experience

### Statistics Tab
- Total skills unlocked
- Total skill levels
- Total experience points
- Hard vs soft skills breakdown
- Top 10 skills by level

## Seed Data

Run `npm run seed:skills` to populate the database with:
- 8 skill categories
- 30+ predefined skills
- Tiered tree structure with prerequisites

## Integration

- Accessible from main navigation: "🎮 Skills Tree"
- Route: `/skills-tree`
- Protected route (requires authentication)
- Can be integrated with resume creation/editing in future updates

## Technical Details

### Frontend
- React components with SVG rendering
- CSS animations and transitions
- Responsive design
- Interactive controls (zoom, pan, click)

### Backend
- Express.js routes with authentication
- SQLite database with foreign key constraints
- Validation using express-validator
- RESTful API design

### Styling
- BEM naming convention
- Game-inspired color scheme
- Dark theme for tree visualization
- Gradient backgrounds and card designs

## Future Enhancements

Potential improvements:
- Skill recommendations based on job applications
- Export skills tree as resume section
- Skill badges and achievements
- Social sharing of skill tree
- Skill comparison with job requirements
- Automatic skill suggestions from job descriptions

