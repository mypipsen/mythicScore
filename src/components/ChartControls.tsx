import React from 'react';

type ChartControlsProps = {
  grouping: 'day' | 'week';
  setGrouping: (grouping: 'day' | 'week') => void;
};

export const ChartControls: React.FC<ChartControlsProps> = ({ grouping, setGrouping }) => {
  return (
    <div className="chart-controls">
      <div className="toggle-group">
        <button
          className={`toggle-btn ${grouping === 'day' ? 'active' : ''}`}
          onClick={() => setGrouping('day')}
        >
          Day
        </button>
        <button
          className={`toggle-btn ${grouping === 'week' ? 'active' : ''}`}
          onClick={() => setGrouping('week')}
        >
          Week
        </button>
      </div>
    </div>
  );
};
