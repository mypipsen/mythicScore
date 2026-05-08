import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useUrlState } from './hooks/useUrlState';
import { useCharacterData } from './hooks/useCharacterData';
import { useChartData } from './hooks/useChartData';
import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';
import { ChartControls } from './components/ChartControls';
import { ScoreChart } from './components/ScoreChart';
import './index.css';

const App: React.FC = () => {
  const [grouping, setGrouping] = useState<'day' | 'week'>('day');

  const { activeUrl, raiderIoUrl, setRaiderIoUrl, updateUrl } = useUrlState();
  const { loading, error, rawRuns, characterDisplay } = useCharacterData(activeUrl);
  const data = useChartData(rawRuns, grouping, characterDisplay);

  return (
    <div className="app-container">
      <Header 
        characterDisplay={characterDisplay} 
        totalRuns={!loading && !error && rawRuns.length > 0 ? rawRuns.length : undefined} 
      />

      <SearchForm 
        raiderIoUrl={raiderIoUrl} 
        setRaiderIoUrl={setRaiderIoUrl} 
        activeUrl={activeUrl} 
        onSearch={updateUrl} 
      />

      <div className="chart-card">
        {!loading && !error && data.length > 0 && (
          <ChartControls grouping={grouping} setGrouping={setGrouping} />
        )}
        
        {!activeUrl ? (
          <div className="empty-state-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: '#94a3b8' }}>
            <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontSize: '18px', fontWeight: 500 }}>No Character Selected</p>
            <p style={{ marginTop: '8px', opacity: 0.7 }}>Paste a Raider.io URL above to view their mythic score progression.</p>
          </div>
        ) : loading ? (
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
          <ScoreChart data={data} grouping={grouping} />
        )}
      </div>
    </div>
  );
};

export default App;
