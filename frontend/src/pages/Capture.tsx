import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { db } from '../lib/db';
import { useAuthStore } from '../store/authStore';

const Capture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const token = useAuthStore(state => state.token);

  // Monitor network status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera", err);
      alert("Could not access camera. Please ensure permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageUrl);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const saveAndUpload = async () => {
    if (!capturedImage) return;

    // Convert base64 to blob
    const res = await fetch(capturedImage);
    const blob = await res.blob();

    if (isOnline) {
      await uploadToServer(blob);
    } else {
      // Save offline to Dexie
      await db.captures.add({
        imageBlob: blob,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      alert('Saved offline. Will sync when connection is restored.');
      setCapturedImage(null);
    }
  };

  const uploadToServer = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('file', blob, `capture_${Date.now()}.jpg`);

    try {
      const response = await fetch('http://localhost:8000/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      if (response.ok) {
        alert('Upload successful!');
        setCapturedImage(null);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error(error);
      // Fallback to offline storage if upload fails
      await db.captures.add({
        imageBlob: blob,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      alert('Upload failed. Saved locally to sync later.');
      setCapturedImage(null);
    }
  };

  const syncOfflineCaptures = async () => {
    if (!isOnline) return;
    setSyncing(true);
    const pending = await db.captures.where('status').equals('pending').toArray();
    
    for (const item of pending) {
      try {
        const formData = new FormData();
        formData.append('file', item.imageBlob, `offline_capture_${item.id}.jpg`);
        
        const response = await fetch('http://localhost:8000/api/documents/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          await db.captures.delete(item.id!);
        }
      } catch (err) {
        console.error(`Failed to sync item ${item.id}`, err);
      }
    }
    setSyncing(false);
    alert('Sync complete!');
  };

  // Clean up on unmount
  React.useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Capture Evidence</h1>
          <p className="text-gray-500 mt-1">Take a clear photo of the weighbridge slip</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
          {isOnline && (
            <button 
              onClick={syncOfflineCaptures}
              disabled={syncing}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-1">
          {!stream && !capturedImage && (
            <div className="h-[60vh] bg-gray-100 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
              <Camera className="w-12 h-12 text-gray-400 mb-4" />
              <button
                onClick={startCamera}
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Start Camera
              </button>
            </div>
          )}

          {stream && !capturedImage && (
            <div className="relative h-[60vh] bg-black rounded-lg overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-white/20 backdrop-blur text-white font-medium rounded-lg hover:bg-white/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-gray-300 hover:scale-105 transition-transform shadow-lg"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-gray-400"></div>
                </button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="relative h-[60vh] bg-black rounded-lg overflow-hidden">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6">
                <button
                  onClick={retake}
                  className="flex-1 py-3 bg-white/90 backdrop-blur text-gray-900 font-medium rounded-lg hover:bg-white transition-colors shadow-sm"
                >
                  Retake
                </button>
                <button
                  onClick={saveAndUpload}
                  className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  {isOnline ? 'Upload Now' : 'Save Offline'}
                </button>
              </div>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default Capture;
