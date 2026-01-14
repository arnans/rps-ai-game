
export enum Move {
  ROCK = 0,
  PAPER = 1,
  SCISSORS = 2,
  NONE = -1
}

export interface ClassMapping {
  rock: string;
  paper: string;
  scissors: string;
}

export interface Prediction {
  className: string;
  probability: number;
}

export interface GameState {
  humanScore: number;
  robotScore: number;
  humanMove: Move;
  robotMove: Move;
  isCountingDown: boolean;
  message: string;
}

// Global declarations for external libraries loaded via CDN
declare global {
  interface Window {
    tmImage: {
      load: (modelUrl: string, metadataUrl: string) => Promise<any>;
      Webcam: new (width: number, height: number, flip: boolean) => any;
    };
  }
}
