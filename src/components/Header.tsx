import React from 'react';
import { CharacterDisplay } from '../types';

export const Header: React.FC<{ characterDisplay: CharacterDisplay | null, totalRuns?: number }> = ({ characterDisplay, totalRuns }) => (
  <div className="header">
    <h1><a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Mythic Score</a></h1>
    {characterDisplay && (
      <p className="header-info">
        <span className="character-details">{characterDisplay.name} - {characterDisplay.realm} ({characterDisplay.region})</span>
        {totalRuns !== undefined && totalRuns > 0 && (
          <span className="total-runs">
            Total Runs: <strong>{totalRuns}</strong>
          </span>
        )}
      </p>
    )}
  </div>
);
