import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './application/context/AuthContext';
import { ProtectedRoute } from './presentation/routes/ProtectedRoute';

// Pages
import Login from './presentation/pages/Login';
import Signup from './presentation/pages/Signup';
import ForgotPassword from './presentation/pages/ForgotPassword';
import Dashboard from './presentation/pages/Dashboard';
import HealthProfile from './presentation/pages/HealthProfile';
import LogMeal from './presentation/pages/LogMeal';
import MealHistory from './presentation/pages/MealHistory';
import AIAssistant from './presentation/pages/AIAssistant';
import MealPlanner from './presentation/pages/MealPlanner';
import AdminDashboard from './presentation/pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes (Redirect to Dashboard since Auth is disabled) */}
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
          <Route path="/forgot-password" element={<Navigate to="/dashboard" replace />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/health-profile" element={<HealthProfile />} />
            <Route path="/log-meal" element={<LogMeal />} />
            <Route path="/history" element={<MealHistory />} />
            <Route path="/ask-ai" element={<AIAssistant />} />
            <Route path="/planner" element={<MealPlanner />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* Add more protected routes here */}
          </Route>

          {/* Redirect root to dashboard (which will redirect to login if unauthenticated) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
