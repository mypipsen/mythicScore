import { useState, useEffect } from 'react';
import { NewRunResponse, CharacterDisplay, NewRaiderIoResponse } from '../types';

const dungeonIds = [15808, 14032, 6988, 15829, 8910, 16395, 4813, 16573];

export const useCharacterData = (activeUrl: string) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rawRuns, setRawRuns] = useState<NewRunResponse[]>([]);
  
  const [characterId, setCharacterId] = useState<number | null>(null);
  const [characterDisplay, setCharacterDisplay] = useState<CharacterDisplay | null>(null);
  const [retrySearchCount, setRetrySearchCount] = useState<number>(0);
  const [retryFetchCount, setRetryFetchCount] = useState<number>(0);

  const retry = () => {
    if (characterId) {
      setRetryFetchCount(prev => prev + 1);
    } else {
      setRetrySearchCount(prev => prev + 1);
    }
  };

  useEffect(() => {
    const performSearch = async () => {
      if (!activeUrl) return;

      setLoading(true);
      setError(null);
      setRawRuns([]);
      setCharacterDisplay(null);
      setCharacterId(null);

      const urlMatch = activeUrl.match(/raider\.io\/characters\/([^/]+)\/([^/]+)\/([^/?#]+)/);
      if (!urlMatch) {
        setError("Invalid raider.io URL format. Please use https://raider.io/characters/region/realm/name");
        setLoading(false);
        return;
      }

      const [_, region, realm, name] = urlMatch;

      try {
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
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    performSearch();
  }, [activeUrl, retrySearchCount]);

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
  }, [characterId, retryFetchCount]);

  return { loading, error, rawRuns, characterDisplay, retry };
};
