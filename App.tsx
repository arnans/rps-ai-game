
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { GameBoard } from './components/GameBoard';
import { WebcamView } from './components/WebcamView';
import { Move, ClassMapping, Prediction, GameState } from './types';
import { 
  STORAGE_KEY_URL, 
  STORAGE_KEY_MAPPING,
  AUDIO_WIN_URL,
  AUDIO_LOSE_URL,
  MOVE_EMOJIS
} from './constants';

const App: React.FC = () => {
  // --- State ---
  // modelUrl is the text in the input box
  const [modelUrl, setModelUrl] = useState<string>('');
  
  // loadedModelUrl tracks the actual model currently active in the game
  const [loadedModelUrl, setLoadedModelUrl] = useState<string>('');
  
  const [defaultModelData, setDefaultModelData] = useState<{url: string, desc: string} | null>(null);

  const [mappings, setMappings] = useState<ClassMapping>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MAPPING);
    // Defaults are lowercase to encourage case-insensitive matching
    return saved ? JSON.parse(saved) : { rock: 'rock', paper: 'paper', scissors: 'scissors' };
  });
  
  const [model, setModel] = useState<any>(null);
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'loaded' | 'failed'>('idle');
  const [modelLabels, setModelLabels] = useState<string[]>([]);
  
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [detectedMove, setDetectedMove] = useState<Move>(Move.NONE);
  
  // REF: Tracks the latest move synchronously for the async game loop to access
  const detectedMoveRef = useRef<Move>(Move.NONE);
  
  const [gameState, setGameState] = useState<GameState>({
    humanScore: 0,
    robotScore: 0,
    humanMove: Move.NONE,
    robotMove: Move.NONE,
    isCountingDown: false,
    message: 'Ready to play?'
  });

  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const loseAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    winAudioRef.current = new Audio(AUDIO_WIN_URL);
    loseAudioRef.current = new Audio(AUDIO_LOSE_URL);
  }, []);

  // --- Model Loading ---
  const loadModel = async (url: string) => {
    if (!url) return;
    const normalizedUrl = url.endsWith('/') ? url : `${url}/`;
    setModelStatus('loading');
    try {
      // Ensure library is loaded
      if (!window.tmImage) {
        // Simple retry mechanism if script hasn't loaded yet
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!window.tmImage) throw new Error("Teachable Machine library not loaded yet.");
      }
      const loadedModel = await window.tmImage.load(
        `${normalizedUrl}model.json`,
        `${normalizedUrl}metadata.json`
      );
      setModel(loadedModel);
      setModelLabels(loadedModel.getClassLabels());
      setModelStatus('loaded');
      setLoadedModelUrl(normalizedUrl);
      // Note: We do NOT save to localStorage here anymore to support silent default loading
    } catch (error) {
      console.error('Failed to load model:', error);
      setModelStatus('failed');
    }
  };

  // --- Initialization Effect ---
  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Fetch default configuration from static assets
        // This bypasses module resolution issues (@/ vs ./)
        const response = await fetch('./default_model.json');
        if (!response.ok) {
           throw new Error('Could not load default model config');
        }
        const data = await response.json();
        
        // Normalize default URL immediately to match loadModel behavior
        const defUrl = data.model_url.endsWith('/') ? data.model_url : `${data.model_url}/`;
        const defDesc = data.model_description;
        
        setDefaultModelData({ url: defUrl, desc: defDesc });

        // 2. Check for user-saved URL
        const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
        
        if (savedUrl) {
            // If user has a saved model, populate input AND load it
            setModelUrl(savedUrl);
            await loadModel(savedUrl);
        } else {
            // If no saved model, load default BUT keep input empty (modelUrl stays '')
            await loadModel(defUrl);
        }

      } catch (err) {
        console.error("Initialization error:", err);
        // Fallback or just stay idle if config fails
        setModelStatus('idle'); 
      }
    };

    initApp();
  }, []);

  // --- Handle Manual Load ---
  const handleManualLoad = () => {
    if (modelUrl) {
      loadModel(modelUrl);
      // Only save when user explicitly triggers a load
      localStorage.setItem(STORAGE_KEY_URL, modelUrl);
    }
  };

  // --- Move Detection Logic ---
  useEffect(() => {
    if (predictions.length === 0) {
      setDetectedMove(Move.NONE);
      detectedMoveRef.current = Move.NONE;
      return;
    }

    const best = predictions.reduce((prev, current) => 
      (prev.probability > current.probability) ? prev : current
    );

    let newMove = Move.NONE;

    // CONFIDENCE THRESHOLD: 75%
    if (best.probability >= 0.75) {
      const classNameLower = best.className.toLowerCase().trim();
      const mapRock = mappings.rock.toLowerCase().trim();
      const mapPaper = mappings.paper.toLowerCase().trim();
      const mapScissors = mappings.scissors.toLowerCase().trim();

      // STRICT MAPPING
      if (classNameLower === mapRock) {
        newMove = Move.ROCK;
      } else if (classNameLower === mapPaper) {
        newMove = Move.PAPER;
      } else if (classNameLower === mapScissors) {
        newMove = Move.SCISSORS;
      }
    }

    setDetectedMove(newMove);
    detectedMoveRef.current = newMove; // Keep ref in sync for playRound
    
  }, [predictions, mappings]);

  // --- Game Actions ---
  const playRound = async () => {
    if (gameState.isCountingDown) return;

    // Reset loop
    setGameState(prev => ({ 
      ...prev, 
      isCountingDown: true, 
      message: '3', 
      humanMove: Move.NONE, 
      robotMove: Move.NONE 
    }));

    // 3
    await new Promise(r => setTimeout(r, 800));
    setGameState(prev => ({ ...prev, message: '2' }));
    
    // 2
    await new Promise(r => setTimeout(r, 800));
    setGameState(prev => ({ ...prev, message: '1' }));
    
    // 1
    await new Promise(r => setTimeout(r, 800));
    
    const finalHumanMove = detectedMoveRef.current;
    const finalRobotMove = Math.floor(Math.random() * 3) as Move;

    let resultMsg = '';
    let hScoreAdd = 0;
    let rScoreAdd = 0;

    if (finalHumanMove === Move.NONE) {
      resultMsg = "AI couldn't see your hand clearly!";
    } else if (finalHumanMove === finalRobotMove) {
      resultMsg = "It's a Tie!";
    } else {
      const result = (finalHumanMove - finalRobotMove + 3) % 3;
      if (result === 1) {
        resultMsg = "You Win!";
        hScoreAdd = 1;
        winAudioRef.current?.play().catch(() => {});
      } else {
        resultMsg = "Robot Wins!";
        rScoreAdd = 1;
        loseAudioRef.current?.play().catch(() => {});
      }
    }

    setGameState(prev => ({
      ...prev,
      humanMove: finalHumanMove,
      robotMove: finalRobotMove,
      humanScore: prev.humanScore + hScoreAdd,
      robotScore: prev.robotScore + rScoreAdd,
      isCountingDown: false,
      message: resultMsg
    }));
  };

  const resetGame = () => {
    setGameState({
      humanScore: 0,
      robotScore: 0,
      humanMove: Move.NONE,
      robotMove: Move.NONE,
      isCountingDown: false,
      message: 'Game Reset.'
    });
  };

  const saveMappings = (newMappings: ClassMapping) => {
    setMappings(newMappings);
    localStorage.setItem(STORAGE_KEY_MAPPING, JSON.stringify(newMappings));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col gap-6 relative">
      
      {/* LOADING POPUP */}
      {modelStatus === 'loading' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-24 h-24 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl">🤖</div>
          </div>
          <h2 className="mt-8 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tighter animate-pulse">
            GETTING READY...
          </h2>
          <p className="mt-4 text-slate-400 font-medium">Loading AI Model</p>
        </div>
      )}

      <Header 
        modelUrl={modelUrl}
        loadedModelUrl={loadedModelUrl}
        onUrlChange={setModelUrl}
        onLoadModel={handleManualLoad}
        status={modelStatus}
        mappings={mappings}
        onSaveMappings={saveMappings}
        modelLabels={modelLabels}
        defaultModelData={defaultModelData}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GameBoard 
            gameState={gameState} 
            onPlay={playRound} 
            onReset={resetGame} 
            canPlay={modelStatus === 'loaded'}
          />
        </div>
        
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            Webcam & AI Sense
          </h2>
          <WebcamView 
            model={model} 
            onPredictions={setPredictions} 
            detectedMove={detectedMove}
          />
          
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">OUTPUT CONFIDENCE</h3>
            {(() => {
              // Normalize Mappings
              const normRock = mappings.rock.toLowerCase().trim();
              const normPaper = mappings.paper.toLowerCase().trim();
              const normScissors = mappings.scissors.toLowerCase().trim();

              let rockProb = 0;
              let paperProb = 0;
              let scissorsProb = 0;
              let otherProb = 0;

              // Aggregate probabilities based on mappings
              predictions.forEach(p => {
                const name = p.className.toLowerCase().trim();
                if (name === normRock) rockProb += p.probability;
                else if (name === normPaper) paperProb += p.probability;
                else if (name === normScissors) scissorsProb += p.probability;
                else otherProb += p.probability;
              });

              const graphData = [
                { label: 'Rock', prob: rockProb, color: 'bg-amber-400', icon: MOVE_EMOJIS[Move.ROCK] },
                { label: 'Paper', prob: paperProb, color: 'bg-indigo-400', icon: MOVE_EMOJIS[Move.PAPER] },
                { label: 'Scissors', prob: scissorsProb, color: 'bg-pink-400', icon: MOVE_EMOJIS[Move.SCISSORS] },
                { label: 'Other', prob: otherProb, color: 'bg-white', icon: '❔' },
              ];

              return graphData.map((d, i) => {
                const isCrossed = d.prob >= 0.75;
                return (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs items-center">
                      <span className={`flex items-center gap-2 font-bold transition-colors ${isCrossed ? 'text-white' : 'text-slate-400'}`}>
                        <span className="text-base">{d.icon}</span>
                        {d.label}
                        {isCrossed && <span className="text-emerald-400 font-black animate-[pulse_1s_ease-in-out_infinite]">●</span>}
                      </span>
                      <span className={`font-mono transition-colors ${isCrossed ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                        {(d.prob * 100).toFixed(1)}%
                      </span>
                    </div>
                    {/* Track with Threshold Marker */}
                    <div className="w-full bg-slate-700 rounded-full h-2 relative shadow-inner isolate">
                      {/* Threshold Line (75%) */}
                      <div className="absolute left-[75%] top-0 bottom-0 w-0.5 bg-slate-500/50 z-20" title="Threshold: 75%"></div>
                      
                      {/* Bar */}
                      <div 
                        className={`h-full rounded-full transition-all duration-75 ease-out relative z-10 ${d.prob > 0 ? d.color : 'bg-transparent'} ${isCrossed ? 'brightness-110 shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'opacity-80'}`}
                        style={{ width: `${d.prob * 100}%` }}
                      />
                    </div>
                  </div>
                );
              });
            })()}
            
            {predictions.length === 0 && (
              <p className="text-sm text-slate-500 italic">No model loaded or webcam inactive.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
