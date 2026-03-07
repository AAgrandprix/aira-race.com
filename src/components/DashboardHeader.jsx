import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function DashboardHeader() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', country: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = '/login';
        return;
      }
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setEditForm({ displayName: data.displayName || '', country: data.country || '' });
      } else {
        setUserData({ displayName: currentUser.displayName, photoURL: currentUser.photoURL });
        setEditForm({ displayName: currentUser.displayName || '', country: '' });
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!userData?.uid) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', userData.uid), {
        displayName: editForm.displayName,
        country: editForm.country,
      });
      setUserData(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
    } catch (e) {
      console.error('Update failed:', e);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-12 animate-pulse">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-slate-800"></div>
          <div>
            <div className="h-10 bg-slate-800 rounded w-64 mb-3"></div>
            <div className="h-5 bg-slate-800 rounded w-40"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-start gap-5">
        {userData?.photoURL && (
          <img
            src={userData.photoURL}
            alt={userData.displayName}
            className="h-16 w-16 rounded-full ring-2 ring-sky-500 flex-shrink-0"
          />
        )}
        <div className="flex-1">
          {!isEditing ? (
            <>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Welcome, <span className="text-sky-400">{userData?.displayName}</span>!
              </h1>
              <div className="mt-2 flex items-center gap-4">
                {userData?.country && (
                  <span className="text-slate-400 text-sm">{userData.country}</span>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-slate-500 hover:text-sky-400 transition-colors border border-slate-700 hover:border-sky-500 rounded px-2 py-1"
                >
                  Edit Profile
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3 max-w-sm">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Country</label>
                <input
                  type="text"
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  placeholder="Japan"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({ displayName: userData.displayName || '', country: userData.country || '' });
                  }}
                  className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
