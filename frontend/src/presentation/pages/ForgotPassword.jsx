import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../application/context/AuthContext';
import { Activity, Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Check your inbox for further instructions.');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0a0f1e' }}>
      <div className="orb w-96 h-96 opacity-15" style={{ background: '#00f590', top: '-10%', right: '-10%' }} />
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
        </div>

        <div className="glass p-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#e8edf5' }}>Reset Password</h1>
          <p className="text-sm mb-7" style={{ color: '#8892a4' }}>Enter your email and we'll send you a reset link</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              ⚠ {error}
            </div>
          )}

          {message && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in"
              style={{ background: 'rgba(0,245,144,0.08)', border: '1px solid rgba(0,245,144,0.2)', color: '#00f590' }}>
              <CheckCircle size={16} /> {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ color: '#4e5a6e' }}>
                <Mail size={18} />
              </div>
              <input
                id="forgot-email"
                type="email"
                required
                className="input-field"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              id="forgot-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base"
            >
              {loading ? (
                <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Sending...</>
              ) : (
                <> Send Reset Link <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="divider my-6" />

          <div className="text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: '#8892a4' }}>
              <ArrowLeft size={15} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
