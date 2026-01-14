
import React from 'react';
import { GameState, Move } from '../types';
import { MOVE_EMOJIS, MOVE_NAMES } from '../constants';

interface GameBoardProps {
  gameState: GameState;
  onPlay: () => void;
  onReset: () => void;
  canPlay: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onPlay, onReset, canPlay }) => {
  return (
    <div className="bg-slate-800 rounded-xl p-8 shadow-xl border border-slate-700 flex flex-col items-center justify-between h-full relative overflow-hidden">
      
      {/* COUNTDOWN OVERLAY */}
      {gameState.isCountingDown && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm transition-all duration-300">
          <div 
            key={gameState.message} 
            className="text-9xl md:text-[12rem] font-black text-indigo-100 drop-shadow-[0_0_25px_rgba(255,255,255,0.5)] animate-[pulse_0.8s_cubic-bezier(0.4,0,0.6,1)_infinite]"
          >
            {gameState.message}
          </div>
          <div className="mt-8 text-3xl md:text-5xl font-bold text-emerald-400 uppercase tracking-widest animate-bounce text-center px-4 drop-shadow-lg">
            Pose for Camera!
          </div>
        </div>
      )}

      {/* Status Message (Hidden during countdown) */}
      <div className={`text-2xl font-black mb-8 h-10 transition-all ${
        gameState.message.includes('Win') ? 'text-emerald-400 scale-110' : 
        gameState.message.includes('Robot') ? 'text-red-400' : 'text-slate-200'
      }`}>
        {!gameState.isCountingDown && gameState.message}
      </div>

      <div className="flex justify-around w-full items-center mb-12 gap-8">
        {/* Human Side */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Human</div>
          <div className="text-5xl font-black text-indigo-400">{gameState.humanScore}</div>
          
          {/* Increased size from w-32 to w-48 */}
          <div className="w-48 h-48 bg-slate-900 rounded-3xl flex items-center justify-center border-4 border-slate-700 shadow-inner overflow-hidden">
            {/* Increased text size from text-7xl to text-9xl */}
            <span className="text-9xl animate-bounce-slow">
              {MOVE_EMOJIS[gameState.humanMove]}
            </span>
          </div>
          <div className="text-slate-300 font-medium">
            {MOVE_NAMES[gameState.humanMove]}
          </div>
        </div>

        <div className="text-4xl font-black text-slate-700 italic">VS</div>

        {/* Robot Side */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Robot</div>
          <div className="text-5xl font-black text-purple-400">{gameState.robotScore}</div>
          
          {/* Increased size from w-32 to w-48 */}
          <div className="w-48 h-48 bg-slate-900 rounded-3xl flex items-center justify-center border-4 border-slate-700 shadow-inner overflow-hidden">
            {/* Increased text size from text-7xl to text-9xl */}
            <span className={`text-9xl ${gameState.isCountingDown ? 'animate-spin' : ''}`}>
              {gameState.isCountingDown ? '⚙️' : MOVE_EMOJIS[gameState.robotMove]}
            </span>
          </div>
          <div className="text-slate-300 font-medium">
            {gameState.isCountingDown ? 'Thinking...' : MOVE_NAMES[gameState.robotMove]}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 w-full">
        <button 
          onClick={onPlay}
          disabled={!canPlay || gameState.isCountingDown}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 py-4 rounded-xl text-xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          {gameState.isCountingDown ? 'Running...' : 'Play Round'}
        </button>
        <button 
          onClick={onReset}
          className="bg-slate-700 hover:bg-slate-600 px-6 rounded-xl font-bold transition-all active:scale-95"
        >
          Reset
        </button>
      </div>
      
      {!canPlay && (
        <p className="mt-4 text-xs text-amber-400 font-semibold uppercase tracking-tighter">
          Please load a valid model to start playing!
        </p>
      )}
    </div>
  );
};
