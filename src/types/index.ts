export type RunSummary = {
  dungeon: {
    short_name: string;
    name: string;
  };
  mythic_level: number;
  completed_at: string;
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
  totalScore: number;
  scoreIncrease: number;
  allRuns: {
    dungeon: string;
    level: number;
    score: number;
    runScoreIncrease: number;
  }[];
};

export type CharacterDisplay = {
  name: string;
  realm: string;
  region: string;
};
