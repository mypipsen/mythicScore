import React from 'react';
import { CharacterDisplay } from '../types';

export const Header: React.FC<{ characterDisplay: CharacterDisplay | null }> = ({ characterDisplay }) => (
  <div className="header">
    <h1>Mythic Score Graph</h1>
    {characterDisplay && (
      <p>{characterDisplay.name} - {characterDisplay.realm} ({characterDisplay.region})</p>
    )}
  </div>
);
