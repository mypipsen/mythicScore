import { useState, useEffect } from 'react';
import { getSavedCharacter } from '../utils/storage';

const getInitialUrl = (savedChar: any) => {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length === 3) {
    const [region, realm, name] = pathParts;
    return `https://raider.io/characters/${region}/${realm}/${name}`;
  }

  return savedChar?.url ||
    (savedChar?.region && savedChar?.realm && savedChar?.name
      ? `https://raider.io/characters/${savedChar.region.toLowerCase()}/${savedChar.realm.toLowerCase().replace(/\s+/g, '-')}/${savedChar.name}`
      : 'https://raider.io/characters/eu/tarren-mill/Bikstok');
};

export const useUrlState = () => {
  const savedChar = getSavedCharacter();
  const initialUrl = getInitialUrl(savedChar);

  const [activeUrl, setActiveUrl] = useState<string>(initialUrl);
  const [raiderIoUrl, setRaiderIoUrl] = useState<string>(initialUrl);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length !== 3) {
      const urlMatch = initialUrl.match(/raider\.io\/characters\/([^/]+)\/([^/]+)\/([^/?#]+)/);
      if (urlMatch) {
        const [_, region, realm, name] = urlMatch;
        window.history.replaceState({}, '', `/${region}/${realm}/${name}`);
      }
    }
  }, [initialUrl]);

  useEffect(() => {
    const handlePopState = () => {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length === 3) {
        const [region, realm, name] = pathParts;
        const urlFromPath = `https://raider.io/characters/${region}/${realm}/${name}`;
        if (urlFromPath !== activeUrl) {
          setRaiderIoUrl(urlFromPath);
          setActiveUrl(urlFromPath);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeUrl]);

  const updateUrl = (newUrl: string) => {
    const urlMatch = newUrl.match(/raider\.io\/characters\/([^/]+)\/([^/]+)\/([^/?#]+)/);
    if (urlMatch) {
      const [_, region, realm, name] = urlMatch;
      window.history.pushState({}, '', `/${region}/${realm}/${name}`);
    }
    setActiveUrl(newUrl);
    setRaiderIoUrl(newUrl);
  };

  return { activeUrl, raiderIoUrl, setRaiderIoUrl, updateUrl };
};
