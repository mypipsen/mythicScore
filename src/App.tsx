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
  scoreIncrease: number;
  allRuns: {
    dungeon: string;
    level: number;
    score: number;
    runScoreIncrease: number;
  }[];
}

const getSavedCharacter = () => {
  try {
    const saved = localStorage.getItem('mythic_saved_character');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Error reading from localStorage", e);
  }
  return null;
};

const getInitialUrl = (savedChar: any) => {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length === 3) {
    const [region, realm, name] = pathParts;
    return `https://raider.io/characters/${region}/${realm}/${name}`;
  }

  return savedChar?.url ||
    (savedChar?.region && savedChar?.realm && savedChar?.name
      ? `https://raider.io/characters/${savedChar.region.toLowerCase()}/${savedChar.realm.toLowerCase().replace(/\s+/g, '-')}/${savedChar.name}`
      : 'https://raider.io/characters/eu/tarren-mill/Bikstok');
};

const App: React.FC = () => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [rawRuns, setRawRuns] = useState<NewRunResponse[]>([]);
  const [grouping, setGrouping] = useState<'day' | 'week'>('day');

  const savedChar = getSavedCharacter();
  const initialUrl = getInitialUrl(savedChar);

  // Form state
  const [activeUrl, setActiveUrl] = useState<string>(initialUrl);
  const [raiderIoUrl, setRaiderIoUrl] = useState<string>(initialUrl);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length !== 3) {
      const urlMatch = initialUrl.match(/raider\.io\/characters\/([^/]+)\/([^/]+)\/([^/?#]+)/);
      if (urlMatch) {
        const [_, region, realm, name] = urlMatch;
        window.history.replaceState({}, '', `/${region}/${realm}/${name}`);
      }
    }
  }, [initialUrl]);

  useEffect(() => {
    const handlePopState = () => {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length === 3) {
        const [region, realm, name] = pathParts;
        const urlFromPath = `https://raider.io/characters/${region}/${realm}/${name}`;
        if (urlFromPath !== activeUrl) {
          setRaiderIoUrl(urlFromPath);
          setActiveUrl(urlFromPath);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeUrl]);

  // Currently loaded character state
  const [characterId, setCharacterId] = useState<number | null>(savedChar?.characterId || 242514059);
  const [characterDisplay, setCharacterDisplay] = useState<{ name: string, realm: string, region: string } | null>(
    savedChar ? { name: savedChar.name, realm: savedChar.realm, region: savedChar.region } : {
      name: 'Bikstok',
      realm: 'Tarren Mill',
      region: 'EU'
    }
  );

  const dungeonIds = [15808, 14032, 6988, 15829, 8910, 16395, 4813, 16573];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raiderIoUrl || raiderIoUrl === activeUrl) return;

    const urlMatch = raiderIoUrl.match(/raider\.io\/characters\/([^/]+)\/([^/]+)\/([^/?#]+)/);
    if (urlMatch) {
      const [_, region, realm, name] = urlMatch;
      window.history.pushState({}, '', `/${region}/${realm}/${name}`);
    }
    setActiveUrl(raiderIoUrl);
  };

  useEffect(() => {
    const performSearch = async () => {
      if (!activeUrl) return;

      setLoading(true);
      setError(null);
      setData([]);
      setRawRuns([]);
      setCharacterDisplay(null);

      const urlMatch = activeUrl.match(/raider\.io\/characters\/([^/]+)\/([^/]+)\/([^/?#]+)/);
      if (!urlMatch) {
        setError("Invalid raider.io URL format. Please use https://raider.io/characters/region/realm/name");
        setLoading(false);
        return;
      }

      const [_, region, realm, name] = urlMatch;

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

        try {
          localStorage.setItem('mythic_saved_character', JSON.stringify({
            characterId: match.data.id,
            name: match.data.name,
            realm: match.data.realm.name,
            region: match.data.region.short_name,
            url: activeUrl
          }));
        } catch (e) {
          // Ignore quota errors
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    performSearch();
  }, [activeUrl]);

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
        setRawRuns(sortedRuns);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching raider.io data:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, [characterId]);

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as ChartDataPoint;
      return (
        <div className="custom-tooltip">
          <p>{label}</p>
          <p className="score">
            Total Score: {dataPoint.totalScore.toFixed(1)}
            {dataPoint.scoreIncrease > 0 && (
              <span style={{ color: '#10b981', marginLeft: '6px', fontSize: '0.85em' }}>
                (+{dataPoint.scoreIncrease.toFixed(1)})
              </span>
            )}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
            {dataPoint.allRuns.length} run{dataPoint.allRuns.length > 1 ? 's' : ''} {grouping === 'day' ? 'today' : 'this week'}:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
            {dataPoint.allRuns.map((r, i) => (
              <p key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                {r.dungeon} +{r.level} ({r.score.toFixed(1)})
                {r.runScoreIncrease > 0 && (
                  <span style={{ color: '#10b981', marginLeft: '4px' }}>
                    (+{r.runScoreIncrease.toFixed(1)})
                  </span>
                )}
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
        <input
          type="url"
          value={raiderIoUrl}
          onChange={e => setRaiderIoUrl(e.target.value)}
          placeholder="https://raider.io/characters/eu/tarren-mill/Bikstok"
          className="search-input"
          style={{ flex: 1 }}
        />
        <button type="submit" className="search-button">
          <Search size={18} /> Search
        </button>
      </form>

      <div className="chart-card">
        {!loading && !error && data.length > 0 && (
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <div className="toggle-group" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
              <button
                onClick={() => setGrouping('day')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  background: grouping === 'day' ? '#8b5cf6' : 'transparent',
                  color: grouping === 'day' ? 'white' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                Day
              </button>
              <button
                onClick={() => setGrouping('week')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  background: grouping === 'week' ? '#8b5cf6' : 'transparent',
                  color: grouping === 'week' ? 'white' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                Week
              </button>
            </div>
          </div>
        )}
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
