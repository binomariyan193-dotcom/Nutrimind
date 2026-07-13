import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera as CameraIcon, UploadCloud, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import CameraCapture from '../components/CameraCapture';
import { uploadMealImage } from '../../infrastructure/services/api/meals';

const LogMeal = () => {
  const navigate = useNavigate();
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCapture = async (file, previewUrl) => {
    setShowCamera(false);
    setUploading(true);
    setError(null);
    try {
      const res = await uploadMealImage(file);
      setResult({
        mealId: res.meal_id,
        imageUrl: res.image_url,
        previewUrl,
        nutrition: res.nutrition_analysis?.total_nutrients,
        items: res.nutrition_analysis?.items,
        healthScore: res.health_score,
        features: res.features
      });
    } catch (err) {
      console.error(err);
      setError(err.detail || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setShowCamera(true);
  };

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: '#0a0f1e' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            id="btn-back-dashboard"
            onClick={() => navigate('/dashboard')}
            className="btn-secondary p-2.5"
            style={{ borderRadius: 14 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#e8edf5' }}>Log Meal</h1>
            <p className="text-sm mt-0.5" style={{ color: '#8892a4' }}>Snap a photo and let AI analyze it</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Main Card */}
        <div className="card" style={{ minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem' }}>

          {showCamera ? (
            <div className="w-full">
              <CameraCapture onCapture={handleCapture} onCancel={() => setShowCamera(false)} />
            </div>

          ) : uploading ? (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(0,245,144,0.1)', border: '1px solid rgba(0,245,144,0.2)' }}>
                <UploadCloud size={36} style={{ color: '#00f590', animation: 'bounce 1s infinite' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#e8edf5' }}>Uploading & Analyzing…</h3>
              <p className="text-sm max-w-sm mx-auto" style={{ color: '#8892a4' }}>
                Securely uploading your image and preparing AI analysis.
              </p>
              <div className="mt-6 flex justify-center">
                <div className="spinner" />
              </div>
            </div>

          ) : result ? (
            <div className="text-center w-full max-w-3xl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(0,245,144,0.1)', border: '1px solid rgba(0,245,144,0.25)' }}>
                <CheckCircle size={30} style={{ color: '#00f590' }} />
              </div>
              <h3 className="text-2xl font-bold mb-6" style={{ color: '#e8edf5' }}>Analysis Complete!</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl overflow-hidden"
                    style={{ border: '2px solid rgba(255,255,255,0.06)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                    <img src={result.previewUrl} alt="Meal Preview" className="w-full h-auto max-h-60 object-cover" />
                  </div>
                  
                  {result.healthScore && (
                    <div className="p-4 rounded-xl text-left" style={{ background: 'rgba(0,245,144,0.05)', border: '1px solid rgba(0,245,144,0.2)' }}>
                      <h4 className="font-semibold text-lg mb-2" style={{ color: '#00f590' }}>Health Score: {result.healthScore.score}/10</h4>
                      <ul className="text-sm list-disc pl-4" style={{ color: '#e8edf5' }}>
                        {result.healthScore.feedback.map((f, i) => (
                          <li key={i} className="mb-1">{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="text-left flex flex-col gap-4">
                  {result.nutrition && (
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 className="font-semibold mb-3 text-lg" style={{ color: '#e8edf5' }}>Nutritional Breakdown</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded-lg flex flex-col justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <span style={{ color: '#8892a4' }}>Calories</span>
                          <span className="font-bold text-xl text-white">{Math.round(result.nutrition.calories)}</span>
                        </div>
                        <div className="p-3 rounded-lg flex flex-col justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                          <span style={{ color: '#8892a4' }}>Protein</span>
                          <span className="font-bold text-xl text-blue-400">{Math.round(result.nutrition.protein_g)}g</span>
                        </div>
                        <div className="p-3 rounded-lg flex flex-col justify-center" style={{ background: 'rgba(234,179,8,0.1)' }}>
                          <span style={{ color: '#8892a4' }}>Carbs</span>
                          <span className="font-bold text-xl text-yellow-400">{Math.round(result.nutrition.carbs_g)}g</span>
                        </div>
                        <div className="p-3 rounded-lg flex flex-col justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                          <span style={{ color: '#8892a4' }}>Fat</span>
                          <span className="font-bold text-xl text-red-400">{Math.round(result.nutrition.fat_g)}g</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.items && result.items.length > 0 && (
                    <div className="p-4 rounded-xl flex-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 className="font-semibold mb-3 text-lg" style={{ color: '#e8edf5' }}>Detected Items</h4>
                      <ul className="text-sm flex flex-col gap-2">
                        {result.items.map((item, i) => (
                          <li key={i} className="flex justify-between items-center" style={{ color: '#cbd5e1' }}>
                            <span className="truncate pr-2">{item.original_name}</span>
                            <span className="whitespace-nowrap font-mono" style={{ color: '#8892a4' }}>{Math.round(item.weight_grams)}g</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button id="btn-back-to-dash" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1 py-3">
                  Back to Dashboard
                </button>
                <button id="btn-log-another" onClick={reset} className="btn-primary flex-1 py-3">
                  Log Another Meal
                </button>
              </div>
            </div>

          ) : (
            <div className="text-center max-w-sm">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8"
                style={{
                  background: 'linear-gradient(135deg, #00f590, #00d4b4)',
                  boxShadow: '0 0 40px rgba(0,245,144,0.3)'
                }}>
                <CameraIcon size={44} color="#0a0f1e" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: '#e8edf5' }}>Ready to log?</h2>
              <p className="text-sm mb-8" style={{ color: '#8892a4', lineHeight: 1.7 }}>
                Take a clear photo of your meal. AI will automatically detect food items, estimate portions, and calculate nutritional values.
              </p>
              <button
                id="btn-open-camera"
                onClick={() => setShowCamera(true)}
                className="btn-primary w-full text-base py-3.5"
              >
                <CameraIcon size={20} /> Open Camera
              </button>
              
              <label
                htmlFor="file-upload"
                className="btn-secondary w-full text-base py-3.5 mt-3"
              >
                <UploadCloud size={20} /> Upload from Gallery
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const previewUrl = URL.createObjectURL(file);
                      handleCapture(file, previewUrl);
                    }
                  }}
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogMeal;
