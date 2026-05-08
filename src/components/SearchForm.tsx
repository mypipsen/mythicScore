import React, { useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

type SearchFormProps = {
  raiderIoUrl: string;
  setRaiderIoUrl: (url: string) => void;
  activeUrl: string;
  onSearch: (url: string) => void;
};

export const SearchForm: React.FC<SearchFormProps> = ({ raiderIoUrl, setRaiderIoUrl, activeUrl, onSearch }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activeUrl && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raiderIoUrl) {
      const defaultUrl = 'https://raider.io/characters/eu/tarren-mill/Bikstok';
      if (defaultUrl !== activeUrl) {
        setRaiderIoUrl(defaultUrl);
        onSearch(defaultUrl);
      }
      return;
    }
    if (raiderIoUrl === activeUrl) return;
    onSearch(raiderIoUrl);
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
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
