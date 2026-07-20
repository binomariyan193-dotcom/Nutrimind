import React, { useState, useEffect } from 'react';
import { getHealthProfile, updateHealthProfile } from '../../infrastructure/services/api/profile';
import { User, Activity, Heart, Droplets, Moon, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HealthProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    activity_level: '',
    dietary_preferences: '',
    health_goal: '',
    exercise_frequency: '',
    sleep_hours: '',
    water_intake_liters: '',
    medical_conditions: '',
    food_allergies: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getHealthProfile();
        // Format arrays to comma separated strings for simple text inputs for now
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          dob: data.dob || '',
          gender: data.gender || '',
          height_cm: data.height_cm || '',
          weight_kg: data.weight_kg || '',
          activity_level: data.activity_level || '',
          dietary_preferences: data.dietary_preferences ? data.dietary_preferences.join(', ') : '',
          health_goal: data.health_goal || '',
          exercise_frequency: data.exercise_frequency || '',
          sleep_hours: data.sleep_hours || '',
          water_intake_liters: data.water_intake_liters || '',
          medical_conditions: data.medical_conditions ? data.medical_conditions.join(', ') : '',
          food_allergies: data.food_allergies ? data.food_allergies.join(', ') : '',
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Process form data to match backend schema
      const payload = {
        ...formData,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : null,
        water_intake_liters: formData.water_intake_liters ? parseFloat(formData.water_intake_liters) : null,
        // Convert comma separated strings to arrays
        dietary_preferences: formData.dietary_preferences ? formData.dietary_preferences.split(',').map(i => i.trim()).filter(Boolean) : null,
        medical_conditions: formData.medical_conditions ? formData.medical_conditions.split(',').map(i => i.trim()).filter(Boolean) : null,
        food_allergies: formData.food_allergies ? formData.food_allergies.split(',').map(i => i.trim()).filter(Boolean) : null,
      };

      // Remove empty strings so we don't send invalid data types
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') payload[key] = null;
      });

      await updateHealthProfile(payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      if (err.message === "Network Error") {
        setError("Network Error: Could not reach the API. Please check your connection or backend URL.");
      } else if (err.detail && Array.isArray(err.detail)) {
        // Handle FastAPI/Pydantic validation errors nicely
        const messages = err.detail.map(e => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(' | ');
        setError(`Validation Error: ${messages}`);
      } else {
        setError(err.detail || err.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1e' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8" style={{ background: '#0a0f1e' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#e8edf5' }}>Health Profile</h1>
            <p className="mt-1" style={{ color: '#8892a4' }}>Complete your profile to get personalized nutrition insights.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-ghost text-sm"
          >
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in"
            style={{ background: 'rgba(0,245,144,0.08)', border: '1px solid rgba(0,245,144,0.2)', color: '#00f590' }}>
            <CheckCircle size={16} /> Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
                <User size={20} />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: '#e8edf5' }}>Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>First Name</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="input-field" style={{ paddingLeft: '1rem' }} />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>Last Name</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="input-field" style={{ paddingLeft: '1rem' }} />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>Date of Birth</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="input-field" style={{ paddingLeft: '1rem', colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="input-field" style={{ paddingLeft: '1rem', colorScheme: 'dark' }}>
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>Height (cm)</label>
                <input type="number" step="0.1" name="height_cm" value={formData.height_cm} onChange={handleChange} className="input-field" style={{ paddingLeft: '1rem' }} />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>Weight (kg)</label>
                <input type="number" step="0.1" name="weight_kg" value={formData.weight_kg} onChange={handleChange} className="input-field" style={{ paddingLeft: '1rem' }} />
              </div>
            </div>
          </div>

          {/* Lifestyle & Goals */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(0,245,144,0.1)', border: '1px solid rgba(0,245,144,0.2)', color: '#00f590' }}>
                <Activity size={20} />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: '#e8edf5' }}>Lifestyle & Goals</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>Activity Level</label>
                <select name="activity_level" value={formData.activity_level} onChange={handleChange} className="input-field" style={{ paddingLeft: '1rem', colorScheme: 'dark' }}>
                  <option value="">Select...</option>
                  <option value="sedentary">Sedentary (little to no exercise)</option>
                  <option value="lightly_active">Lightly active (light exercise 1-3 days/week)</option>
                  <option value="moderately_active">Moderately active (moderate exercise 3-5 days/week)</option>
                  <option value="very_active">Very active (hard exercise 6-7 days/week)</option>
                  <option value="super_active">Super active (very hard exercise & physical job)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>Exercise Frequency</label>
                <select name="exercise_frequency" value={formData.exercise_frequency} onChange={handleChange} className="input-field" style={{ paddingLeft: '1rem', colorScheme: 'dark' }}>
                  <option value="">Select...</option>
                  <option value="none">None</option>
                  <option value="1-2_times">1-2 times a week</option>
                  <option value="3-4_times">3-4 times a week</option>
                  <option value="5+_times">5+ times a week</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>Health Goal</label>
                <select name="health_goal" value={formData.health_goal} onChange={handleChange} className="input-field" style={{ paddingLeft: '1rem', colorScheme: 'dark' }}>
                  <option value="">Select...</option>
                  <option value="lose_weight">Lose Weight</option>
                  <option value="maintain_weight">Maintain Weight</option>
                  <option value="gain_muscle">Gain Muscle</option>
                  <option value="improve_health">Improve General Health</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>Dietary Preferences</label>
                <input type="text" name="dietary_preferences" value={formData.dietary_preferences} onChange={handleChange} placeholder="e.g. Vegan, Keto, Paleo (comma separated)" className="input-field" style={{ paddingLeft: '1rem' }} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div className="p-4 rounded-2xl flex items-start gap-4"
                style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.12)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(34,211,238,0.12)', color: '#22d3ee' }}>
                  <Droplets size={20} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>Daily Water Intake (Liters)</label>
                  <input type="number" step="0.1" name="water_intake_liters" value={formData.water_intake_liters} onChange={handleChange} className="input-field" style={{ paddingLeft: '1rem' }} />
                </div>
              </div>
              <div className="p-4 rounded-2xl flex items-start gap-4"
                style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>
                  <Moon size={20} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>Average Sleep (Hours)</label>
                  <input type="number" step="0.5" name="sleep_hours" value={formData.sleep_hours} onChange={handleChange} className="input-field" style={{ paddingLeft: '1rem' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <Heart size={20} />
              </div>
              <h2 className="text-lg font-semibold" style={{ color: '#e8edf5' }}>Medical Information</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>Medical Conditions</label>
                <textarea 
                  name="medical_conditions" 
                  value={formData.medical_conditions} 
                  onChange={handleChange} 
                  placeholder="e.g. Diabetes, Hypertension (comma separated)"
                  className="input-field resize-none h-24"
                  style={{ paddingLeft: '1rem', paddingTop: '0.75rem' }}
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#4e5a6e' }}>Food Allergies & Intolerances</label>
                <textarea 
                  name="food_allergies" 
                  value={formData.food_allergies} 
                  onChange={handleChange} 
                  placeholder="e.g. Peanuts, Gluten, Lactose (comma separated)"
                  className="input-field resize-none h-24"
                  style={{ paddingLeft: '1rem', paddingTop: '0.75rem' }}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              id="btn-save-profile"
              type="submit"
              disabled={saving}
              className="btn-primary text-base"
            >
              {saving ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Saving...</>
              ) : (
                <><Save size={17} /> Save Profile</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealthProfile;
