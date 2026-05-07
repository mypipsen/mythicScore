import React from 'react';
import { Search } from 'lucide-react';

type SearchFormProps = {
  raiderIoUrl: string;
  setRaiderIoUrl: (url: string) => void;
  activeUrl: string;
  onSearch: (url: string) => void;
};

export const SearchForm: React.FC<SearchFormProps> = ({ raiderIoUrl, setRaiderIoUrl, activeUrl, onSearch }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raiderIoUrl || raiderIoUrl === activeUrl) return;
    onSearch(raiderIoUrl);
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
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
  );
};
