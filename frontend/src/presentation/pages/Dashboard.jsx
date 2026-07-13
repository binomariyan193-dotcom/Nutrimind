import React, { useState, useEffect } from 'react';
import { useAuth } from '../../application/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, User, Activity, Droplets, Flame, Scale, TrendingUp,
  Award, Utensils, Sparkles, Bell, ChevronRight, BarChart2, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, Legend
} from 'recharts';
import { analyticsApi } from '../../infrastructure/services/api/analytics';
import { getMealHistory } from '../../infrastructure/services/api/meals';
import { notificationsApi } from '../../infrastructure/services/api/notifications';

/* ─── Custom Recharts Tooltip ──────────────────────────── */
const DarkTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1a2340',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '10px 14px',
        fontSize: 12,
        color: '#e8edf5',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
      }}>
        <p style={{ color: '#8892a4', marginBottom: 6 }}>{label}</p>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
            <span style={{ color: '#8892a4' }}>{p.name}:</span>
            <span style={{ fontWeight: 600 }}>{typeof p.value === 'number' ? Math.round(p.value) : p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/* ─── Stat Card ────────────────────────────────────────── */
const StatCard = ({ label, value, sub, icon: Icon, iconColor, iconBg, accent, progress, progressColor }) => (
  <div className="card card-glow p-5 relative overflow-hidden group">
    {/* Decorative orb */}
    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 transition-transform duration-500 group-hover:scale-125"
      style={{ background: iconBg }} />

    <div className="relative flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>{label}</p>
        <p className="text-3xl font-bold" style={{ color: '#e8edf5' }}>{value}</p>
        {sub && <p className="text-xs mt-1" style={{ color: accent || '#8892a4' }}>{sub}</p>}
        {progress !== undefined && (
          <div className="progress-bar mt-3">
            <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: progressColor || '#00f590' }} />
          </div>
        )}
      </div>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center ml-4 flex-shrink-0"
        style={{ background: iconBg, color: iconColor }}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

/* ─── Main Dashboard ───────────────────────────────────── */
const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('weekly');

  const [dailyData, setDailyData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [recentMeals, setRecentMeals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [daily, trends, mealsHistory, notifs] = await Promise.all([
        analyticsApi.getDailyAnalytics(),
        analyticsApi.getTrendAnalytics(activeTab),
        getMealHistory({ limit: 3 }),
        notificationsApi.getNotifications()
      ]);
      setDailyData(daily);
      setTrendData(trends.data);
      setRecentMeals(mealsHistory.meals);
      setNotifications(notifs.notifications);
      setUnreadCount(notifs.unread_count);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); }
    catch (error) { console.error('Failed to log out', error); }
  };

  const handleReadNotification = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1e' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <p style={{ color: '#4e5a6e', fontSize: 14 }}>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  /* ── Metrics ── */
  const currentBMI = dailyData?.bmi || 0;
  const bmiStatus = currentBMI >= 18.5 && currentBMI <= 24.9 ? 'Healthy' : 'Needs Attention';
  const dailyCalories = dailyData?.calories?.current || 0;
  const targetCalories = dailyData?.calories?.goal || 2000;
  const healthScore = dailyData?.health_score || 0;
  const waterIntake = 2.1;
  const waterGoal = 3.0;

  /* ── Chart tick style ── */
  const tickStyle = { fill: '#4e5a6e', fontSize: 11 };
  const gridColor = 'rgba(255,255,255,0.04)';

  return (
    <div className="min-h-screen" style={{ background: '#0a0f1e' }}>

      {/* ── Navigation ─────────────────────────────────── */}
      <nav style={{
        background: 'rgba(15,22,41,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #00f590, #00d4b4)', boxShadow: '0 0 16px rgba(0,245,144,0.3)' }}>
                <Activity size={20} color="#0a0f1e" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold text-gradient">NutriMind AI</span>
            </div>

            {/* Nav links */}
            <div className="flex items-center gap-1">
              <button id="nav-history" onClick={() => navigate('/history')} className="nav-link">History</button>
              <button id="nav-planner" onClick={() => navigate('/planner')} className="nav-link">Planner</button>
              <button id="nav-health-profile" onClick={() => navigate('/health-profile')} className="nav-link">Profile</button>
              <button id="nav-admin" onClick={() => navigate('/admin')} className="nav-link"
                style={{ color: '#f87171' }}>Admin</button>

              {/* Notification Bell */}
              <div className="relative ml-1">
                <button id="nav-notifications"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="btn-ghost relative"
                  style={{ padding: '0.5rem' }}>
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
                      style={{ background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }} />
                  )}
                </button>

                {showNotifications && (
                  <div className="animate-fade-in absolute right-0 mt-2 w-80 rounded-2xl py-2 z-50"
                    style={{ background: '#141b2d', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
                    <div className="px-4 pb-2 flex justify-between items-center"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 className="font-semibold text-sm" style={{ color: '#e8edf5' }}>Notifications</h4>
                      <span className="badge badge-green">{unreadCount} new</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-center" style={{ color: '#4e5a6e' }}>No notifications yet.</p>
                      ) : notifications.map((notif) => (
                        <div key={notif.id}
                          onClick={() => !notif.is_read && handleReadNotification(notif.id)}
                          className="px-4 py-3 cursor-pointer transition-colors"
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            background: !notif.is_read ? 'rgba(0,245,144,0.04)' : 'transparent'
                          }}>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                              style={{
                                background: notif.notification_type === 'ALERT' ? '#f59e0b'
                                  : notif.notification_type === 'ACHIEVEMENT' ? '#a78bfa' : '#60a5fa'
                              }} />
                            <div>
                              <p className="text-sm" style={{ color: !notif.is_read ? '#e8edf5' : '#8892a4', fontWeight: !notif.is_read ? 600 : 400 }}>
                                {notif.message}
                              </p>
                              <span className="text-xs" style={{ color: '#4e5a6e' }}>
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User */}
              <div className="flex items-center gap-2 ml-2 pl-3" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(0,245,144,0.12)', color: '#00f590' }}>
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm hidden sm:block" style={{ color: '#8892a4', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </span>
                <button id="nav-logout" onClick={handleLogout} className="btn-ghost"
                  style={{ padding: '0.4rem', color: '#4e5a6e' }}
                  title="Logout">
                  <LogOut size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#e8edf5' }}>Overview</h1>
            <p className="mt-1 text-sm" style={{ color: '#8892a4' }}>Here's your daily nutrition and health summary.</p>
          </div>
          <div className="flex items-center gap-2">
            <button id="btn-log-meal" onClick={() => navigate('/log-meal')} className="btn-secondary text-sm py-2 px-4">
              <Utensils size={15} /> Log Meal
            </button>
            <button id="btn-plan-meals" onClick={() => navigate('/planner')} className="btn-secondary text-sm py-2 px-4">
              <Calendar size={15} /> Plan Meals
            </button>
            <button id="btn-ask-ai" onClick={() => navigate('/ask-ai')} className="btn-primary text-sm py-2 px-4">
              <Sparkles size={15} /> Ask AI
            </button>
          </div>
        </div>

        {/* ── Stat Cards ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Current BMI"
            value={currentBMI}
            sub={<span className={`badge ${bmiStatus === 'Healthy' ? 'badge-green' : 'badge-amber'}`}>{bmiStatus}</span>}
            icon={Scale}
            iconColor="#60a5fa"
            iconBg="rgba(59,130,246,0.15)"
          />
          <StatCard
            label="Daily Calories"
            value={`${Math.round(dailyCalories)}`}
            sub={`/ ${Math.round(targetCalories)} kcal goal`}
            icon={Flame}
            iconColor="#fb923c"
            iconBg="rgba(251,146,60,0.15)"
            progress={(dailyCalories / targetCalories) * 100}
            progressColor="linear-gradient(90deg, #fb923c, #ef4444)"
          />
          <StatCard
            label="Water Intake"
            value={`${waterIntake}L`}
            sub={`/ ${waterGoal}L goal`}
            icon={Droplets}
            iconColor="#22d3ee"
            iconBg="rgba(34,211,238,0.15)"
            progress={(waterIntake / waterGoal) * 100}
            progressColor="linear-gradient(90deg, #22d3ee, #60a5fa)"
          />
          <StatCard
            label="Health Score"
            value={healthScore}
            sub={<span className="flex items-center gap-1" style={{ color: '#a78bfa' }}><TrendingUp size={12} /> +2.5% this week</span>}
            icon={Award}
            iconColor="#a78bfa"
            iconBg="rgba(167,139,250,0.15)"
          />
        </div>

        {/* ── Analytics ───────────────────────────────── */}
        <div className="mt-8 flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: '#e8edf5' }}>Analytics</h2>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {['weekly', 'monthly'].map(tab => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all"
                style={{
                  background: activeTab === tab ? 'rgba(0,245,144,0.12)' : 'transparent',
                  color: activeTab === tab ? '#00f590' : '#8892a4',
                  border: activeTab === tab ? '1px solid rgba(0,245,144,0.2)' : '1px solid transparent'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Caloric & Nutrition Trends */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold" style={{ color: '#e8edf5' }}>Caloric & Nutrition Trends</h3>
              <span className="badge badge-green"><BarChart2 size={11} /> Live</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    {[
                      { id: 'protein', color: '#60a5fa' },
                      { id: 'carbs', color: '#fbbf24' },
                      { id: 'fat', color: '#f87171' },
                    ].map(({ id, color }) => (
                      <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={tickStyle} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={tickStyle} />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: '#8892a4', paddingTop: 12 }}
                  />
                  <Area type="monotone" dataKey="protein_g" name="Protein (g)" stroke="#60a5fa" fill="url(#grad-protein)" strokeWidth={2} />
                  <Area type="monotone" dataKey="carbs_g" name="Carbs (g)" stroke="#fbbf24" fill="url(#grad-carbs)" strokeWidth={2} />
                  <Area type="monotone" dataKey="fat_g" name="Fat (g)" stroke="#f87171" fill="url(#grad-fat)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right column charts */}
          <div className="space-y-5">

            {/* Meal Score Trend */}
            <div className="card p-5">
              <h3 className="font-semibold text-sm mb-4" style={{ color: '#e8edf5' }}>Meal Score Trend</h3>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ ...tickStyle, fontSize: 10 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ ...tickStyle, fontSize: 10 }} domain={[0, 10]} />
                    <Tooltip content={<DarkTooltip />} />
                    <Line type="monotone" dataKey="avg_score" name="Score" stroke="#a78bfa" strokeWidth={2.5}
                      dot={{ fill: '#a78bfa', strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, strokeWidth: 0, fill: '#a78bfa' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Total Calories */}
            <div className="card p-5">
              <h3 className="font-semibold text-sm mb-4" style={{ color: '#e8edf5' }}>Total Calories</h3>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ ...tickStyle, fontSize: 10 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ ...tickStyle, fontSize: 10 }} />
                    <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="calories" name="Consumed" fill="#00f590" radius={[4, 4, 0, 0]} opacity={0.85} />
                    <Bar dataKey="target_calories" name="Target" fill="rgba(255,255,255,0.08)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>

        {/* ── Recent Meals ─────────────────────────────── */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ color: '#e8edf5' }}>Recent Meals</h2>
            <button id="btn-view-all-meals" onClick={() => navigate('/history')} className="btn-ghost text-sm"
              style={{ color: '#00f590' }}>
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentMeals.map((meal) => (
              <div key={meal.id} className="card card-glow flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => navigate('/history')}>
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {meal.image_url ? (
                    <img src={meal.image_url} alt="Meal" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: '#4e5a6e' }}>
                      <Utensils size={22} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="badge badge-green mb-1 inline-block">{meal.meal_type}</span>
                  <h4 className="font-semibold text-sm truncate" style={{ color: '#e8edf5' }}>
                    {meal.detected_foods?.length > 0 ? meal.detected_foods[0].food_name : 'Meal'}
                  </h4>
                  <p className="flex items-center gap-1 text-xs mt-1" style={{ color: '#8892a4' }}>
                    <Flame size={11} style={{ color: '#fb923c' }} />
                    {Math.round(meal.nutrition?.calories || 0)} kcal
                  </p>
                </div>
                <div className="text-xs flex-shrink-0" style={{ color: '#4e5a6e' }}>
                  {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {recentMeals.length === 0 && (
              <div className="col-span-3 card p-10 text-center">
                <Utensils size={32} className="mx-auto mb-3" style={{ color: '#2d3748' }} />
                <p style={{ color: '#8892a4' }}>No meals logged yet.</p>
                <button id="btn-log-first-meal" onClick={() => navigate('/log-meal')} className="btn-primary text-sm mt-4 mx-auto" style={{ width: 'fit-content' }}>
                  Log your first meal
                </button>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
