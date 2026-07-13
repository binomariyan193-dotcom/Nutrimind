import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Activity, Utensils, Zap, Database, ArrowLeft } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { adminApi } from '../../infrastructure/services/api/admin';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const data = await adminApi.getSystemStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load admin statistics. Please ensure you have access.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md">
          <Shield className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-medium">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Navbar */}
      <nav className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="bg-emerald-500 p-2 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">NutriMind <span className="font-normal text-emerald-400">Admin</span></span>
          </div>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit Admin
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">System Overview</h1>
          <p className="text-slate-500 mt-1">Global platform metrics and analytics</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl">
                <Users size={24} />
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Users</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.total_users}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-50 text-emerald-500 p-3 rounded-2xl">
                <Activity size={24} />
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Daily Active (24h)</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.daily_active_users}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-50 text-amber-500 p-3 rounded-2xl">
                <Utensils size={24} />
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Meals Uploaded</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.meals_uploaded}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-rose-50 text-rose-500 p-3 rounded-2xl">
                <Database size={24} />
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Calories Processed</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.calories_processed.toLocaleString()}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 text-purple-500 p-3 rounded-2xl">
                <Zap size={24} />
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">AI Requests</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.ai_requests}</h3>
            </div>
          </div>

        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Platform Usage Trend</h2>
            <p className="text-slate-500 text-sm">Meals uploaded over the last 7 days</p>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trend_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="meals" 
                  name="Meals Uploaded"
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorUsage)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;
