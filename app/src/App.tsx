import { useEffect, useState } from 'react';
import { Dashboard } from './views/Dashboard';
import { ShareView } from './views/ShareView';

export function App() {
  const [currentHash, setCurrentHash] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash : ''
  );

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Hash-based zero-install routing
  if (currentHash && currentHash.length > 1) {
    const cleanHash = currentHash.replace(/^#/, '');
    return <ShareView hash={cleanHash} />;
  }

  return <Dashboard />;
}

export default App;
