import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function JoinButton({ compId, isJoinable }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantsLoaded, setParticipantsLoaded] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) setUserData(snap.data());
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const apiUrl = import.meta.env.PUBLIC_GAS_API_URL;
    if (!apiUrl || !compId) return;
    fetch(`${apiUrl}?action=participants&comp_id=${encodeURIComponent(compId)}`)
      .then(r => r.json())
      .then(data => {
        setParticipants(Array.isArray(data) ? data : []);
        setParticipantsLoaded(true);
      })
      .catch(() => setParticipantsLoaded(true));
  }, [compId]);

  useEffect(() => {
    if (userData && participantsLoaded) {
      if (participants.includes(userData.displayName)) setJoined(true);
    }
  }, [userData, participantsLoaded, participants]);

  const handleJoin = async () => {
    if (!userData) return;
    setJoining(true);
    try {
      const apiUrl = import.meta.env.PUBLIC_GAS_API_URL;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          type: 'COMP_REGISTRATION',
          payload: { comp_id: compId, name: userData.displayName }
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setJoined(true);
        setParticipants(prev => [...prev, userData.displayName]);
      } else {
        alert('Failed to register: ' + data.message);
      }
    } catch {
      alert('Registration failed. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div>
      {/* Participants count */}
      {participantsLoaded && (
        <p className="text-sm text-zinc-500 mb-3">
          {participants.length} participant{participants.length !== 1 ? 's' : ''} registered
        </p>
      )}

      {/* Join button */}
      {authLoading ? (
        <div className="h-11 rounded-full bg-zinc-100 animate-pulse w-full" />
      ) : !isJoinable ? (
        <div className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-full">
          Registration Closed
        </div>
      ) : !userData ? (
        <a
          href="/login"
          className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-sky-500 rounded-full hover:bg-sky-600 transition-colors"
        >
          Sign in to Join →
        </a>
      ) : joined ? (
        <div className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Registered
        </div>
      ) : (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-orange-500 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {joining ? 'Registering...' : 'Join Competition'}
        </button>
      )}

      {/* Participant list */}
      {participantsLoaded && participants.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Participants</p>
          <div className="flex flex-wrap gap-1.5">
            {participants.map((name, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-full">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
