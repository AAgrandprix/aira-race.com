import React, { useState, useEffect } from 'react';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

const NAME_REGEX = /^[A-Za-z0-9_]{1,16}$/;

function validateDisplayName(name) {
  if (!name) return 'Display name is required.';
  if (!NAME_REGEX.test(name)) {
    if (name.length > 16) return 'Max 16 characters.';
    return 'Only letters (A–Z, a–z), numbers (0–9), and underscores (_) are allowed. No spaces or other symbols.';
  }
  return null;
}

export default function LoginManager() {
  const [agreed, setAgreed] = useState(false);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ displayName: '', country: '' });
  const [nameError, setNameError] = useState(null);
  const [countryError, setCountryError] = useState(null);
  const [playerToken, setPlayerToken] = useState(null); // 登録完了後に表示
  const [tokenCopied, setTokenCopied] = useState(false);

  // ページ読み込み時にセッションを確認
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // 既にログイン済み → Firestoreを確認してダッシュボードへ
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          window.location.href = "/dashboard";
          return;
        }
        // 認証済みだがFirestoreに未登録（稀なケース）→ モーダルへ
        setUser(currentUser);
        setFormData(prev => ({ ...prev, displayName: currentUser.displayName || '' }));
        setShowModal(true);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const currentUser = result.user;
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));

      if (userDoc.exists()) {
        window.location.href = "/dashboard";
      } else {
        setUser(currentUser);
        setFormData(prev => ({ ...prev, displayName: currentUser.displayName || '' }));
        setShowModal(true);
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!user) return;
    const validationError = validateDisplayName(formData.displayName);
    if (validationError) {
      setNameError(validationError);
      return;
    }
    if (!formData.country) {
      setCountryError('Please select your country.');
      return;
    }
    setCountryError(null);
    setIsLoading(true);

    try {
      const registrationData = {
        uid: user.uid,
        email: user.email,
        displayName: formData.displayName,
        country: formData.country,
      };

      await setDoc(doc(db, "users", user.uid), {
        ...registrationData,
        photoURL: user.photoURL,
        agreed_at: serverTimestamp(),
        created_at: serverTimestamp()
      });

      const gasUrl = import.meta.env.PUBLIC_GAS_API_URL;
      if (gasUrl) {
        try {
          const gasRes = await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ type: 'USER_REGISTRATION', payload: registrationData })
          });
          const gasData = await gasRes.json();
          if (gasData.player_token) {
            setShowModal(false);
            setPlayerToken(gasData.player_token);
            return;
          }
        } catch (e) {
          console.error("GAS send failed:", e);
        }
      }

      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // セッション確認中
  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {!showModal && (
        <div className="w-full">
          <div className="relative flex items-start mt-5">
            <div className="flex items-center h-5">
              <input
                id="agreement"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="focus:ring-sky-500 h-4 w-4 text-sky-600 bg-slate-800 border-slate-600 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreement" className="font-medium text-slate-300">
                I have read and agree to the{' '}
                <a href="/agreement" target="_blank" className="text-sky-400 hover:text-sky-500 underline">
                  Participant Agreement
                </a>.
              </label>
              <p className="text-slate-500">You must agree to the terms before logging in.</p>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleLogin}
              disabled={!agreed}
              className={`w-full flex justify-center items-center py-3 px-4 border rounded-md shadow-sm text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900 ${
                agreed
                  ? 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed bg-gray-300 border-gray-300 text-gray-600'
              }`}
            >
              <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.20455c0-.63864-.05727-1.25455-.16364-1.84091H9v3.48182h4.84409c-.20818 1.125-.84273 2.07818-1.79636 2.71818v2.25818h2.90864c1.70182-1.56636 2.68773-3.87455 2.68773-6.61728z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.46727-.80545 5.95636-2.18182l-2.90864-2.25818c-.80545.54273-1.84091.86182-3.04773.86182-2.34409 0-4.32818-1.58364-5.03591-3.71091H.957273v2.33181C2.45455 16.1577 5.48182 18 9 18z"/>
                <path fill="#FBBC05" d="M3.96409 10.71c-.18273-.54273-.28636-1.11636-.28636-1.71s.10364-1.16727.28636-1.71V4.95818H.957273C.347727 6.17545 0 7.54773 0 9s.347727 2.82455.957273 4.04182l3.00682-2.33182z"/>
                <path fill="#EA4335" d="M9 3.57955c1.32136 0 2.50773.45591 3.44045 1.34864l2.58136-2.58136C13.4636.891818 11.43 0 9 0 5.48182 0 2.45455 1.84227.957273 4.95818L3.96409 7.29C4.67182 5.16364 6.65591 3.57955 9 3.57955z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      )}

      {/* Player Token display — shown after successful registration */}
      {playerToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-400 text-xl">✓</span>
              <h3 className="text-xl font-bold text-white">Registration Complete!</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Your player token has been generated. Save it now — it's also in your confirmation email.
            </p>

            <div className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Your Player Token</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm bg-slate-900 text-sky-300 border border-slate-600 px-3 py-2.5 rounded-lg break-all select-all">
                  {playerToken}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(playerToken);
                    setTokenCopied(true);
                    setTimeout(() => setTokenCopied(false), 2000);
                  }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg border transition-colors ${
                    tokenCopied
                      ? 'bg-emerald-900/40 border-emerald-600 text-emerald-400'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-400'
                  }`}
                >
                  {tokenCopied ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg px-4 py-3 mb-6 mt-4">
              <p className="text-xs text-amber-300 leading-relaxed">
                <strong>Setup:</strong> Create <code className="bg-slate-900/60 px-1 rounded">player_secret.txt</code> in your aira repo root and add:<br />
                <code className="text-sky-300">PLAYER_TOKEN={playerToken}</code>
              </p>
              <p className="text-xs text-amber-400/70 mt-1.5">Never commit this file to GitHub. It's already in .gitignore.</p>
            </div>

            <button
              onClick={() => { window.location.href = "/dashboard"; }}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Continue to Dashboard →
            </button>

            <p className="text-xs text-slate-500 text-center mt-3">
              A copy of this token has been sent to your email.
            </p>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h3>
            <p className="text-slate-400 mb-6 text-sm">Please provide a display name for the leaderboard.</p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-300">Display Name</label>
                  <span className={`text-xs ${formData.displayName.length > 16 ? 'text-red-400' : 'text-slate-500'}`}>
                    {formData.displayName.length}/16
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={formData.displayName}
                  onChange={(e) => {
                    setFormData({...formData, displayName: e.target.value});
                    setNameError(validateDisplayName(e.target.value));
                  }}
                  className={`w-full bg-slate-900 border rounded-lg px-4 py-2 text-white focus:ring-2 focus:border-transparent outline-none ${nameError ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-sky-500'}`}
                  placeholder="Racer_Name_01"
                />
                {nameError ? (
                  <p className="mt-1 text-xs text-red-400">{nameError}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">Letters, numbers, underscores only (A–Z, 0–9, _). This becomes <code className="text-sky-400">NAME=</code> in your config.txt.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Country <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => {
                    setFormData({...formData, country: e.target.value});
                    if (e.target.value) setCountryError(null);
                  }}
                  className={`w-full bg-slate-900 border rounded-lg px-4 py-2 text-white focus:ring-2 focus:border-transparent outline-none ${countryError ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-sky-500'}`}
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
                {countryError
                  ? <p className="mt-1 text-xs text-red-400">{countryError}</p>
                  : <p className="mt-1 text-xs text-amber-400/80">* Required for prize money disbursement.</p>
                }
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>

              <p className="text-xs text-slate-500 text-center mt-4">
                By clicking Complete, you agree to the{' '}
                <a href="/agreement" className="text-sky-400 hover:underline" target="_blank">
                  Participant Agreement
                </a>.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
