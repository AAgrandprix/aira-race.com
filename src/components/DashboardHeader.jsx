import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const NAME_REGEX = /^[A-Za-z0-9_]{1,16}$/;

function validateDisplayName(name) {
  if (!name) return 'Display name is required.';
  if (!NAME_REGEX.test(name)) {
    if (name.length > 16) return 'Max 16 characters.';
    return 'Only letters (A–Z, a–z), numbers (0–9), and underscores (_) are allowed. No spaces or other symbols.';
  }
  return null;
}

export default function DashboardHeader() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', country: '' });
  const [nameError, setNameError] = useState(null);
  const [tokenStatus, setTokenStatus] = useState(null); // null | 'sending' | 'sent' | 'error'

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

  const handleReissueToken = async () => {
    if (!userData?.uid || !userData?.email) return;
    setTokenStatus('sending');
    try {
      const gasUrl = import.meta.env.PUBLIC_GAS_API_URL;
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          type: 'REISSUE_TOKEN',
          payload: { uid: userData.uid, email: userData.email, displayName: userData.displayName }
        })
      });
      const data = await res.json();
      setTokenStatus(data.status === 'success' ? 'sent' : 'error');
    } catch {
      setTokenStatus('error');
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setEditForm({ ...editForm, displayName: value });
    setNameError(validateDisplayName(value));
  };

  const handleSave = async () => {
    if (!userData?.uid) return;

    // Client-side validation
    const validationError = validateDisplayName(editForm.displayName);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      // Uniqueness check: skip if name unchanged
      if (editForm.displayName !== userData.displayName) {
        const q = query(collection(db, 'users'), where('displayName', '==', editForm.displayName));
        const snapshot = await getDocs(q);
        const taken = snapshot.docs.some(d => d.id !== userData.uid);
        if (taken) {
          setNameError('This name is already taken. Please choose another.');
          setIsSaving(false);
          return;
        }
      }

      await updateDoc(doc(db, 'users', userData.uid), {
        displayName: editForm.displayName,
        country: editForm.country,
      });

      // Sync new display name to Google Sheets (User_Registry C列)
      if (editForm.displayName !== userData.displayName) {
        const gasUrl = import.meta.env.PUBLIC_GAS_API_URL;
        if (gasUrl) {
          fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              type: 'UPDATE_NAME',
              payload: { uid: userData.uid, newDisplayName: editForm.displayName }
            })
          }).catch(err => console.warn('GAS name sync failed:', err));
        }
      }

      setUserData(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
      setNameError(null);
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
                {tokenStatus === null && (
                  <button
                    onClick={handleReissueToken}
                    className="text-xs text-slate-500 hover:text-amber-400 transition-colors border border-slate-700 hover:border-amber-500 rounded px-2 py-1"
                  >
                    Re-issue Player Token
                  </button>
                )}
                {tokenStatus === 'sending' && (
                  <span className="text-xs text-slate-500 px-2 py-1">Sending...</span>
                )}
                {tokenStatus === 'sent' && (
                  <span className="text-xs text-emerald-400 px-2 py-1">✓ New token sent to your email</span>
                )}
                {tokenStatus === 'error' && (
                  <span className="text-xs text-red-400 px-2 py-1">Failed. Please try again.</span>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3 max-w-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-400">Display Name</label>
                  <span className={`text-xs ${editForm.displayName.length > 16 ? 'text-red-400' : 'text-slate-500'}`}>
                    {editForm.displayName.length}/16
                  </span>
                </div>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={handleNameChange}
                  maxLength={16}
                  className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:border-transparent outline-none ${nameError ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-sky-500'}`}
                />
                {nameError ? (
                  <p className="mt-1 text-xs text-red-400">{nameError}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">Letters, numbers, and underscores (A–Z, 0–9, _). Used as <code className="text-sky-400">NAME=</code> in aira Beta 1.7 config.</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Country</label>
                <select
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                >
                  <option value="">— Select your country —</option>
                  <option value="Afghanistan">Afghanistan</option>
                  <option value="Albania">Albania</option>
                  <option value="Algeria">Algeria</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Australia">Australia</option>
                  <option value="Austria">Austria</option>
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="Belgium">Belgium</option>
                  <option value="Brazil">Brazil</option>
                  <option value="Canada">Canada</option>
                  <option value="Chile">Chile</option>
                  <option value="China">China</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Croatia">Croatia</option>
                  <option value="Czech Republic">Czech Republic</option>
                  <option value="Denmark">Denmark</option>
                  <option value="Egypt">Egypt</option>
                  <option value="Finland">Finland</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Greece">Greece</option>
                  <option value="Hungary">Hungary</option>
                  <option value="India">India</option>
                  <option value="Indonesia">Indonesia</option>
                  <option value="Iran">Iran</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Israel">Israel</option>
                  <option value="Italy">Italy</option>
                  <option value="Japan">Japan</option>
                  <option value="Jordan">Jordan</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="Mexico">Mexico</option>
                  <option value="Morocco">Morocco</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="New Zealand">New Zealand</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Norway">Norway</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="Peru">Peru</option>
                  <option value="Philippines">Philippines</option>
                  <option value="Poland">Poland</option>
                  <option value="Portugal">Portugal</option>
                  <option value="Romania">Romania</option>
                  <option value="Russia">Russia</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="Singapore">Singapore</option>
                  <option value="South Africa">South Africa</option>
                  <option value="South Korea">South Korea</option>
                  <option value="Spain">Spain</option>
                  <option value="Sri Lanka">Sri Lanka</option>
                  <option value="Sweden">Sweden</option>
                  <option value="Switzerland">Switzerland</option>
                  <option value="Taiwan">Taiwan</option>
                  <option value="Thailand">Thailand</option>
                  <option value="Turkey">Turkey</option>
                  <option value="Ukraine">Ukraine</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Vietnam">Vietnam</option>
                  <option value="Other">Other</option>
                </select>
                <p className="mt-1 text-xs text-amber-400/80">* Required for prize money disbursement.</p>
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
                    setNameError(null);
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
