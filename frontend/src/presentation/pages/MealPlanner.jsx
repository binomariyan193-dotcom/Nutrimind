import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Flame, Utensils, Sparkles, Plus, Check, ShoppingCart } from 'lucide-react';
import { plannerApi } from '../../infrastructure/services/api/planner';

const MealPlanner = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState(1);
  const [checkedItems, setCheckedItems] = useState({});

  const toggleCheck = (category, item) => {
    const key = `${category}-${item}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const generatePlan = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await plannerApi.generateWeeklyPlan();
      setPlan(data);
      setActiveDay(1);
      setCheckedItems({});
    } catch (err) {
      setError(err.detail || 'Failed to generate meal plan.');
    } finally {
      setLoading(false);
    }
  };

  const MealCard = ({ meal, type }) => (
    <div className="card card-glow p-5 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <span className="badge badge-green mb-1 inline-block">{type}</span>
          <h3 className="font-bold text-base mt-1" style={{ color: '#e8edf5' }}>{meal.name}</h3>
        </div>
        <button className="w-8 h-8 rounded-xl flex items-center justify-center btn-ghost p-0">
          <Plus size={16} />
        </button>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: '#8892a4' }}>{meal.description}</p>
      <div className="flex items-center gap-2 mt-auto">
        <span className="badge badge-amber"><Flame size={11} /> {meal.est_calories} kcal</span>
        <span className="badge badge-blue"><Utensils size={11} /> {meal.protein_g}g protein</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0a0f1e' }}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div>
            <button id="btn-back" onClick={() => navigate('/dashboard')} className="btn-ghost text-sm mb-2 px-0">
              <ArrowLeft size={15} /> Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#e8edf5' }}>
              AI Meal Planner <Sparkles size={20} style={{ color: '#00f590' }} />
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#8892a4' }}>Generate a personalized 7-day plan based on your profile.</p>
          </div>
          <button
            id="btn-generate-plan"
            onClick={generatePlan}
            disabled={loading}
            className="btn-primary whitespace-nowrap"
          >
            {loading ? (
              <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Generating (~10s)…</>
            ) : (
              <><Calendar size={16} /> Generate New Plan</>
            )}
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!plan && !loading && !error && (
          <div className="card p-16 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(0,245,144,0.08)', border: '1px solid rgba(0,245,144,0.15)' }}>
              <Calendar size={36} style={{ color: '#00f590' }} />
            </div>
            <h3 className="text-xl font-bold mb-3" style={{ color: '#e8edf5' }}>No active plan</h3>
            <p className="text-sm max-w-md mx-auto" style={{ color: '#8892a4', lineHeight: 1.7 }}>
              Click Generate to let AI build a custom 7-day meal plan tailored to your caloric needs and medical profile.
            </p>
          </div>
        )}

        {/* Plan Display */}
        {plan && !loading && (
          <div className="space-y-5 animate-fade-in">
            {/* Stats row */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#e8edf5' }}>{plan.plan_title}</h2>
              <span className="badge badge-green text-sm px-3 py-1">
                🎯 {plan.weekly_target_calories} kcal / day
              </span>
            </div>

            {/* Day tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {plan.days.map((dayObj) => (
                <button
                  key={dayObj.day}
                  id={`tab-day-${dayObj.day}`}
                  onClick={() => setActiveDay(dayObj.day)}
                  className="px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all flex-shrink-0"
                  style={{
                    background: activeDay === dayObj.day ? 'rgba(0,245,144,0.12)' : 'rgba(255,255,255,0.04)',
                    color: activeDay === dayObj.day ? '#00f590' : '#8892a4',
                    border: activeDay === dayObj.day ? '1px solid rgba(0,245,144,0.2)' : '1px solid rgba(255,255,255,0.06)'
                  }}>
                  Day {dayObj.day}
                </button>
              ))}
              <button
                id="tab-groceries"
                onClick={() => setActiveDay('groceries')}
                className="px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0"
                style={{
                  background: activeDay === 'groceries' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)',
                  color: activeDay === 'groceries' ? '#a78bfa' : '#8892a4',
                  border: activeDay === 'groceries' ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(255,255,255,0.06)'
                }}>
                <ShoppingCart size={14} /> Shopping List
              </button>
            </div>

            {/* Meals grid */}
            {activeDay !== 'groceries' && plan.days.filter(d => d.day === activeDay).map((dayData) => (
              <div key={dayData.day} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MealCard meal={dayData.breakfast} type="Breakfast" />
                  <MealCard meal={dayData.lunch} type="Lunch" />
                  <MealCard meal={dayData.dinner} type="Dinner" />
                </div>
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: '#e8edf5' }}>Snacks & Extras</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dayData.snacks.map((snack, idx) => (
                      <MealCard key={idx} meal={snack} type="Snack" />
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Grocery list */}
            {activeDay === 'groceries' && plan.grocery_list && (
              <div className="card p-6 md:p-8 animate-fade-in">
                <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)' }}>
                    <Check size={18} style={{ color: '#a78bfa' }} />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: '#e8edf5' }}>Weekly Shopping Checklist</h3>
                    <p className="text-sm" style={{ color: '#8892a4' }}>Ingredients from your 7-day plan</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {plan.grocery_list.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <h4 className="font-semibold text-sm mb-3 px-2 py-1 rounded-lg inline-block"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#c4ccd8' }}>
                        {category.category}
                      </h4>
                      <div className="space-y-1">
                        {category.items.map((item, idx) => {
                          const key = `${category.category}-${item}`;
                          const isChecked = checkedItems[key] || false;
                          return (
                            <label key={idx}
                              className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
                              style={{ background: isChecked ? 'rgba(0,245,144,0.04)' : 'transparent' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleCheck(category.category, item)}
                                style={{ accentColor: '#00f590', width: 16, height: 16, cursor: 'pointer' }}
                              />
                              <span className="text-sm" style={{
                                color: isChecked ? '#4e5a6e' : '#c4ccd8',
                                textDecoration: isChecked ? 'line-through' : 'none',
                                fontWeight: isChecked ? 400 : 500
                              }}>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanner;
