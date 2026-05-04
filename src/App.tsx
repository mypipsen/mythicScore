import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, AlertCircle, Search } from 'lucide-react';
import './index.css';

interface RunSummary {
  dungeon: {
    short_name: string;
    name: string;
  };
  mythic_level: number;
  completed_at: string;
}

interface NewRunResponse {
  summary: RunSummary;
  score: number;
}

interface NewRaiderIoResponse {
  runs: NewRunResponse[];
}

interface ChartDataPoint {
  date: string;
  totalScore: number;
  allRuns: {
    dungeon: string;
    level: number;
    score: number;
  }[];
}

const App: React.FC = () => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [region, setRegion] = useState('eu');
  const [realm, setRealm] = useState('tarren-mill');
  const [name, setName] = useState('Bikstok');

  // Currently loaded character state
  const [characterId, setCharacterId] = useState<number | null>(242514059);
  const [characterDisplay, setCharacterDisplay] = useState<{ name: string, realm: string, region: string } | null>({
    name: 'Bikstok',
    realm: 'Tarren Mill',
    region: 'EU'
  });

  const dungeonIds = [15808, 14032, 6988, 15829, 8910, 16395, 4813, 16573];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !realm || !region) return;

    setLoading(true);
    setError(null);
    setData([]);
    setCharacterDisplay(null);

    try {
      // Step 1: Search for the character to get their characterId
      const searchRes = await fetch(`/api/search?term=${encodeURIComponent(name)}`);
      if (!searchRes.ok) throw new Error("Failed to search for character");

      const searchData = await searchRes.json();

      const match = searchData.matches?.find((m: any) =>
        m.type === 'character' &&
        m.data.region.slug.toLowerCase() === region.toLowerCase() &&
        (m.data.realm.slug.toLowerCase() === realm.toLowerCase().replace(/\s+/g, '-') ||
          m.data.realm.name.toLowerCase() === realm.toLowerCase())
      );

      if (!match) {
        throw new Error(`Character not found: ${name} on ${realm} (${region.toUpperCase()})`);
      }

      setCharacterDisplay({
        name: match.data.name,
        realm: match.data.realm.name,
        region: match.data.region.short_name
      });
      setCharacterId(match.data.id);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!characterId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchPromises = dungeonIds.map(dungeonId =>
          fetch(`/api/characters/mythic-plus-runs?season=season-mn-1&characterId=${characterId}&dungeonId=${dungeonId}&role=all&specId=0&mode=scored&affixes=all&date=all`)
            .then(res => {
              if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
              return res.json();
            })
        );

        const results: NewRaiderIoResponse[] = await Promise.all(fetchPromises);

        let allRuns: NewRunResponse[] = [];
        results.forEach(result => {
          if (result.runs) {
            allRuns = allRuns.concat(result.runs);
          }
        });

        if (allRuns.length === 0) {
          throw new Error('No mythic plus runs found for this character.');
        }

        // Parse and sort data chronologically
        const sortedRuns = allRuns.sort((a, b) => new Date(a.summary.completed_at).getTime() - new Date(b.summary.completed_at).getTime());

        // Calculate cumulative score progression grouped by day
        const bestScores: Record<string, number> = {};
        let currentTotalScore = 0;
        const groupedByDay: Record<string, ChartDataPoint> = {};

        sortedRuns.forEach((run) => {
          const dungeonName = run.summary.dungeon.short_name;
          const runScore = run.score;

          if (!bestScores[dungeonName] || runScore > bestScores[dungeonName]) {
            const scoreDiff = runScore - (bestScores[dungeonName] || 0);
            bestScores[dungeonName] = runScore;
            currentTotalScore += scoreDiff;
          }

          const dateStr = new Date(run.summary.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

          if (!groupedByDay[dateStr]) {
            groupedByDay[dateStr] = {
              date: dateStr,
              totalScore: currentTotalScore,
              allRuns: [{ dungeon: dungeonName, level: run.summary.mythic_level, score: runScore }]
            };
          } else {
            groupedByDay[dateStr].totalScore = currentTotalScore;
            groupedByDay[dateStr].allRuns.push({ dungeon: dungeonName, level: run.summary.mythic_level, score: runScore });
          }
        });

        const chartData: ChartDataPoint[] = Object.values(groupedByDay).map(day => ({
          ...day,
          allRuns: day.allRuns.sort((a, b) => b.score - a.score)
        }));

        setData(chartData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching raider.io data:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, [characterId]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as ChartDataPoint;
      return (
        <div className="custom-tooltip">
          <p>{label}</p>
          <p className="score">Total Score: {dataPoint.totalScore.toFixed(1)}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
            {dataPoint.allRuns.length} run{dataPoint.allRuns.length > 1 ? 's' : ''} today:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
            {dataPoint.allRuns.map((r, i) => (
              <p key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                {r.dungeon} +{r.level} ({r.score.toFixed(1)})
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Mythic Score Graph</h1>
        {characterDisplay && (
          <p>{characterDisplay.name} - {characterDisplay.realm} ({characterDisplay.region})</p>
        )}
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <select value={region} onChange={e => setRegion(e.target.value)} className="search-input select-input">
          <option value="us">US</option>
          <option value="eu">EU</option>
          <option value="kr">KR</option>
          <option value="tw">TW</option>
        </select>
        <input
          type="text"
          value={realm}
          onChange={e => setRealm(e.target.value)}
          placeholder="Realm (e.g. tarren-mill)"
          className="search-input"
        />
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Character Name"
          className="search-input"
        />
        <button type="submit" className="search-button">
          <Search size={18} /> Search
        </button>
      </form>

      <div className="chart-card">
        {loading ? (
          <div className="loading-container">
            <Loader2 size={48} className="spinner" />
            <p>Fetching Character Data...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <AlertCircle size={48} color="#ef4444" />
            <p>Error: {error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="error-container">
            <AlertCircle size={48} color="#f59e0b" />
            <p>No recent runs found for this character.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                tickMargin={10}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                tickMargin={10}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="totalScore"
                stroke="#a78bfa"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorScore)"
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default App;
