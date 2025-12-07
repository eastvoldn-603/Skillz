# Skillz - Resume & Job Application Manager

A LinkedIn-like web application that allows users to maintain multiple resumes and apply to jobs.

## Features

### User Account Management
- User registration and login
- Password reset functionality
- Change password
- Delete account
- View and edit profile information

### Resume Management
- Create multiple resumes
- Edit and delete resumes
- View all resumes

### Job Application Management
- Browse available jobs
- Apply to jobs with selected resume
- View all job applications
- View and manage job offers
- Edit and delete applications

## Tech Stack

- **Frontend**: React, Bootstrap, HTML, CSS (BEM naming convention)
- **Backend**: Node.js, Express
- **Database**: MySQL
- **Hosting**: Azure
- **Infrastructure**: Terraform
- **CI/CD**: GitHub Actions
- **Testing**: Jest

## Prerequisites

- Node.js (v18 or higher)
- MySQL (8.0 or higher)
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Skillz
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=skillz_db
JWT_SECRET=your-secret-key-change-in-production
```

### 4. Set up MySQL database

Create a MySQL database:

```sql
CREATE DATABASE skillz_db;
```

The database schema will be automatically created when you start the server.

### 5. Run the application

#### Development mode (runs both frontend and backend):

```bash
npm run dev
```

#### Or run separately:

Backend:
```bash
npm run server
```

Frontend (in a new terminal):
```bash
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Project Structure

```
Skillz/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/             # Configuration files
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── tests/              # Test files
│   └── index.js
├── terraform/              # Infrastructure as code
├── .github/workflows/      # CI/CD pipelines
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/change-password` - Change password (authenticated)

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/account` - Delete user account

### Resumes
- `GET /api/resumes` - Get all user resumes
- `GET /api/resumes/:id` - Get single resume
- `POST /api/resumes` - Create new resume
- `PUT /api/resumes/:id` - Update resume
- `DELETE /api/resumes/:id` - Delete resume

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get single job
- `POST /api/jobs/:id/apply` - Apply to job
- `GET /api/jobs/applications/all` - Get all applications
- `GET /api/jobs/applications/:id` - Get single application
- `PUT /api/jobs/applications/:id` - Update application
- `DELETE /api/jobs/applications/:id` - Delete application
- `GET /api/jobs/offers/all` - Get all offers
- `GET /api/jobs/offers/:id` - Get single offer
- `PUT /api/jobs/offers/:id` - Update offer
- `DELETE /api/jobs/offers/:id` - Delete offer

## Deployment

### Using Terraform

1. Install Terraform
2. Configure variables in `terraform/terraform.tfvars`
3. Initialize Terraform:
   ```bash
   cd terraform
   terraform init
   ```
4. Plan deployment:
   ```bash
   terraform plan
   ```
5. Apply configuration:
   ```bash
   terraform apply
   ```

### Manual Deployment to Azure

1. Create Azure App Service for backend
2. Create Azure App Service for frontend
3. Create Azure MySQL Flexible Server
4. Configure environment variables in Azure Portal
5. Deploy backend and frontend

## CI/CD

The project includes GitHub Actions workflows for:
- Running tests on push/PR
- Building frontend
- Deploying to Azure (on main branch)

Configure the following secrets in GitHub:
- `AZURE_CREDENTIALS`
- `AZURE_BACKEND_APP_NAME`
- `AZURE_FRONTEND_APP_NAME`
- `REACT_APP_API_URL`

## CSS Naming Convention

This project uses BEM (Block Element Modifier) naming convention for CSS classes.

Example:
```css
.block {}
.block__element {}
.block--modifier {}
.block__element--modifier {}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.

