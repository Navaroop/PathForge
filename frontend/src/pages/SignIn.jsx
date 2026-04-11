import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

function SignIn() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axiosClient.post('/api/auth/signin', {
        email: formData.email,
        password: formData.password,
      });

      const data = response.data;

      localStorage.setItem('jwt', data.token);

      // Save user info to localStorage (Token is now handled via secure HTTPOnly cookies automatically)
      localStorage.setItem('fullName', data.fullName);
      localStorage.setItem('email', data.email);
      localStorage.setItem('department', data.department);
      localStorage.setItem('currentSemester', String(data.currentSemester));

      navigate('/dashboard');

    } catch (err) {
      if (err.response) {
        if (err.response.status === 403 || err.response.status === 401) {
          setError('Invalid email or password. If you have not signed up yet, create an account first.');
        } else {
          setError(err.response.data?.message || `Server error (${err.response.status}). Please try again.`);
        }
      } else {
        setError('Could not connect to server. Make sure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-[var(--bg-primary)]">

      {/* Deep Space Background Glows */}
      <div className="absolute top-[-80px] left-[-80px] w-80 h-80 bg-[var(--accent-primary)] opacity-10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-80px] right-[-80px] w-80 h-80 bg-[var(--accent-highlight)] opacity-10 rounded-full blur-[100px]" />

      {/* Orbit Blue Card */}
      <div className="relative z-10 w-full max-w-sm bg-[var(--bg-secondary)] border border-[rgba(56,189,248,0.15)] rounded-2xl shadow-[0_0_40px_rgba(56,189,248,0.06)] p-8">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-10 h-10 rounded-full border-[1.5px] border-[rgba(56,189,248,0.5)] flex items-center justify-center mb-4">
            <span className="text-[var(--accent-highlight)] text-xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] leading-tight">
            PathForge
          </h1>
          <p className="text-[var(--text-muted)] mt-1 font-medium text-sm">Welcome Back</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-red-400 text-sm rounded-xl px-4 py-2 mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            required
            className="w-full bg-[var(--bg-surface)] border border-[rgba(56,189,248,0.15)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm outline-none focus:border-[var(--accent-highlight)] transition-colors"
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
            className="w-full bg-[var(--bg-surface)] border border-[rgba(56,189,248,0.15)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm outline-none focus:border-[var(--accent-highlight)] transition-colors"
          />

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-bold text-sm hover:bg-[var(--accent-highlight)] transition-colors mt-2 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </form>

        {/* Forgot Password */}
        <div className="text-right mt-3">
          <span className="text-sm text-[var(--accent-highlight)] cursor-pointer hover:underline transition-colors">
            Forgot password?
          </span>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          Don't have an account?{' '}
          <Link to="/" className="font-bold text-[var(--accent-highlight)] hover:underline">
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
}

export default SignIn;