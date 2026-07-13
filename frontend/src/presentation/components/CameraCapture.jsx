import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, SwitchCamera } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const CameraCapture = ({ onCapture, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  const startCamera = useCallback(async () => {
    setError('');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions or use the file upload option.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Match canvas dimensions to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64 for preview
    const imageUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageUrl);
    
    // Stop camera stream while previewing
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const acceptPhoto = async () => {
    if (!capturedImage) return;
    setIsCompressing(true);
    
    try {
      // 1. Convert base64 DataURL back to a File object
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const file = new File([blob], `meal_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // 2. Compress the image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      
      // 3. Pass back to parent
      onCapture(compressedFile, capturedImage); // Pass file for upload, URL for preview
    } catch (err) {
      console.error("Compression error:", err);
      setError("Failed to process image.");
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-black/95 rounded-3xl overflow-hidden relative shadow-2xl h-[70vh] max-h-[800px] w-full max-w-md mx-auto border border-slate-800">
      
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
        <button onClick={onCancel} className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition">
          <X size={24} />
        </button>
        {!capturedImage && (
          <button onClick={toggleCamera} className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition">
            <SwitchCamera size={24} />
          </button>
        )}
      </div>

      {error ? (
        <div className="p-6 text-center text-white">
          <div className="text-rose-500 mb-4 flex justify-center"><Camera size={48} /></div>
          <p className="mb-6">{error}</p>
          <label className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium cursor-pointer transition">
            Upload from Gallery
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={async (e) => {
                if(e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const url = URL.createObjectURL(file);
                  onCapture(file, url);
                }
              }} 
            />
          </label>
        </div>
      ) : (
        <>
          {/* Viewfinder / Preview */}
          {!capturedImage ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src={capturedImage} 
              alt="Captured meal" 
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Bottom Controls */}
          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8 px-6 z-10">
            {!capturedImage ? (
              <button 
                onClick={capturePhoto} 
                className="w-20 h-20 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition border-4 border-white/50 group"
              >
                <div className="w-14 h-14 bg-white rounded-full group-hover:scale-95 transition"></div>
              </button>
            ) : (
              <div className="flex justify-between w-full">
                <button 
                  onClick={retakePhoto} 
                  disabled={isCompressing}
                  className="flex flex-col items-center justify-center p-4 bg-black/50 hover:bg-black/70 text-white rounded-2xl backdrop-blur-md transition disabled:opacity-50"
                >
                  <RefreshCw size={24} className="mb-2" />
                  <span className="text-xs font-medium">Retake</span>
                </button>
                <button 
                  onClick={acceptPhoto} 
                  disabled={isCompressing}
                  className="flex flex-col items-center justify-center p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30 transition disabled:opacity-50 min-w-[100px]"
                >
                  {isCompressing ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>
                  ) : (
                    <Check size={24} className="mb-2" />
                  )}
                  <span className="text-xs font-medium">{isCompressing ? 'Processing' : 'Accept'}</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CameraCapture;
