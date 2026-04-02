import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query,
         where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import AdminNotes from './AdminNotes';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [activePage, setActivePage] = useState('Overview');

  // Stats
  const [allUsers, setAllUsers] = useState([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [totalMCQs, setTotalMCQs] = useState(0);

  // User management
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'users'), s =>
      setAllUsers(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsub2 = onSnapshot(
      query(collection(db, 'notes'), where('status','==','live')),
      s => setTotalNotes(s.size)
    );
    const unsub3 = onSnapshot(
      collection(db, 'qbank'),
      s => setTotalMCQs(s.size)
    );
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const students = allUsers.filter(u => u.role === 'student');
  const premiumCount = students.filter(u => u.plan === 'premium').length;

  const filteredUsers = allUsers
    .filter(u => {
      const matchSearch =
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.college?.toLowerCase().includes(userSearch.toLowerCase());
      const matchFilter =
        userFilter === 'all' ? true :
        userFilter === 'premium' ? u.plan === 'premium' :
        userFilter === 'free' ? u.plan !== 'premium' :
        userFilter === 'admin' ? u.role === 'admin' :
        true;
      return matchSearch && matchFilter;
    })
    .sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

  const handleGrantPremium = async (uid) => {
    await updateDoc(doc(db, 'users', uid), { plan: 'premium' });
  };

  const handleRevokePremium = async (uid) => {
    await updateDoc(doc(db, 'users', uid), { plan: 'free' });
  };

  const handleMakeAdmin = async (uid) => {
    if (window.confirm('Make this user an admin?'))
      await updateDoc(doc(db, 'users', uid), { role: 'admin' });
  };

  const handleBan = async (uid) => {
    if (window.confirm('Ban this user? They will not be able to login.'))
      await updateDoc(doc(db, 'users', uid), { banned: true });
  };

  const menuItems = [
    { icon: '📊', label: 'Overview' },
    { icon: '👥', label: 'Students' },
    { icon: '📚', label: 'Notes' },
    { icon: '🧠', label: 'Question Bank' },
    { icon: '🎬', label: 'Videos' },
    { icon: '📋', label: 'Surveys' },
    { icon: '🔗', label: 'Affiliates' },
    { icon: '⚙️', label: 'Settings' },
  ];

  // ─── Overview ────────────────────────────────
  const renderOverview = () => (
    <div style={{ padding: '30px', maxWidth: '1000px' }}>
      <h2 style={{ margin: '0 0 6px', fontSize: '24px',
        fontWeight: 800 }}>Platform Overview</h2>
      <p style={{ color: '#888', marginBottom: '28px',
        fontSize: '14px' }}>Live stats — updates in real time</p>

      {/* Stat cards */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
        gap: '18px', marginBottom: '32px' }}>
        {[
          { label: 'Total Students', value: students.length,
            icon: '👥', color: '#6366f1', sub: 'Registered' },
          { label: 'Premium Users', value: premiumCount,
            icon: '⭐', color: '#f59e0b',
            sub: `₹${premiumCount * 49}/month` },
          { label: 'Notes Published', value: totalNotes,
            icon: '📚', color: '#f97316', sub: 'Live topics' },
          { label: 'MCQs in Bank', value: totalMCQs,
            icon: '🧠', color: '#10b981', sub: 'Questions' },
        ].map(c => (
          <div key={c.label} style={{ background: '#1a1a2e',
            border: `1px solid ${c.color}33`,
            borderRadius: '16px', padding: '22px',
            cursor: 'pointer' }}
            onClick={() => c.label.includes('Student') &&
              setActivePage('Students')}>
            <div style={{ fontSize: '30px',
              marginBottom: '10px' }}>{c.icon}</div>
            <div style={{ color: c.color, fontSize: '32px',
              fontWeight: 800 }}>{c.value}</div>
            <div style={{ color: 'white', fontSize: '13px',
              fontWeight: 600, marginTop: '6px' }}>{c.label}</div>
            <div style={{ color: '#555', fontSize: '11px',
              marginTop: '2px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue */}
      <div style={{ background: '#1a1a2e',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: '16px', padding: '22px',
        marginBottom: '28px' }}>
        <h3 style={{ color: '#10b981', margin: '0 0 16px',
          fontSize: '15px', fontWeight: 700 }}>
          💰 Revenue Estimate
        </h3>
        <div style={{ display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
          {[
            { label: 'Free Users',
              value: students.length - premiumCount,
              note: '₹0/month' },
            { label: 'Premium Users', value: premiumCount,
              note: `₹${premiumCount * 49}/month` },
            { label: 'Monthly Revenue',
              value: `₹${premiumCount * 49}`,
              note: 'Founder pricing ₹49' },
          ].map(r => (
            <div key={r.label} style={{ textAlign: 'center',
              padding: '14px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px' }}>
              <div style={{ color: '#10b981', fontSize: '22px',
                fontWeight: 800 }}>{r.value}</div>
              <div style={{ color: 'white', fontSize: '12px',
                fontWeight: 600, marginTop: '4px' }}>
                {r.label}
              </div>
              <div style={{ color: '#555', fontSize: '11px',
                marginTop: '2px' }}>{r.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent signups */}
      <div style={{ background: '#1a1a2e',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', padding: '22px' }}>
        <div style={{ display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ color: '#f97316', margin: 0,
            fontSize: '15px', fontWeight: 700 }}>
            🆕 Recent Signups
          </h3>
          <button onClick={() => setActivePage('Students')}
            style={{ background: 'rgba(249,115,22,0.1)',
              border: '1px solid rgba(249,115,22,0.3)',
              color: '#f97316', padding: '5px 14px',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '12px' }}>
            View All →
          </button>
        </div>
        {allUsers
          .filter(u => u.role === 'student')
          .sort((a,b) =>
            new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(s => (
            <div key={s.id} style={{ display: 'flex',
              alignItems: 'center', gap: '12px',
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <img
                src={s.photo ||
                  `https://ui-avatars.com/api/?name=${s.name}&background=f97316&color=fff&size=32`}
                alt=""
                style={{ width: '32px', height: '32px',
                  borderRadius: '50%' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontSize: '13px',
                  fontWeight: 600 }}>{s.name || 'Unknown'}</div>
                <div style={{ color: '#555', fontSize: '11px' }}>
                  {s.college || 'No college'} · {s.year || ''}
                </div>
              </div>
              <span style={{
                background: s.plan === 'premium'
                  ? 'rgba(245,158,11,0.15)'
                  : 'rgba(255,255,255,0.05)',
                color: s.plan === 'premium'
                  ? '#f59e0b' : '#888',
                padding: '3px 10px', borderRadius: '20px',
                fontSize: '11px', fontWeight: 700 }}>
                {s.plan === 'premium' ? '⭐ Premium' : 'Free'}
              </span>
            </div>
          ))}
      </div>
    </div>
  );

  // ─── User detail modal ────────────────────────
  const renderUserModal = () => {
    if (!selectedUser) return null;
    const u = selectedUser;
    return (
      <div style={{ position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 2000,
        padding: '20px' }}>
        <div style={{ background: '#1a1a2e',
          border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: '16px', width: '100%',
          maxWidth: '500px', padding: '28px',
          position: 'relative' }}>
          <button onClick={() => setSelectedUser(null)}
            style={{ position: 'absolute', top: '14px',
              right: '16px', background: 'transparent',
              border: 'none', color: '#888', fontSize: '22px',
              cursor: 'pointer' }}>×</button>

          {/* User header */}
          <div style={{ display: 'flex', gap: '14px',
            alignItems: 'center', marginBottom: '24px' }}>
            <img
              src={u.photo ||
                `https://ui-avatars.com/api/?name=${u.name}&background=f97316&color=fff&size=60`}
              alt=""
              style={{ width: '60px', height: '60px',
                borderRadius: '50%',
                border: '2px solid #f97316' }}
            />
            <div>
              <div style={{ color: 'white', fontSize: '18px',
                fontWeight: 800 }}>{u.name || 'Unknown'}</div>
              <div style={{ color: '#888',
                fontSize: '13px' }}>{u.email}</div>
              <div style={{ display: 'flex', gap: '6px',
                marginTop: '6px' }}>
                <span style={{
                  background: u.plan === 'premium'
                    ? 'rgba(245,158,11,0.2)'
                    : 'rgba(255,255,255,0.07)',
                  color: u.plan === 'premium'
                    ? '#f59e0b' : '#888',
                  padding: '2px 10px', borderRadius: '20px',
                  fontSize: '11px', fontWeight: 700 }}>
                  {u.plan === 'premium' ? '⭐ Premium' : 'Free'}
                </span>
                <span style={{
                  background: u.role === 'admin'
                    ? 'rgba(239,68,68,0.15)'
                    : 'rgba(99,102,241,0.15)',
                  color: u.role === 'admin'
                    ? '#ef4444' : '#6366f1',
                  padding: '2px 10px', borderRadius: '20px',
                  fontSize: '11px', fontWeight: 700 }}>
                  {u.role === 'admin' ? '🔑 Admin' : '👤 Student'}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div style={{ marginBottom: '24px' }}>
            {[
              ['College', u.college || '—'],
              ['Year', u.year || '—'],
              ['Mobile', u.mobile || '—'],
              ['XP', u.xp || 0],
              ['Streak', `${u.streak || 0} days`],
              ['Joined', u.createdAt
                ? new Date(u.createdAt)
                    .toLocaleDateString('en-IN')
                : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #2a2a4e' }}>
                <span style={{ color: '#888',
                  fontSize: '13px' }}>{label}</span>
                <span style={{ color: 'white',
                  fontSize: '13px', fontWeight: 600 }}>
                  {val}
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px' }}>
            {u.plan !== 'premium' ? (
              <button
                onClick={() => {
                  handleGrantPremium(u.id);
                  setSelectedUser({ ...u, plan: 'premium' });
                }}
                style={{ padding: '10px',
                  background: 'rgba(245,158,11,0.15)',
                  border: '1px solid #f59e0b',
                  color: '#f59e0b', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '13px',
                  fontWeight: 600 }}>
                ⭐ Grant Premium
              </button>
            ) : (
              <button
                onClick={() => {
                  handleRevokePremium(u.id);
                  setSelectedUser({ ...u, plan: 'free' });
                }}
                style={{ padding: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#aaa', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '13px',
                  fontWeight: 600 }}>
                Revoke Premium
              </button>
            )}
            {u.role !== 'admin' && (
              <button
                onClick={() => {
                  handleMakeAdmin(u.id);
                  setSelectedUser({ ...u, role: 'admin' });
                }}
                style={{ padding: '10px',
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid #6366f1',
                  color: '#6366f1', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '13px',
                  fontWeight: 600 }}>
                🔑 Make Admin
              </button>
            )}
            <button
              onClick={() => handleBan(u.id)}
              style={{ padding: '10px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', borderRadius: '10px',
                cursor: 'pointer', fontSize: '13px',
                fontWeight: 600 }}>
              🚫 Ban User
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Students page ────────────────────────────
  const renderStudents = () => (
    <div style={{ padding: '30px', maxWidth: '1100px' }}>
      <h2 style={{ margin: '0 0 6px', fontSize: '22px',
        fontWeight: 800 }}>All Users</h2>
      <p style={{ color: '#888', marginBottom: '20px',
        fontSize: '14px' }}>
        {allUsers.length} total · {students.length} students ·{' '}
        {premiumCount} premium
      </p>

      {/* Search and filter */}
      <div style={{ display: 'flex', gap: '12px',
        marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Search by name, email or college..."
          value={userSearch}
          onChange={e => setUserSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px',
            padding: '10px 16px', background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', color: 'white',
            fontSize: '14px', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: `All (${allUsers.length})` },
            { id: 'premium',
              label: `Premium (${premiumCount})` },
            { id: 'free',
              label: `Free (${students.length - premiumCount})` },
            { id: 'admin',
              label: `Admins (${allUsers.filter(u =>
                u.role === 'admin').length})` },
          ].map(f => (
            <button key={f.id}
              onClick={() => setUserFilter(f.id)}
              style={{ padding: '8px 14px',
                borderRadius: '8px', cursor: 'pointer',
                fontSize: '12px', fontWeight: 600,
                background: userFilter === f.id
                  ? '#f97316'
                  : 'rgba(255,255,255,0.05)',
                border: userFilter === f.id
                  ? 'none'
                  : '1px solid rgba(255,255,255,0.1)',
                color: userFilter === f.id
                  ? 'white' : '#aaa',
                whiteSpace: 'nowrap' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div style={{ display: 'grid',
        gridTemplateColumns: '2.5fr 2fr 1fr 1fr 1fr 80px',
        gap: '10px', padding: '8px 14px',
        borderBottom: '1px solid #2a2a4e',
        marginBottom: '4px' }}>
        {['Name / Email','College','Year',
          'Plan','Joined',''].map(h => (
          <span key={h} style={{ color: '#555',
            fontSize: '11px', fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px' }}>{h}</span>
        ))}
      </div>

      {/* User rows */}
      {filteredUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px',
          color: '#555' }}>No users found</div>
      ) : (
        filteredUsers.map(u => (
          <div key={u.id} style={{ display: 'grid',
            gridTemplateColumns: '2.5fr 2fr 1fr 1fr 1fr 80px',
            gap: '10px', padding: '12px 14px',
            background: '#1a1a2e', marginBottom: '3px',
            borderRadius: '10px', alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.04)' }}>

            {/* Name + email */}
            <div style={{ display: 'flex',
              alignItems: 'center', gap: '10px' }}>
              <img
                src={u.photo ||
                  `https://ui-avatars.com/api/?name=${u.name}&background=f97316&color=fff&size=36`}
                alt=""
                style={{ width: '36px', height: '36px',
                  borderRadius: '50%', flexShrink: 0 }}
              />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ color: 'white', fontSize: '13px',
                  fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' }}>
                  {u.name || 'Unknown'}
                  {u.role === 'admin' && (
                    <span style={{ marginLeft: '6px',
                      background: 'rgba(239,68,68,0.2)',
                      color: '#ef4444', fontSize: '9px',
                      padding: '1px 6px', borderRadius: '6px',
                      fontWeight: 800 }}>
                      ADMIN
                    </span>
                  )}
                </div>
                <div style={{ color: '#555', fontSize: '11px',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' }}>
                  {u.email}
                </div>
              </div>
            </div>

            {/* College */}
            <span style={{ color: '#888', fontSize: '12px',
              overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' }}>
              {u.college || '—'}
            </span>

            {/* Year */}
            <span style={{ color: '#888',
              fontSize: '12px' }}>
              {u.year || '—'}
            </span>

            {/* Plan badge */}
            <span style={{
              background: u.plan === 'premium'
                ? 'rgba(245,158,11,0.15)'
                : 'rgba(255,255,255,0.05)',
              color: u.plan === 'premium'
                ? '#f59e0b' : '#888',
              padding: '4px 10px', borderRadius: '20px',
              fontSize: '11px', fontWeight: 700,
              display: 'inline-block' }}>
              {u.plan === 'premium' ? '⭐ Premium' : 'Free'}
            </span>

            {/* Joined date */}
            <span style={{ color: '#555', fontSize: '11px' }}>
              {u.createdAt
                ? new Date(u.createdAt)
                    .toLocaleDateString('en-IN')
                : '—'}
            </span>

            {/* View button */}
            <button onClick={() => setSelectedUser(u)}
              style={{ padding: '6px 12px',
                background: 'rgba(249,115,22,0.1)',
                border: '1px solid rgba(249,115,22,0.3)',
                color: '#f97316', borderRadius: '8px',
                cursor: 'pointer', fontSize: '12px',
                fontWeight: 600 }}>
              View
            </button>
          </div>
        ))
      )}
    </div>
  );

  // ─── Placeholder ──────────────────────────────
  const renderPlaceholder = label => (
    <div style={{ padding: '60px', textAlign: 'center',
      color: '#555' }}>
      <div style={{ fontSize: '48px',
        marginBottom: '16px' }}>🚧</div>
      <div style={{ fontSize: '20px', fontWeight: 700,
        color: '#888', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '14px' }}>Coming soon!</div>
    </div>
  );

  // ─── Router ───────────────────────────────────
  const renderPage = () => {
    switch (activePage) {
      case 'Overview': return renderOverview();
      case 'Students': return renderStudents();
      case 'Notes': return <AdminNotes />;
      case 'Question Bank':
        return renderPlaceholder('Question Bank Manager');
      case 'Videos':
        return renderPlaceholder('Video Manager');
      case 'Surveys':
        return renderPlaceholder('Survey Manager');
      case 'Affiliates':
        return renderPlaceholder('Affiliate Manager');
      case 'Settings':
        return renderPlaceholder('Settings');
      default: return renderOverview();
    }
  };

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
            fontSize: '13px' }}>Caffeineandcases</div>
          <div style={{ background: 'rgba(239,68,68,0.15)',
            color: '#ef4444', fontSize: '10px', fontWeight: 700,
            padding: '2px 10px', borderRadius: '10px',
            display: 'inline-block', marginTop: '4px' }}>
            ADMIN PANEL
          </div>
        </div>

        {/* Admin info */}
        <div style={{ margin: '14px 12px',
          background: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.15)',
          borderRadius: '10px', padding: '10px',
          display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={user?.photoURL ||
              `https://ui-avatars.com/api/?name=${user?.displayName}&background=f97316&color=fff`}
            alt=""
            style={{ width: '32px', height: '32px',
              borderRadius: '50%' }}
          />
          <div>
            <div style={{ color: 'white', fontSize: '12px',
              fontWeight: 700 }}>
              {user?.displayName?.split(' ')[0]}
            </div>
            <div style={{ color: '#10b981',
              fontSize: '10px' }}>Super Admin</div>
          </div>
        </div>

        {/* Quick stats pills */}
        <div style={{ margin: '0 12px 12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {[
            { label: 'Students', value: students.length,
              color: '#6366f1' },
            { label: 'Premium', value: premiumCount,
              color: '#f59e0b' },
            { label: 'Notes', value: totalNotes,
              color: '#f97316' },
            { label: 'MCQs', value: totalMCQs,
              color: '#10b981' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0a0a0a',
              borderRadius: '8px', padding: '8px',
              textAlign: 'center' }}>
              <div style={{ color: s.color, fontSize: '18px',
                fontWeight: 800 }}>{s.value}</div>
              <div style={{ color: '#555',
                fontSize: '10px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 10px' }}>
          {menuItems.map(item => (
            <div key={item.label}
              onClick={() => setActivePage(item.label)}
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
              {item.label === 'Students' && (
                <span style={{ marginLeft: 'auto',
                  background: '#6366f1', color: 'white',
                  fontSize: '10px', fontWeight: 800,
                  padding: '1px 7px',
                  borderRadius: '10px' }}>
                  {students.length}
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

      {/* User detail modal */}
      {renderUserModal()}
    </div>
  );
}