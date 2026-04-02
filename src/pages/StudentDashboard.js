import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot, collection,
         query, where } from 'firebase/firestore';
import NotesHome from './NotesHome';
import SubjectSelect from './SubjectSelect';
import UnitTopics from './UnitTopics';
import PDFViewer from './PDFViewer';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Navigation state
  const [activePage, setActivePage] = useState('Home');
  const [notesView, setNotesView] = useState('home');
  const [selectedNoteType, setSelectedNoteType] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // User data
  const [userData, setUserData] = useState(null);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mcqsDone, setMcqsDone] = useState(0);
  const [notesRead, setNotesRead] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Load user profile
    getDoc(doc(db, 'users', user.uid)).then(s => {
      if (s.exists()) {
        setUserData(s.data());
        setXp(s.data().xp || 0);
        setStreak(s.data().streak || 0);
      }
    });

    // Live MCQ count
    const mq = query(
      collection(db, 'mcqAttempts'),
      where('userId', '==', user.uid)
    );
    const unsub1 = onSnapshot(mq, s => setMcqsDone(s.size));

    // Live notes read count
    const nq = query(
      collection(db, 'topicProgress'),
      where('userId', '==', user.uid),
      where('completed', '==', true)
    );
    const unsub2 = onSnapshot(nq, s => setNotesRead(s.size));

    // Due revisions
    const today = new Date().toISOString().split('T')[0];
    const rq = query(
      collection(db, 'revisionSchedule'),
      where('userId', '==', user.uid),
      where('nextRevision', '<=', today)
    );
    const unsub3 = onSnapshot(rq, s => setDueCount(s.size));

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const menuItems = [
    { icon: '🏠', label: 'Home' },
    { icon: '📚', label: 'Notes' },
    { icon: '🧠', label: 'Question Bank' },
    { icon: '🎮', label: 'Games' },
    { icon: '🤖', label: 'AI Tutor' },
    { icon: '🏆', label: 'Leaderboard' },
    { icon: '👤', label: 'Profile' },
  ];

  const levelName = () => {
    if (xp < 500) return 'Intern';
    if (xp < 1500) return 'House Officer';
    if (xp < 3000) return 'Resident';
    if (xp < 6000) return 'Registrar';
    if (xp < 10000) return 'Consultant';
    return 'Professor';
  };

  const xpToNext = () => {
    const levels = [500,1500,3000,6000,10000];
    const next = levels.find(l => l > xp) || 10000;
    const prev = levels[levels.indexOf(next) - 1] || 0;
    return Math.round(((xp - prev) / (next - prev)) * 100);
  };

  // ─── Notes routing ───────────────────────────
  const renderNotes = () => {
    if (notesView === 'viewer' && selectedTopic) {
      return (
        <PDFViewer
          topic={selectedTopic}
          onExit={() => setNotesView('units')}
        />
      );
    }
    if (notesView === 'units' && selectedSubject) {
      return (
        <UnitTopics
          subject={selectedSubject}
          noteType={selectedNoteType}
          onOpenTopic={t => {
            setSelectedTopic(t);
            setNotesView('viewer');
          }}
          onBack={() => setNotesView('subjects')}
        />
      );
    }
    if (notesView === 'subjects') {
      return (
        <SubjectSelect
          noteType={selectedNoteType}
          onSelectSubject={s => {
            setSelectedSubject(s);
            setNotesView('units');
          }}
          onBack={() => setNotesView('home')}
        />
      );
    }
    return (
      <NotesHome
        onSelectType={t => {
          setSelectedNoteType(t);
          setNotesView('subjects');
        }}
        onOpenTopic={t => {
          setSelectedTopic(t);
          setNotesView('viewer');
        }}
      />
    );
  };

  // ─── Home page content ───────────────────────
  const renderHome = () => (
    <div style={{ padding: '30px', maxWidth: '900px' }}>

      {/* Welcome bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap',
        gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800 }}>
            Hey {user?.displayName?.split(' ')[0]} 👋
          </h1>
          <p style={{ margin: '5px 0 0', color: '#888', fontSize: '14px' }}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'long'
            })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(249,115,22,0.15)',
            border: '1px solid rgba(249,115,22,0.3)',
            padding: '8px 16px', borderRadius: '20px',
            color: '#f97316', fontSize: '14px', fontWeight: 700 }}>
            ⚡ {xp} XP
          </div>
          <img
            src={user?.photoURL ||
              `https://ui-avatars.com/api/?name=${user?.displayName}&background=f97316&color=fff`}
            alt="profile"
            style={{ width: '44px', height: '44px', borderRadius: '50%',
              border: '2px solid #f97316' }}
          />
        </div>
      </div>

      {/* Due alert */}
      {dueCount > 0 && (
        <div onClick={() => {
            setActivePage('Notes');
            setNotesView('home');
          }}
          style={{ background: 'rgba(239,68,68,0.1)',
            border: '1px solid #ef4444', borderRadius: '12px',
            padding: '12px 18px', marginBottom: '24px',
            color: '#ef4444', fontSize: '14px', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center' }}>
          <span>🔔 You have <b>{dueCount}</b> revision(s) due today!</span>
          <span style={{ fontSize: '12px' }}>Go to Notes →</span>
        </div>
      )}

      {/* Stats cards */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
        gap: '16px', marginBottom: '28px' }}>
        {[
          { label: '🔥 Streak', value: `${streak} days`,
            color: '#f97316', sub: 'Keep it going!' },
          { label: '⚡ XP Points', value: xp,
            color: '#f59e0b', sub: levelName() },
          { label: '📚 Topics Done', value: notesRead,
            color: '#10b981', sub: 'Notes completed' },
          { label: '🧠 MCQs Done', value: mcqsDone,
            color: '#6366f1', sub: 'Questions attempted' },
        ].map(c => (
          <div key={c.label} style={{ background: '#1a1a2e',
            border: `1px solid ${c.color}33`,
            borderRadius: '14px', padding: '20px',
            textAlign: 'center' }}>
            <div style={{ color: c.color, fontSize: '26px',
              fontWeight: 800 }}>{c.value}</div>
            <div style={{ color: 'white', fontSize: '12px',
              fontWeight: 600, marginTop: '4px' }}>{c.label}</div>
            <div style={{ color: '#555', fontSize: '11px',
              marginTop: '2px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Level progress */}
      <div style={{ background: '#1a1a2e',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: '14px', padding: '20px',
        marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ color: '#f59e0b', fontWeight: 700,
            fontSize: '14px' }}>🎓 {levelName()}</span>
          <span style={{ color: '#888', fontSize: '12px' }}>
            {xpToNext()}% to next level
          </span>
        </div>
        <div style={{ background: '#333', borderRadius: '8px',
          height: '8px' }}>
          <div style={{ background:
              'linear-gradient(90deg,#f97316,#f59e0b)',
            width: `${xpToNext()}%`, height: '8px',
            borderRadius: '8px', transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Today's goals */}
      <div style={{ background: '#1a1a2e',
        border: '1px solid rgba(249,115,22,0.15)',
        borderRadius: '14px', padding: '22px',
        marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 18px', color: '#f97316',
          fontSize: '15px', fontWeight: 700 }}>
          📋 Today's Study Goal
        </h3>
        {[
          { label: 'MCQs', done: Math.min(mcqsDone, 20),
            target: 20, color: '#f97316' },
          { label: 'Topics', done: Math.min(notesRead, 2),
            target: 2, color: '#10b981' },
        ].map(g => {
          const pct = Math.round((g.done / g.target) * 100);
          return (
            <div key={g.label} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px' }}>
                <span style={{ color: '#ccc', fontSize: '13px' }}>
                  {g.label} ({g.done}/{g.target})
                </span>
                <span style={{ color: pct >= 100
                    ? '#10b981' : '#888', fontSize: '13px',
                  fontWeight: 600 }}>
                  {pct >= 100 ? '✅ Done!' : `${pct}%`}
                </span>
              </div>
              <div style={{ background: '#333',
                borderRadius: '8px', height: '8px' }}>
                <div style={{ background: g.color,
                  width: `${Math.min(pct, 100)}%`,
                  height: '8px', borderRadius: '8px',
                  transition: 'width 0.5s' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <h3 style={{ color: '#aaa', fontSize: '13px',
        fontWeight: 600, marginBottom: '12px',
        textTransform: 'uppercase', letterSpacing: '1px' }}>
        Quick Actions
      </h3>
      <div style={{ display: 'flex', gap: '12px',
        flexWrap: 'wrap' }}>
        {[
          { label: '📚 Read Notes', color: '#10b981',
            page: 'Notes' },
          { label: '🧠 Start MCQ', color: '#f97316',
            page: 'Question Bank' },
          { label: '🎮 Play Games', color: '#6366f1',
            page: 'Games' },
          { label: '🤖 Ask AI', color: '#3b82f6',
            page: 'AI Tutor' },
        ].map(btn => (
          <button key={btn.label}
            onClick={() => setActivePage(btn.page)}
            style={{ padding: '12px 22px',
              background: `${btn.color}18`,
              border: `1px solid ${btn.color}`,
              color: btn.color, borderRadius: '12px',
              cursor: 'pointer', fontSize: '14px',
              fontWeight: 600 }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Placeholder pages ───────────────────────
  const renderPlaceholder = label => (
    <div style={{ padding: '60px', textAlign: 'center',
      color: '#555' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>
        🚧
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700,
        color: '#888', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px' }}>Coming soon!</div>
    </div>
  );

  // ─── Main render ─────────────────────────────
  const renderPage = () => {
    switch (activePage) {
      case 'Home': return renderHome();
      case 'Notes': return renderNotes();
      case 'Question Bank': return renderPlaceholder('Question Bank');
      case 'Games': return renderPlaceholder('Games');
      case 'AI Tutor': return renderPlaceholder('AI Tutor');
      case 'Leaderboard': return renderPlaceholder('Leaderboard');
      case 'Profile': return renderPlaceholder('Profile');
      default: return renderHome();
    }
  };

  // If PDF viewer is open hide sidebar completely
  const isPDFOpen = activePage === 'Notes' &&
    notesView === 'viewer';

  if (isPDFOpen) {
    return (
      <div style={{ fontFamily: "'Segoe UI',sans-serif",
        background: '#0a0a0a', minHeight: '100vh' }}>
        {renderNotes()}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh',
      background: '#0a0a0a', color: 'white',
      fontFamily: "'Segoe UI',sans-serif" }}>

      {/* Sidebar */}
      <div style={{ width: '220px', background: '#1a1a2e',
        borderRight: '1px solid rgba(249,115,22,0.15)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', height: '100vh',
        overflowY: 'auto', zIndex: 100 }}>

        {/* Logo */}
        <div style={{ padding: '24px 16px 20px',
          borderBottom: '1px solid rgba(249,115,22,0.1)',
          textAlign: 'center' }}>
          <div style={{ fontSize: '26px',
            marginBottom: '4px' }}>☕</div>
          <div style={{ color: '#f97316', fontWeight: 800,
            fontSize: '13px', letterSpacing: '0.3px' }}>
            Caffeineandcases
          </div>
          <div style={{ color: '#555', fontSize: '10px',
            marginTop: '2px' }}>MBBS Platform</div>
        </div>

        {/* User pill */}
        <div style={{ margin: '14px 12px',
          background: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.15)',
          borderRadius: '10px', padding: '10px',
          display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={user?.photoURL ||
              `https://ui-avatars.com/api/?name=${user?.displayName}&background=f97316&color=fff`}
            alt="avatar"
            style={{ width: '32px', height: '32px',
              borderRadius: '50%' }}
          />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: 'white', fontSize: '12px',
              fontWeight: 700,
              overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' }}>
              {user?.displayName?.split(' ')[0]}
            </div>
            <div style={{ color: '#f59e0b', fontSize: '10px' }}>
              {levelName()}
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: '6px 10px' }}>
          {menuItems.map(item => (
            <div key={item.label}
              onClick={() => {
                setActivePage(item.label);
                if (item.label !== 'Notes')
                  setNotesView('home');
              }}
              style={{ padding: '11px 14px',
                borderRadius: '10px', cursor: 'pointer',
                marginBottom: '3px',
                display: 'flex', alignItems: 'center',
                gap: '10px', fontSize: '13px',
                fontWeight: activePage === item.label
                  ? 700 : 400,
                color: activePage === item.label
                  ? '#f97316' : '#aaa',
                background: activePage === item.label
                  ? 'rgba(249,115,22,0.1)' : 'transparent',
                border: activePage === item.label
                  ? '1px solid rgba(249,115,22,0.2)'
                  : '1px solid transparent',
                transition: 'all 0.15s' }}
              onMouseOver={e => {
                if (activePage !== item.label)
                  e.currentTarget.style.background =
                    'rgba(255,255,255,0.04)';
              }}
              onMouseOut={e => {
                if (activePage !== item.label)
                  e.currentTarget.style.background =
                    'transparent';
              }}>
              <span style={{ fontSize: '16px' }}>
                {item.icon}
              </span>
              {item.label}
              {item.label === 'Notes' && dueCount > 0 && (
                <span style={{ marginLeft: 'auto',
                  background: '#ef4444', color: 'white',
                  fontSize: '10px', fontWeight: 800,
                  padding: '1px 7px', borderRadius: '10px' }}>
                  {dueCount}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px' }}>
          <button onClick={handleLogout} style={{ width: '100%',
            padding: '10px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444', borderRadius: '10px',
            cursor: 'pointer', fontSize: '13px',
            fontWeight: 600 }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: '220px', flex: 1,
        minHeight: '100vh', overflowY: 'auto' }}>
        {renderPage()}
      </div>
    </div>
  );
}