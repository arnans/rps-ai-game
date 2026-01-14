
import React, { useState } from 'react';
import { ClassMapping } from '../types';

interface HeaderProps {
  modelUrl: string;
  loadedModelUrl: string;
  onUrlChange: (url: string) => void;
  onLoadModel: () => void;
  status: 'idle' | 'loading' | 'loaded' | 'failed';
  mappings: ClassMapping;
  onSaveMappings: (mappings: ClassMapping) => void;
  modelLabels: string[];
  defaultModelData: { url: string; desc: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  modelUrl,
  loadedModelUrl,
  onUrlChange,
  onLoadModel,
  status,
  mappings,
  onSaveMappings,
  modelLabels,
  defaultModelData
}) => {
  const [localMappings, setLocalMappings] = useState<ClassMapping>(mappings);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleSave = () => {
    onSaveMappings(localMappings);
    setSaveStatus('Saved.');
    setIsExpanded(false);
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleCancel = () => {
    setLocalMappings(mappings);
    setIsExpanded(false);
  };

  // Determine if currently loaded model is the default one
  // We compare the actual loaded URL, not the text input
  const isDefaultModel = defaultModelData && loadedModelUrl === defaultModelData.url;

  return (
    <header className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-6">
      <div className="border-b border-slate-700 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          AI Rock Paper Scissors
        </h1>
        
        {/* Model Indicator Badge */}
        {status === 'loaded' && (
          <div className={`px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            isDefaultModel 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
          }`}>
            {isDefaultModel ? (
              <>
                <span className="text-lg">✨</span>
                <span className="flex flex-col">
                  <span>Using Default Model</span>
                  <span className="normal-case opacity-75 font-medium text-[10px]">{defaultModelData?.desc}</span>
                </span>
              </>
            ) : (
              <>
                <span className="text-lg">🛠️</span>
                <span>Using Custom Model</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Model URL Section */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
            Teachable Machine Model URL
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={modelUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://teachablemachine.withgoogle.com/models/XXXX/"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-indigo-100 transition-all"
            />
            <button 
              onClick={onLoadModel}
              disabled={status === 'loading'}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 px-6 py-2 rounded-lg font-bold transition-all text-sm active:scale-95 shadow-lg shadow-indigo-600/20 whitespace-nowrap"
            >
              LOAD
            </button>
          </div>
          
          {/* Status & Labels Container */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${
                status === 'loaded' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                status === 'loading' ? 'bg-amber-500/10 text-amber-400 animate-pulse border-amber-500/20' :
                status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                'bg-slate-900 text-slate-500 border-slate-700'
              }`}>
                Status: {status}
              </span>
              {status === 'failed' && (
                <span className="text-xs text-red-400 font-medium">
                  Failed to load. Verify URL & CORS.
                </span>
              )}
            </div>

            {modelLabels.length > 0 && (
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Model Classes:</span>
                <span className="font-mono bg-slate-900 px-2 py-0.5 rounded text-indigo-300 border border-slate-700/50">
                  {modelLabels.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Class Mapping Section (Collapsible) */}
        <div className={`transition-all duration-300 ease-in-out border border-slate-700/50 rounded-xl p-4 w-full ${isExpanded ? 'bg-slate-900/50 shadow-inner' : 'hover:bg-slate-700/30'}`}>
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col justify-center">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                Class Name Mappings
              </label>
              {!isExpanded && (
                <span className="text-[10px] text-slate-500 mt-1">
                  Customize Rock/Paper/Scissors matching
                </span>
              )}
            </div>

            {!isExpanded ? (
              <div className="flex items-center gap-3">
                {saveStatus && <span className="text-xs text-emerald-400 font-bold animate-pulse">{saveStatus}</span>}
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="bg-slate-700 hover:bg-indigo-600 px-4 py-1.5 rounded-lg font-bold text-xs transition-all active:scale-95 border border-slate-600 hover:border-indigo-400 shadow-sm whitespace-nowrap"
                >
                  EDIT
                </button>
              </div>
            ) : (
              <button 
                onClick={handleCancel}
                className="text-slate-500 hover:text-slate-300 text-xs underline decoration-dotted transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
          
          {isExpanded && (
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-tighter">Rock Class</span>
                  <input 
                    placeholder="e.g. Rock"
                    value={localMappings.rock}
                    onChange={(e) => setLocalMappings({...localMappings, rock: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none hover:border-slate-500 transition-all text-slate-100 placeholder-slate-600 shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-tighter">Paper Class</span>
                  <input 
                    placeholder="e.g. Paper"
                    value={localMappings.paper}
                    onChange={(e) => setLocalMappings({...localMappings, paper: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none hover:border-slate-500 transition-all text-slate-100 placeholder-slate-600 shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-tighter">Scissors Class</span>
                  <input 
                    placeholder="e.g. Scissors"
                    value={localMappings.scissors}
                    onChange={(e) => setLocalMappings({...localMappings, scissors: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none hover:border-slate-500 transition-all text-slate-100 placeholder-slate-600 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleSave}
                  className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-lg font-bold text-xs text-white transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                >
                  APPLY
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
