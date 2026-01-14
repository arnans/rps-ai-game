
import { Move } from './types';

export const DEFAULT_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/vM-U0EwXG/'; // Example URL
export const STORAGE_KEY_URL = 'rps_model_url';
export const STORAGE_KEY_MAPPING = 'rps_class_mapping';

export const MOVE_EMOJIS: Record<Move, string> = {
  [Move.ROCK]: '✊',
  [Move.PAPER]: '✋',
  [Move.SCISSORS]: '✌️',
  [Move.NONE]: '❓'
};

export const MOVE_NAMES: Record<Move, string> = {
  [Move.ROCK]: 'Rock',
  [Move.PAPER]: 'Paper',
  [Move.SCISSORS]: 'Scissors',
  [Move.NONE]: 'None'
};

export const AUDIO_WIN_URL = 'https://actions.google.com/sounds/v1/cartoon/trumpet_fanfare.ogg';
export const AUDIO_LOSE_URL = 'https://actions.google.com/sounds/v1/cartoon/boing.ogg';
