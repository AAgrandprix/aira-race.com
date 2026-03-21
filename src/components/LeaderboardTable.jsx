import { useState, useEffect } from 'react';

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bgDeep:   '#080C14',
  bgPanel:  '#0D1420',
  bgBorder: '#1A2540',
  bgDim:    '#232B40',
  cyan:     '#00D4FF',
  cyanDim:  '#0088AA',
  cyanGlow: '#003344',
  amber:    '#FF8C00',
  textPri:  '#E8EEF8',
  textSec:  '#4A5878',
};

const FONT = "'Courier New', monospace";
const TROPHY = ['🥇', '🥈', '🥉'];

function parseTime(str) {
  if (!str) return Infinity;
  const parts = String(str).split(':');
  if (parts.length < 2) return Infinity;
  const [minSec, ms = '0'] = parts[1].split('.');
  return (parseInt(parts[0]) * 60 + parseInt(minSec)) * 1000 + parseInt(ms.padEnd(3, '0').slice(0, 3));
}

function formatDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw).slice(0, 10);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Tutorial table (newest first) ────────────────────────────────────────────
function TutorialTable({ rows }) {
  const sorted = [...rows].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return (
    <div style={{ border: `1px solid ${C.bgBorder}`, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: C.bgPanel }}>
        <thead>
          <tr style={{ background: C.bgBorder }}>
            {['#', 'Name', 'Time', 'Mode', 'Date'].map((label, i) => (
              <th key={label} style={{
                padding: '11px 16px',
                textAlign: i === 0 || i === 4 ? 'center' : 'left',
                fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: C.textSec, fontWeight: 'normal',
                borderBottom: `1px solid ${C.bgBorder}`,
              }}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr><td colSpan={5} style={{ padding: '56px 16px', textAlign: 'center', color: C.textSec, fontSize: 13 }}>No entries yet.</td></tr>
          )}
          {sorted.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? C.bgPanel : C.bgDeep, borderBottom: `1px solid ${C.bgBorder}` }}>
              <td style={{ padding: '14px 16px', textAlign: 'center', color: C.textSec, fontSize: 13 }}>{i + 1}</td>
              <td style={{ padding: '14px 16px', color: C.textPri, fontSize: 13 }}>{row.name}</td>
              <td style={{ padding: '14px 16px', color: C.cyan, letterSpacing: '0.08em', fontSize: 14 }}>{row.time}</td>
              <td style={{ padding: '14px 16px', color: C.amber, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{row.mode}</td>
              <td style={{ padding: '14px 16px', textAlign: 'center', color: C.textSec, fontSize: 12 }}>{formatDate(row.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Competition table (best per user, fastest first) ─────────────────────────
function CompetitionTable({ rows }) {
  const userMap = {};
  rows.forEach(row => {
    const ms = parseTime(row.time);
    if (!userMap[row.name]) {
      userMap[row.name] = { name: row.name, bestTime: row.time, bestMs: ms, mode: row.mode, entries: 0, lastSubmit: row.timestamp };
    }
    userMap[row.name].entries++;
    if (ms < userMap[row.name].bestMs) {
      userMap[row.name].bestMs = ms;
      userMap[row.name].bestTime = row.time;
      userMap[row.name].mode = row.mode;
    }
    if (!userMap[row.name].lastSubmit || row.timestamp > userMap[row.name].lastSubmit) {
      userMap[row.name].lastSubmit = row.timestamp;
    }
  });
  const sorted = Object.values(userMap).sort((a, b) => a.bestMs - b.bestMs);

  return (
    <div style={{ border: `1px solid ${C.bgBorder}`, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: C.bgPanel }}>
        <thead>
          <tr style={{ background: C.bgBorder }}>
            {['#', 'Name', 'Best Time', 'Mode', 'Entries', 'Last Submit'].map((label, i) => (
              <th key={label} style={{
                padding: '11px 16px',
                textAlign: i === 0 ? 'center' : i === 1 ? 'left' : 'center',
                fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: C.textSec, fontWeight: 'normal',
                borderBottom: `1px solid ${C.bgBorder}`,
              }}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr><td colSpan={6} style={{ padding: '56px 16px', textAlign: 'center', color: C.textSec, fontSize: 13 }}>No entries yet.</td></tr>
          )}
          {sorted.map((row, i) => {
            const isFirst = i === 0;
            return (
              <tr key={row.name} style={{ background: isFirst ? C.cyanGlow : i % 2 === 0 ? C.bgPanel : C.bgDeep, borderBottom: `1px solid ${C.bgBorder}` }}>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 17 }}>
                  {i < 3 ? TROPHY[i] : <span style={{ color: C.textSec, fontSize: 13 }}>{i + 1}</span>}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ color: isFirst ? C.cyan : C.textPri, fontWeight: isFirst ? 'bold' : 'normal', fontSize: 13 }}>{row.name}</span>
                  {isFirst && <span style={{ marginLeft: 8, fontSize: 10, color: C.cyanDim, letterSpacing: '0.1em' }}>◀ LEADER</span>}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: C.cyan, letterSpacing: '0.08em', fontSize: 14 }}>{row.bestTime}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: C.amber, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{row.mode}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: C.textSec, fontSize: 13 }}>{row.entries}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: C.textSec, fontSize: 12 }}>{formatDate(row.lastSubmit)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Loading / Error states ───────────────────────────────────────────────────
function LoadingRow() {
  return (
    <div style={{ fontFamily: FONT, color: C.textSec, textAlign: 'center', padding: '56px 0', fontSize: 12, letterSpacing: '0.1em' }}>
      LOADING...
    </div>
  );
}
function ErrorRow() {
  return (
    <div style={{ fontFamily: FONT, color: '#FF4444', textAlign: 'center', padding: '56px 0', fontSize: 12, letterSpacing: '0.1em' }}>
      FAILED TO LOAD DATA.
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
// Props:
//   raceId   — string: lock to this competition (used on /competitions/[id])
//   showTabs — boolean: show Tutorial + all competition tabs (used on /leaderboard)
//   (neither) — tutorial only (used on /getting-started)
export default function LeaderboardTable({ raceId, showTabs } = {}) {
  const apiUrl = import.meta.env.PUBLIC_GAS_API_URL;

  // Tab list (only used when showTabs=true)
  const [tabs, setTabs] = useState([{ id: null, label: 'Tutorial', type: null }]);
  const [activeId, setActiveId] = useState(raceId ?? null); // null = tutorial

  // Leaderboard rows for current view
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch competition list for tabs
  useEffect(() => {
    if (!showTabs || !apiUrl) return;
    fetch(`${apiUrl}?action=competitions`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        setTabs([
          { id: null, label: 'Tutorial', type: null },
          ...data.map(c => ({ id: c.ID, label: c.Title || c.ID, type: c.Type || null })),
        ]);
      })
      .catch(() => {});
  }, [showTabs, apiUrl]);

  // Fetch leaderboard rows when active tab changes
  useEffect(() => {
    if (!apiUrl) { setError(true); setLoading(false); return; }
    const sheetName = activeId ? `Results_${activeId}` : 'Tutorial_Leaderboard';
    setLoading(true);
    setError(false);
    fetch(`${apiUrl}?action=leaderboard&sheet=${encodeURIComponent(sheetName)}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setRows(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [activeId, apiUrl]);

  const isTutorial = !activeId;

  return (
    <div style={{ fontFamily: FONT, color: C.textPri }}>

      {/* Tabs — shown only on /leaderboard */}
      {showTabs && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, borderBottom: `1px solid ${C.bgBorder}`, marginBottom: 28 }}>
          {tabs.map(tab => {
            const active = activeId === tab.id;
            return (
              <button
                key={tab.id ?? 'tutorial'}
                onClick={() => setActiveId(tab.id)}
                style={{
                  background:   active ? C.bgPanel : 'transparent',
                  color:        active ? C.cyan    : C.textSec,
                  border:       `1px solid ${active ? C.bgBorder : 'transparent'}`,
                  borderBottom: active ? `1px solid ${C.bgPanel}` : `1px solid ${C.bgBorder}`,
                  padding:      '8px 20px',
                  cursor:       'pointer',
                  fontSize:     12,
                  letterSpacing:'0.06em',
                  textTransform:'uppercase',
                  marginBottom: -1,
                  transition:   'color 0.15s',
                }}
              >
                {tab.label}
                {tab.type && (
                  <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.5 }}>
                    {tab.type === 'Race' ? 'RACE' : 'TIME ATTACK'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Table */}
      {loading ? <LoadingRow /> : error ? <ErrorRow /> : (
        isTutorial
          ? <TutorialTable rows={rows} />
          : <CompetitionTable rows={rows} />
      )}

      {/* Footer note */}
      {!loading && !error && (
        <p style={{ marginTop: 12, fontSize: 10, color: C.textSec, letterSpacing: '0.06em' }}>
          {isTutorial
            ? '* ALL ENTRIES SHOWN — NEWEST FIRST. | SUBMITTED VIA AIRA BETA.'
            : '* BEST TIME PER USER IS SHOWN. | SUBMITTED VIA AIRA BETA.'}
        </p>
      )}
    </div>
  );
}
