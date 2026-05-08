import React from 'react';
import { CharacterDisplay } from '../types';

export const Header: React.FC<{ characterDisplay: CharacterDisplay | null, totalRuns?: number }> = ({ characterDisplay, totalRuns }) => (
  <div className="header">
    <h1><a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Mythic Score</a></h1>
    {characterDisplay && (
      <p>
        {characterDisplay.name} - {characterDisplay.realm} ({characterDisplay.region})
        {totalRuns !== undefined && totalRuns > 0 && (
          <span style={{ marginLeft: '12px', paddingLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8' }}>
            Total Runs: <span style={{ color: '#fff', fontWeight: 600 }}>{totalRuns}</span>
          </span>
        )}
      </p>
    )}
  </div>
);
