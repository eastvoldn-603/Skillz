import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import DeleteAccount from './pages/DeleteAccount';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Resumes from './pages/Resumes';
import ResumeForm from './pages/ResumeForm';
import ResumeView from './pages/ResumeView';
import ResumeCompare from './pages/ResumeCompare';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Applications from './pages/Applications';
import Offers from './pages/Offers';
import SkillsTree from './pages/SkillsTree';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <div className="app__content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
              <Route path="/delete-account" element={<PrivateRoute><DeleteAccount /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/resumes" element={<PrivateRoute><Resumes /></PrivateRoute>} />
              <Route path="/resumes/new" element={<PrivateRoute><ResumeForm /></PrivateRoute>} />
              <Route path="/resumes/compare/:id1/:id2" element={<PrivateRoute><ResumeCompare /></PrivateRoute>} />
              <Route path="/resumes/:id/edit" element={<PrivateRoute><ResumeForm /></PrivateRoute>} />
              <Route path="/resumes/:id" element={<PrivateRoute><ResumeView /></PrivateRoute>} />
              <Route path="/jobs" element={<PrivateRoute><Jobs /></PrivateRoute>} />
              <Route path="/jobs/:id" element={<PrivateRoute><JobDetail /></PrivateRoute>} />
              <Route path="/applications" element={<PrivateRoute><Applications /></PrivateRoute>} />
              <Route path="/offers" element={<PrivateRoute><Offers /></PrivateRoute>} />
              <Route path="/skills-tree" element={<PrivateRoute><SkillsTree /></PrivateRoute>} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

