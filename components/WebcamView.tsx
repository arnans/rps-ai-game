
import React, { useEffect, useRef, useState } from 'react';
import { Prediction, Move } from '../types';
import { MOVE_EMOJIS } from '../constants';

interface WebcamViewProps {
  model: any;
  onPredictions: (preds: Prediction[]) => void;
  detectedMove: Move;
}

type WebcamState = 'idle' | 'requesting' | 'active' | 'error';

export const WebcamView: React.FC<WebcamViewProps> = ({ model, onPredictions, detectedMove }) => {
  // Isolate the canvas container so React updates don't wipe out the manually appended canvas
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const webcamRef = useRef<any>(null);
  
  // Use a ref for the model so the animation loop always sees the latest prop
  const modelRef = useRef(model);
  
  const [status, setStatus] = useState<WebcamState>('idle');
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<number>(null);

  // Keep modelRef in sync with the prop
  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  const loop = async () => {
    if (webcamRef.current && webcamRef.current.canvas) {
      webcamRef.current.update(); // Update the webcam frame texture
      
      // Access model via ref to avoid stale closures in the recursive loop
      if (modelRef.current) {
        try {
          const prediction = await modelRef.current.predict(webcamRef.current.canvas);
          onPredictions(prediction);
        } catch (e) {
          console.error("Prediction error:", e);
        }
      }
    }
    requestRef.current = window.requestAnimationFrame(loop);
  };

  const startWebcam = async () => {
    setError(null);
    setStatus('requesting');
    
    // Check for library availability
    if (!window.tmImage) {
      setError("Teachable Machine library is still loading. Please refresh.");
      setStatus('error');
      return;
    }

    // Check for browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isInsecure = !window.isSecureContext;
      setError(
        isInsecure 
          ? "Camera access requires a secure (HTTPS) connection."
          : "Webcam API is not supported by this browser."
      );
      setStatus('error');
      return;
    }

    try {
      const flip = true;
      const webcam = new window.tmImage.Webcam(400, 400, flip);
      
      await webcam.setup(); 
      await webcam.play();
      
      // Manually append canvas to the ISOLATED container
      if (canvasContainerRef.current) {
        canvasContainerRef.current.innerHTML = '';
        canvasContainerRef.current.appendChild(webcam.canvas);
        
        // Force style on the canvas element itself
        webcam.canvas.style.width = '100%';
        webcam.canvas.style.height = '100%';
        webcam.canvas.style.objectFit = 'cover';
        webcam.canvas.style.display = 'block';
      }

      webcamRef.current = webcam;
      setStatus('active');
      
      // Start the loop
      requestRef.current = window.requestAnimationFrame(loop);
    } catch (err: any) {
      console.error("Webcam init error:", err);
      let errorMsg = "Could not open your camera.";
      if (err.name === 'NotAllowedError') errorMsg = "Camera access denied. Check browser permission settings.";
      else if (err.name === 'NotFoundError') errorMsg = "No camera found.";
      else if (err.name === 'NotReadableError') errorMsg = "Camera is in use by another app.";
      
      setError(errorMsg);
      setStatus('error');
    }
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) window.cancelAnimationFrame(requestRef.current);
      if (webcamRef.current) {
        try {
          webcamRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Main Container */}
      <div className="relative aspect-square bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700 flex items-center justify-center shadow-inner">
        
        {/* LAYER 1: The Webcam Canvas (Isolated) */}
        {/* React will leave this div alone, allowing the canvas to persist */}
        <div 
          ref={canvasContainerRef} 
          className="absolute inset-0 w-full h-full z-0 bg-black"
        ></div>

        {/* LAYER 2: React Managed Overlays */}
        {/* z-index ensures this sits on top of the canvas */}
        <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
          
          {/* Status Messages / Buttons (pointer-events-auto re-enables clicks) */}
          {status !== 'active' && (
            <div className="pointer-events-auto flex flex-col items-center gap-4 text-center p-6 max-w-xs bg-slate-900/80 backdrop-blur-sm rounded-xl p-4">
              {status === 'requesting' ? (
                <>
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-indigo-300 font-medium animate-pulse">Starting Camera...</p>
                </>
              ) : status === 'error' ? (
                <div className="space-y-4">
                  <div className="text-4xl">⚠️</div>
                  <p className="text-red-400 text-sm font-semibold">{error}</p>
                  <button 
                    onClick={startWebcam}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-4xl opacity-50">📷</div>
                  <p className="text-slate-400 text-sm mb-2">Allow camera access to play.</p>
                  <button 
                    onClick={startWebcam}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
                  >
                    Enable Webcam
                  </button>
                </>
              )}
            </div>
          )}
          
          {/* Active Game Badge Overlay */}
          {status === 'active' && detectedMove !== Move.NONE && (
            <div className="absolute top-4 right-4 bg-indigo-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-black shadow-2xl animate-bounce uppercase border border-indigo-400/50 flex items-center gap-2">
              <span className="text-lg">{MOVE_EMOJIS[detectedMove]}</span>
              <span>{detectedMove === Move.ROCK ? 'Rock' : detectedMove === Move.PAPER ? 'Paper' : 'Scissors'}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Controls */}
      {status === 'active' && (
        <div className="text-center">
          <button 
            onClick={() => {
              if (webcamRef.current) {
                webcamRef.current.stop();
                setStatus('idle');
                if (requestRef.current) window.cancelAnimationFrame(requestRef.current);
                // Clear the canvas container manually to prevent ghost frames
                if (canvasContainerRef.current) canvasContainerRef.current.innerHTML = '';
              }
            }}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center justify-center gap-1 mx-auto group"
          >
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full group-hover:animate-ping"></span>
            Turn Off Webcam
          </button>
        </div>
      )}
    </div>
  );
};
