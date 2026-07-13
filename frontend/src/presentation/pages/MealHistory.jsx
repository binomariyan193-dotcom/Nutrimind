import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Flame, ArrowLeft, Utensils, SlidersHorizontal } from 'lucide-react';
import { getMealHistory } from '../../infrastructure/services/api/meals';

const MealHistory = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  useEffect(() => { fetchHistory(); }, [filters]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getMealHistory(filters);
      setMeals(data.meals);
    } catch (err) {
      setError(err.detail || 'Failed to load meal history.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const clearFilters = () => setFilters({ startDate: '', endDate: '' });

  const inputStyle = {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#e8edf5',
    fontSize: 13
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0a0f1e' }}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div>
            <button id="btn-back" onClick={() => navigate('/dashboard')} className="btn-ghost text-sm mb-2 px-0">
              <ArrowLeft size={15} /> Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold" style={{ color: '#e8edf5' }}>Meal History</h1>
            <p className="text-sm mt-0.5" style={{ color: '#8892a4' }}>Review your past meals and nutritional data.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Calendar size={15} style={{ color: '#4e5a6e' }} />
              <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} style={inputStyle} />
              <span style={{ color: '#4e5a6e', fontSize: 12 }}>→</span>
              <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} style={inputStyle} />
            </div>
            {(filters.startDate || filters.endDate) && (
              <button onClick={clearFilters} className="badge badge-red cursor-pointer">Clear</button>
            )}
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="spinner" />
          </div>
        ) : meals.length === 0 ? (
          <div className="card p-16 text-center">
            <Utensils size={40} className="mx-auto mb-4" style={{ color: '#2d3748' }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: '#8892a4' }}>No meals found</h3>
            <p className="text-sm mb-6" style={{ color: '#4e5a6e' }}>Try adjusting your filters or log a new meal.</p>
            <button id="btn-log-meal" onClick={() => navigate('/log-meal')} className="btn-primary mx-auto" style={{ width: 'fit-content' }}>
              Log a Meal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {meals.map((meal) => (
              <div key={meal.id} className="card card-glow overflow-hidden group flex flex-col">
                {/* Image */}
                <div className="relative h-44 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {meal.image_url ? (
                    <img src={meal.image_url} alt="Meal"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: '#2d3748' }}>
                      <Utensils size={36} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(10,15,30,0.75)', color: '#8892a4', backdropFilter: 'blur(8px)' }}>
                    {new Date(meal.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <span className="badge badge-green mb-2 inline-block w-fit">{meal.meal_type || 'Meal'}</span>
                  <h3 className="font-semibold text-sm mb-3 leading-snug" style={{ color: '#e8edf5' }}>
                    {meal.detected_foods?.length > 0
                      ? meal.detected_foods.map(f => f.food_name).join(', ')
                      : 'Uncategorized Meal'}
                  </h3>

                  {meal.nutrition && (
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <div className="flex items-center justify-between p-2.5 rounded-xl"
                        style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.12)' }}>
                        <span className="text-xs" style={{ color: '#fb923c' }}>Calories</span>
                        <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#fdba74' }}>
                          <Flame size={11} /> {Math.round(meal.nutrition.calories)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl"
                        style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.12)' }}>
                        <span className="text-xs" style={{ color: '#60a5fa' }}>Protein</span>
                        <span className="text-xs font-bold" style={{ color: '#93c5fd' }}>
                          {Math.round(meal.nutrition.protein_g)}g
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MealHistory;
