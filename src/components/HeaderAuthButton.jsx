import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function HeaderAuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setReady(true);
    });
    return () => unsubscribe();
  }, []);

  if (!ready) {
    return (
      <span class="inline-flex items-center px-4 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-800 rounded-md w-20 h-8" />
    );
  }

  return isLoggedIn ? (
    <a
      href="/dashboard"
      className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-zinc-300 border border-zinc-700 rounded-md hover:border-white hover:text-white transition-colors"
    >
      Dashboard
    </a>
  ) : (
    <a
      href="/login"
      className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-zinc-300 border border-zinc-700 rounded-md hover:border-white hover:text-white transition-colors"
    >
      Login
    </a>
  );
}
