import { useState, useEffect } from 'react';
import { ChartDataPoint, NewRunResponse, CharacterDisplay } from '../types';

export const useChartData = (rawRuns: NewRunResponse[], grouping: 'day' | 'week', characterDisplay: CharacterDisplay | null) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (rawRuns.length === 0) {
      setData([]);
      return;
    }

    const bestScores: Record<string, number> = {};
    let currentTotalScore = 0;
    const groupedData: Record<string, ChartDataPoint> = {};

    const getWeekStart = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = d.getDay();

      const regionLower = characterDisplay?.region?.toLowerCase() || 'eu';
      let resetDay = 3; // EU default (Wednesday)
      if (regionLower === 'us') resetDay = 2; // Tuesday
      else if (regionLower === 'kr' || regionLower === 'tw') resetDay = 4; // Thursday

      const diff = d.getDate() - ((day - resetDay + 7) % 7);
      return new Date(d.setDate(diff));
    };

    const getSeasonStart = (regionLower: string) => {
      if (regionLower === 'us') return new Date(2026, 2, 24); // March 24
      if (regionLower === 'kr' || regionLower === 'tw') return new Date(2026, 2, 26); // March 26
      return new Date(2026, 2, 25); // March 25 (EU)
    };

    rawRuns.forEach((run) => {
      const dungeonName = run.summary.dungeon.short_name;
      const runScore = run.score;

      let scoreDiff = 0;
      if (!bestScores[dungeonName] || runScore > bestScores[dungeonName]) {
        scoreDiff = runScore - (bestScores[dungeonName] || 0);
        bestScores[dungeonName] = runScore;
        currentTotalScore += scoreDiff;
      }

      let dateStr = "";
      if (grouping === 'day') {
        dateStr = new Date(run.summary.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else {
        const weekStart = getWeekStart(run.summary.completed_at);
        const regionLower = characterDisplay?.region?.toLowerCase() || 'eu';
        const seasonStart = getSeasonStart(regionLower);

        const diffDays = Math.round((weekStart.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
        const weekNum = Math.max(1, Math.floor(diffDays / 7) + 1);

        dateStr = `Week ${weekNum} (${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`;
      }

      if (!groupedData[dateStr]) {
        groupedData[dateStr] = {
          date: dateStr,
          totalScore: currentTotalScore,
          scoreIncrease: scoreDiff,
          allRuns: [{ dungeon: dungeonName, level: run.summary.mythic_level, score: runScore, runScoreIncrease: scoreDiff }]
        };
      } else {
        groupedData[dateStr].totalScore = currentTotalScore;
        groupedData[dateStr].scoreIncrease += scoreDiff;
        groupedData[dateStr].allRuns.push({ dungeon: dungeonName, level: run.summary.mythic_level, score: runScore, runScoreIncrease: scoreDiff });
      }
    });

    const chartData: ChartDataPoint[] = Object.values(groupedData).map(group => ({
      ...group,
      allRuns: group.allRuns.sort((a, b) => b.score - a.score)
    }));

    setData(chartData);
  }, [rawRuns, grouping, characterDisplay]);

  return data;
};
