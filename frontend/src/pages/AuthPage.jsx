import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import './AuthPage.css';

const DEPARTMENTS = [
    { val: 'CSE', label: 'Computer Science Engineering (CSE)' },
    { val: 'IT', label: 'Information Technology (IT)' },
    { val: 'ECE', label: 'Electronics & Communication (ECE)' },
    { val: 'EEE', label: 'Electrical & Electronics (EEE)' },
    { val: 'MECH', label: 'Mechanical Engineering' },
    { val: 'CIVIL', label: 'Civil Engineering' },
];


export default function AuthPage() {
    const navigate = useNavigate();
    const [active, setActive] = useState(false);   // false=login  true=register
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Wake up Railway backend on page load
        axiosClient.get('/api/auth/health').catch(() => { });
    }, []);

    // ── Login state ──────────────────────────────────────────
    const [login, setLogin] = useState({ email: '', password: '' });

    // ── Register state ───────────────────────────────────────
    const [reg, setReg] = useState({
        fullName: '', email: '', password: '', confirmPassword: '',
        department: '', currentSemester: '',
    });

    const goRegister = () => { setActive(true); setError(''); };
    const goLogin = () => { setActive(false); setError(''); };

    // ── Submit login ─────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try {
            const res = await axiosClient.post('/api/auth/signin', {
                email: login.email,
                password: login.password
            });

            const data = res.data;
            localStorage.setItem('jwt', data.token);
            localStorage.setItem('fullName', data.fullName);
            localStorage.setItem('email', data.email);
            localStorage.setItem('department', data.department);
            localStorage.setItem('currentSemester', String(data.currentSemester));
            navigate('/dashboard');
        } catch (err) {
            if (err.response) {
                setError(err.response.status === 401 || err.response.status === 403
                    ? 'Invalid email or password.'
                    : err.response.data?.message || `Error (${err.response.status})`);
            } else {
                setError('Cannot connect to server. Is the backend running?');
            }
        } finally { setLoading(false); }
    };

    // ── Submit register ──────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        if (reg.password !== reg.confirmPassword) {
            setError('Passwords do not match.'); setLoading(false); return;
        }
        try {
            const res = await axiosClient.post('/api/auth/signup', {
                fullName: reg.fullName,
                email: reg.email,
                password: reg.password,
                department: reg.department,
                currentSemester: Number(reg.currentSemester),
            });

            const data = res.data;
            localStorage.setItem('jwt', data.token);
            localStorage.setItem('fullName', data.fullName);
            localStorage.setItem('email', data.email);
            localStorage.setItem('department', data.department);
            localStorage.setItem('currentSemester', String(data.currentSemester));
            navigate('/dashboard');
        } catch (err) {
            if (err.response) {
                setError(err.response.data?.message || `Error (${err.response.status})`);
            } else {
                setError('Cannot connect to server. Is the backend running?');
            }
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className={`auth-container${active ? ' active' : ''}`}>

                {/* ── LOGIN FORM ─────────────────────────────────── */}
                <div className="form-box login">
                    <form onSubmit={handleLogin}>
                        <h1>Login</h1>

                        {!active && error && <div className="auth-error">{error}</div>}

                        <div className="input-box">
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={login.email}
                                onChange={e => setLogin({ ...login, email: e.target.value })}
                                required
                            />
                            <i className="bx bxs-envelope"></i>
                        </div>

                        <div className="input-box">
                            <input
                                type="password"
                                placeholder="Password"
                                value={login.password}
                                onChange={e => setLogin({ ...login, password: e.target.value })}
                                required
                            />
                            <i className="bx bxs-lock-alt"></i>
                        </div>

                        <div className="forgot-link">
                            <a href="#">Forgot Password?</a>
                        </div>

                        <button type="submit" className="btn" disabled={loading}>
                            {loading && !active ? 'Signing in...' : 'Login'}
                        </button>


                    </form>
                </div>

                {/* ── REGISTER FORM ──────────────────────────────── */}
                <div className="form-box register">
                    <form onSubmit={handleRegister}>
                        <h1>Registration</h1>

                        {active && error && <div className="auth-error">{error}</div>}

                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={reg.fullName}
                                onChange={e => setReg({ ...reg, fullName: e.target.value })}
                                required
                            />
                            <i className="bx bxs-user"></i>
                        </div>

                        <div className="input-box">
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={reg.email}
                                onChange={e => setReg({ ...reg, email: e.target.value })}
                                required
                            />
                            <i className="bx bxs-envelope"></i>
                        </div>

                        {/* Department + Semester row */}
                        <div className="input-row">
                            <div className="input-box">
                                <select
                                    value={reg.department}
                                    onChange={e => setReg({ ...reg, department: e.target.value })}
                                    required
                                    style={{ color: reg.department ? '#1e293b' : '#94a3b8' }}
                                >
                                    <option value="">Department</option>
                                    {DEPARTMENTS.map(d => (
                                        <option key={d.val} value={d.val}>{d.label}</option>
                                    ))}
                                </select>
                                <i className="bx bxs-building-house"></i>
                            </div>
                            <div className="input-box">
                                <select
                                    value={reg.currentSemester}
                                    onChange={e => setReg({ ...reg, currentSemester: e.target.value })}
                                    required
                                    style={{ color: reg.currentSemester ? '#1e293b' : '#94a3b8' }}
                                >
                                    <option value="">Semester</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                        <option key={n} value={n}>Semester {n}</option>
                                    ))}
                                </select>
                                <i className="bx bxs-book-open"></i>
                            </div>
                        </div>

                        <div className="input-box">
                            <input
                                type="password"
                                placeholder="Password"
                                value={reg.password}
                                onChange={e => setReg({ ...reg, password: e.target.value })}
                                required
                                minLength={8}
                            />
                            <i className="bx bxs-lock-alt"></i>
                        </div>

                        <div className="input-box">
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={reg.confirmPassword}
                                onChange={e => setReg({ ...reg, confirmPassword: e.target.value })}
                                required
                            />
                            <i className="bx bxs-lock"></i>
                        </div>

                        <button type="submit" className="btn" disabled={loading}>
                            {loading && active ? 'Creating account...' : 'Register'}
                        </button>


                    </form>
                </div>

                {/* ── SLIDING TOGGLE PANEL ───────────────────────── */}
                <div className="toggle-box">
                    {/* Left panel — visible when on login */}
                    <div className="toggle-panel toggle-left">
                        <div className="panel-icon">✦</div>
                        <h1>Hello, Welcome!</h1>
                        <p>Don't have an account?</p>
                        <button className="btn" onClick={goRegister}>Register</button>
                    </div>

                    {/* Right panel — visible when on register */}
                    <div className="toggle-panel toggle-right">
                        <div className="panel-icon">◈</div>
                        <h1>Welcome Back!</h1>
                        <p>Already have an account?</p>
                        <button className="btn" onClick={goLogin}>Login</button>
                    </div>
                </div>

            </div>
        </div>
    );
}