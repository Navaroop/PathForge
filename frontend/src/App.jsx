import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import SignUp from './pages/SignUp';
// import SignIn from './pages/SignIn';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import CGPA from './pages/CGPA';
import SubjectSuggester from './pages/SubjectSuggester';
import CareerRoadmap from './pages/CareerRoadmap';
import { ThemeProvider } from './ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
      <Routes>
        {/* Public Routes */}
        {/* <Route path="/" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} /> */}

        <Route path="/signin" element={<AuthPage />} />
        <Route path="/" element={<AuthPage />} />

        {/* Protected Routes — all inside Dashboard Layout */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="cgpa" element={<CGPA />} />
          <Route path="subjects" element={<SubjectSuggester />} />
          <Route path="roadmap" element={<CareerRoadmap />} />
        </Route>

        {/* Catch all — redirect to signin */}
        <Route path="*" element={<Navigate to="/signin" />} />
      </Routes>
    </Router>
    </ThemeProvider>
  );
}

export default App;