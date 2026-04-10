import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

function SignUp() {
  const [formData, setFormData] = useState({
    fullName: '', email: '', department: '',
    currentSemester: '', password: '', confirmPassword: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await axiosClient.post('/api/auth/signup', {
        fullName:        formData.fullName,
        email:           formData.email,
        password:        formData.password,
        department:      formData.department,
        currentSemester: Number(formData.currentSemester),
      });

      const data = response.data;

      // Save user info to localStorage (Token is now handled via secure HTTPOnly cookies automatically)
      localStorage.setItem('fullName',        data.fullName);
      localStorage.setItem('email',           data.email);
      localStorage.setItem('department',      data.department);
      localStorage.setItem('currentSemester', String(data.currentSemester));

      navigate('/dashboard');

    } catch (err) {
      if (err.response) {
        setError(err.response.data?.message || `Sign up failed (${err.response.status}). Try again.`);
      } else {
        setError('Could not connect to server. Make sure the backend is running on port 8080.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass  = "w-full bg-[var(--bg-surface)] border border-[rgba(56,189,248,0.15)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm outline-none focus:border-[var(--accent-highlight)] transition-colors";
  const selectClass = "w-full bg-[var(--bg-secondary)] border border-[rgba(56,189,248,0.15)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm outline-none focus:border-[var(--accent-highlight)] transition-colors appearance-none";

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-10 overflow-hidden bg-[var(--bg-primary)]">

      {/* Background Glows */}
      <div className="absolute top-[-80px] left-[-80px] w-80 h-80 bg-[var(--accent-primary)] opacity-10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-80px] right-[-80px] w-80 h-80 bg-[var(--accent-highlight)] opacity-10 rounded-full blur-[100px]" />

      {/* Glass Card */}
      <div className="relative z-10 w-full max-w-sm bg-[var(--bg-secondary)] border border-[rgba(56,189,248,0.15)] rounded-2xl shadow-[0_0_40px_rgba(56,189,248,0.06)] p-8">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded-full border-[1.5px] border-[rgba(56,189,248,0.5)] flex items-center justify-center mb-4">
            <span className="text-[var(--accent-highlight)] text-xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Sign Up</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Create your student account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-red-400 text-sm rounded-xl px-4 py-2 mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">

          <input type="text" name="fullName" value={formData.fullName}
            onChange={handleChange} placeholder="Full Name" required className={inputClass} />

          <input type="email" name="email" value={formData.email}
            onChange={handleChange} placeholder="Email Address" required className={inputClass} />

          <select name="department" value={formData.department}
            onChange={handleChange} required className={selectClass}>
            <option value="">Department</option>
            <option value="CSE">Computer Science Engineering (CSE)</option>
            <option value="IT">Information Technology (IT)</option>
            <option value="ECE">Electronics & Communication (ECE)</option>
            <option value="EEE">Electrical & Electronics (EEE)</option>
            <option value="MECH">Mechanical Engineering</option>
            <option value="CIVIL">Civil Engineering</option>
          </select>

          <select name="currentSemester" value={formData.currentSemester}
            onChange={handleChange} required className={selectClass}>
            <option value="">Current Semester</option>
            {[1,2,3,4,5,6,7,8].map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>

          <input type="password" name="password" value={formData.password}
            onChange={handleChange} placeholder="Password" required className={inputClass} />

          <input type="password" name="confirmPassword" value={formData.confirmPassword}
            onChange={handleChange} placeholder="Confirm Password" required className={inputClass} />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-bold text-sm hover:bg-[var(--accent-highlight)] transition-colors mt-2 disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

        </form>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-5">
          Already have an account?{' '}
          <Link to="/signin" className="font-bold text-[var(--accent-highlight)] hover:underline">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}

export default SignUp;