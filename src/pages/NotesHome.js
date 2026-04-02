import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, onSnapshot, query, 
         where, getDocs } from 'firebase/firestore';
import { NOTE_TYPES } from '../config';
import { getDueRevisions } from '../utils/spacedRepetition';

export default function NotesHome({ onSelectType, onOpenTopic }) {
  const user = auth.currentUser;
  const [dueCount, setDueCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [tab, setTab] = useState('home');
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    if (!user) return;
    getDueRevisions(user.uid).then(r => setDueCount(r.length));
    const q = query(
      collection(db, 'topicProgress'),
      where('userId', '==', user.uid),
      where('completed', '==', true)
    );
    const unsub = onSnapshot(q, s => setCompletedCount(s.size));
    const bq = query(
      collection(db, 'bookmarks'),
      where('userId', '==', user.uid)
    );
    const unsub2 = onSnapshot(bq, s => {
      setBookmarkCount(s.size);
      setBookmarks(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsub(); unsub2(); };
  }, [user]);

  const handleSearch = async (val) => {
    setSearch(val);
    if (val.length < 2) { setSearchResults([]); return; }
    const snap = await getDocs(collection(db, 'notes'));
    const results = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(n =>
        n.title?.toLowerCase().includes(val.toLowerCase()) ||
        n.subjectId?.toLowerCase().includes(val.toLowerCase()) ||
        n.unitName?.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 8);
    setSearchResults(results);
  };

  const stats = [
    { label: 'Topics Done', value: completedCount, color: '#10b981' },
    { label: 'Notes Streak', value: `${streak}d`, color: '#f97316' },
    { label: 'Due Today', value: dueCount, color: '#ef4444' },
    { label: 'Bookmarked', value: bookmarkCount, color: '#6366f1' },
  ];

  return (
    <div style={{ padding: '30px', color: 'white',
      fontFamily: "'Segoe UI',sans-serif", maxWidth: '1100px' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800 }}>
        📚 Notes Library
      </h2>
      <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px' }}>
        All MBBS subjects · 3 study formats · AI-powered revision
      </p>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <input
          placeholder="🔍 Search topics, subjects, units..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          style={{ width: '100%', padding: '12px 16px',
            background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', color: 'white', fontSize: '14px',
            outline: 'none', boxSizing: 'border-box' }}
        />
        {searchResults.length > 0 && (
          <div style={{ position: 'absolute', top: '110%', left: 0,
            right: 0, background: '#1a1a2e',
            border: '1px solid #2a2a4e', borderRadius: '10px',
            zIndex: 100, maxHeight: '280px', overflowY: 'auto' }}>
            {searchResults.map(r => (
              <div key={r.id} onClick={() => {
                  setSearch(''); setSearchResults([]);
                  onOpenTopic(r);
                }}
                style={{ padding: '12px 16px', cursor: 'pointer',
                  borderBottom: '1px solid #2a2a4e',
                  display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'white', fontSize: '14px' }}>
                  {r.title}
                </span>
                <span style={{ color: '#f97316', fontSize: '12px' }}>
                  {r.subjectId}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Due Alert */}
      {dueCount > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.1)',
          border: '1px solid #ef4444', borderRadius: '10px',
          padding: '12px 16px', marginBottom: '20px',
          color: '#ef4444', fontSize: '14px' }}>
          🔔 You have <b>{dueCount}</b> topic(s) due for revision today!
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(4,1fr)',
        gap: '15px', marginBottom: '28px' }}>
        {stats.map(c => (
          <div key={c.label} style={{ background: '#1a1a2e',
            border: `1px solid ${c.color}33`,
            borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ color: c.color, fontSize: '22px',
              fontWeight: 800 }}>{c.value}</div>
            <div style={{ color: '#888', fontSize: '12px',
              marginTop: '4px' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        {[
          { id: 'home', label: 'Study Formats' },
          { id: 'bookmarks', label: `Bookmarks (${bookmarkCount})` }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 20px', borderRadius: '20px', cursor: 'pointer',
            background: tab === t.id ? '#f97316' : 'rgba(255,255,255,0.05)',
            border: tab === t.id ? '1px solid #f97316'
              : '1px solid rgba(255,255,255,0.1)',
            color: tab === t.id ? 'white' : '#aaa',
            fontSize: '13px', fontWeight: 600 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Note type cards */}
      {tab === 'home' && (
        <div style={{ display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
          {NOTE_TYPES.map(nt => (
            <div key={nt.id} onClick={() => onSelectType(nt.id)}
              style={{ background: '#1a1a2e',
                border: '1px solid rgba(249,115,22,0.2)',
                borderRadius: '16px', padding: '28px',
                cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e =>
                e.currentTarget.style.borderColor = '#f97316'}
              onMouseOut={e =>
                e.currentTarget.style.borderColor =
                  'rgba(249,115,22,0.2)'}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>
                {nt.icon}
              </div>
              <h3 style={{ color: 'white', margin: '0 0 8px',
                fontSize: '17px' }}>{nt.label}</h3>
              <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
                {nt.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Bookmarks tab */}
      {tab === 'bookmarks' && (
        <div>
          {bookmarks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px',
              color: '#555' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                🔖
              </div>
              No bookmarks yet. Bookmark topics while reading!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column',
              gap: '10px' }}>
              {bookmarks.map(b => (
                <div key={b.id} onClick={() => onOpenTopic(b)}
                  style={{ background: '#1a1a2e',
                    border: '1px solid rgba(249,115,22,0.15)',
                    borderRadius: '12px', padding: '16px 20px',
                    cursor: 'pointer', display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700,
                      fontSize: '14px' }}>{b.title}</div>
                    <div style={{ color: '#888', fontSize: '12px',
                      marginTop: '3px' }}>{b.subjectId}</div>
                  </div>
                  <span style={{ color: '#f59e0b',
                    fontSize: '20px' }}>🔖</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}