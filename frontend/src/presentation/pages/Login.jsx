import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../application/context/AuthContext';
import { Activity, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0a0f1e' }}>
      
      {/* Decorative background orbs */}
      <div className="orb w-96 h-96 opacity-20" style={{ background: '#00f590', top: '-10%', left: '-10%' }} />
      <div className="orb w-80 h-80 opacity-10" style={{ background: '#00d4b4', bottom: '-10%', right: '-5%' }} />
      <div className="orb w-64 h-64 opacity-10" style={{ background: '#6366f1', top: '30%', right: '10%' }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 w-full max-w-md px-4 py-8 animate-slide-up">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, #00f590, #00d4b4)',
              boxShadow: '0 0 30px rgba(0,245,144,0.35)'
            }}>
            <Activity size={30} color="#0a0f1e" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold text-gradient">NutriMind AI</span>
          <span className="text-sm mt-1" style={{ color: '#4e5a6e' }}>Your intelligent nutrition companion</span>
        </div>

        {/* Card */}
        <div className="glass p-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#e8edf5' }}>Welcome back</h1>
          <p className="text-sm mb-7" style={{ color: '#8892a4' }}>Sign in to continue your nutrition journey</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: '#4e5a6e' }}>
                <Mail size={18} />
              </div>
              <input
                id="login-email"
                type="email"
                required
                className="input-field"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: '#4e5a6e' }}>
                <Lock size={18} />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="input-field pr-12"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                style={{ color: '#4e5a6e' }}
                onMouseEnter={e => e.currentTarget.style.color = '#8892a4'}
                onMouseLeave={e => e.currentTarget.style.color = '#4e5a6e'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer" style={{ color: '#8892a4' }}>
                <input type="checkbox" className="rounded" style={{ accentColor: '#00f590' }} />
                Remember me
              </label>
              <Link to="/forgot-password"
                className="font-medium transition-colors"
                style={{ color: '#00f590' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00d4b4'}
                onMouseLeave={e => e.currentTarget.style.color = '#00f590'}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base mt-2"
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="divider my-6" />

          <p className="text-center text-sm" style={{ color: '#8892a4' }}>
            Don't have an account?{' '}
            <Link to="/signup"
              className="font-semibold transition-colors"
              style={{ color: '#00f590' }}
              onMouseEnter={e => e.currentTarget.style.color = '#00d4b4'}
              onMouseLeave={e => e.currentTarget.style.color = '#00f590'}
            >
              Create one free
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: '#2d3748' }}>
          Protected by industry-standard encryption
        </p>
      </div>
    </div>
  );
};

export default Login;
