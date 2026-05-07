import React from 'react';

type ChartControlsProps = {
  grouping: 'day' | 'week';
  setGrouping: (grouping: 'day' | 'week') => void;
};

export const ChartControls: React.FC<ChartControlsProps> = ({ grouping, setGrouping }) => {
  return (
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
  );
};
