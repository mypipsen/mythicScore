export type RunSummary = {
  dungeon: {
    short_name: string;
    name: string;
  };
  mythic_level: number;
  completed_at: string;
  time_remaining_ms: number;
};

export type NewRunResponse = {
  summary: RunSummary;
  score: number;
};

export type NewRaiderIoResponse = {
  runs: NewRunResponse[];
};

export type ChartDataPoint = {
  date: string;
  timestamp: number;
  totalScore: number;
  scoreIncrease: number;
  allRuns: {
    dungeon: string;
    level: number;
    score: number;
    runScoreIncrease: number;
    isDepleted: boolean;
  }[];
};

export type CharacterDisplay = {
  name: string;
  realm: string;
  region: string;
};
