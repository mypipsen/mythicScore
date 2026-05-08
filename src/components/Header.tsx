import React from 'react';
import { CharacterDisplay } from '../types';

export const Header: React.FC<{ characterDisplay: CharacterDisplay | null, totalRuns?: number, currentScore?: number }> = ({ characterDisplay, totalRuns, currentScore }) => (
  <div className="header">
    <h1><a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Mythic Score</a></h1>
    {characterDisplay && (
      <p className="header-info">
        <span className="character-details">{characterDisplay.name} - {characterDisplay.realm} ({characterDisplay.region})</span>
        {currentScore !== undefined && currentScore > 0 && (
          <span className="current-score">
            Current Score: <strong>{currentScore.toFixed(1)}</strong>
          </span>
        )}
        {totalRuns !== undefined && totalRuns > 0 && (
          <span className="total-runs">
            Total Runs: <strong>{totalRuns}</strong>
          </span>
        )}
      </p>
    )}
  </div>
);
