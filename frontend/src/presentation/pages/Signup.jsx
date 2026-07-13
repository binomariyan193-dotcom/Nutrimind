import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../application/context/AuthContext';
import { Activity, Mail, Lock, User, ArrowRight, Eye, EyeOff, Inbox, ArrowLeft } from 'lucide-react';

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signup(email, password, firstName, lastName);
      // If we get here without error, either:
      // 1. Email confirmation required → backend throws 200 HTTPException
      // 2. Auto-confirm enabled → navigate to login
    } catch (err) {
      const msg = err.message || '';
      // Supabase/backend sends this when signup succeeded but email confirm needed
      if (
        msg.toLowerCase().includes('check your email') ||
        msg.toLowerCase().includes('confirmation') ||
        msg.toLowerCase().includes('200')
      ) {
        setEmailSent(true);
      } else {
        setError(msg || 'Failed to create an account');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Email Sent Confirmation Screen ──────────────────────
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0a0f1e' }}>
        <div className="orb w-96 h-96 opacity-20" style={{ background: '#00f590', bottom: '-10%', right: '-10%' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="relative z-10 w-full max-w-md px-4 animate-slide-up text-center">
          {/* Icon */}
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'linear-gradient(135deg, rgba(0,245,144,0.15), rgba(0,212,180,0.15))',
              border: '1px solid rgba(0,245,144,0.25)',
              boxShadow: '0 0 40px rgba(0,245,144,0.15)'
            }}>
            <Inbox size={44} style={{ color: '#00f590' }} />
          </div>

          <h1 className="text-3xl font-bold mb-3" style={{ color: '#e8edf5' }}>Check your inbox</h1>
          <p className="text-base mb-2" style={{ color: '#8892a4', lineHeight: 1.7 }}>
            We sent a confirmation link to
          </p>
          <p className="font-semibold text-lg mb-6 text-gradient">{email}</p>
          <p className="text-sm mb-8" style={{ color: '#4e5a6e', lineHeight: 1.7 }}>
            Click the link in the email to activate your account. <br />
            After confirming, you can sign in below.
          </p>

          <div className="glass p-6 space-y-3">
            <Link
              to="/login"
              id="go-to-login"
              className="btn-primary w-full text-base"
              style={{ display: 'flex' }}
            >
              <Mail size={18} /> Go to Sign In
            </Link>

            <div className="text-xs pt-1" style={{ color: '#4e5a6e' }}>
              Didn't receive it?{' '}
              <button
                onClick={() => { setEmailSent(false); setError(''); }}
                className="font-medium"
                style={{ color: '#8892a4' }}
              >
                Try again
              </button>
              {' '}or check your spam folder.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Signup Form ──────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12" style={{ background: '#0a0f1e' }}>

      <div className="orb w-96 h-96 opacity-20" style={{ background: '#00f590', bottom: '-10%', right: '-10%' }} />
      <div className="orb w-80 h-80 opacity-10" style={{ background: '#6366f1', top: '-5%', left: '-5%' }} />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 w-full max-w-md px-4 animate-slide-up">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #00f590, #00d4b4)', boxShadow: '0 0 30px rgba(0,245,144,0.35)' }}>
            <Activity size={30} color="#0a0f1e" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold text-gradient">NutriMind AI</span>
          <span className="text-sm mt-1" style={{ color: '#4e5a6e' }}>Start your personalized nutrition journey</span>
        </div>

        {/* Card */}
        <div className="glass p-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#e8edf5' }}>Create your account</h1>
          <p className="text-sm mb-7" style={{ color: '#8892a4' }}>Free forever. No credit card required.</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: '#4e5a6e' }}>
                  <User size={16} />
                </div>
                <input
                  id="signup-firstname"
                  type="text"
                  required
                  className="input-field text-sm"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: '#4e5a6e' }}>
                  <User size={16} />
                </div>
                <input
                  id="signup-lastname"
                  type="text"
                  required
                  className="input-field text-sm"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: '#4e5a6e' }}>
                <Mail size={18} />
              </div>
              <input
                id="signup-email"
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
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="input-field pr-12"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                style={{ color: '#4e5a6e' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base mt-2"
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="divider my-6" />

          <p className="text-center text-sm" style={{ color: '#8892a4' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#00f590' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
