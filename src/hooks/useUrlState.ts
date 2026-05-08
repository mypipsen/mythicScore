import { useState, useEffect } from 'react';

const getInitialUrl = () => {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length === 3) {
    const [region, realm, name] = pathParts;
    return `https://raider.io/characters/${region}/${realm}/${name}`;
  }

  return '';
};

export const useUrlState = () => {
  const initialUrl = getInitialUrl();

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
