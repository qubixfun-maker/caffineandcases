import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot }
  from 'firebase/firestore';
import { auth, db } from '../firebase';
import { SUBJECTS } from '../config';

export default function SubjectSelect({
  noteType, onSelectSubject, onBack
}) {
  const user = auth.currentUser;
  const [progress, setProgress] = useState({});
  const [yearFilter, setYearFilter] = useState('All');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'topicProgress'),
      where('userId', '==', user.uid),
      where('completed', '==', true)
    );
    return onSnapshot(q, snap => {
      const p = {};
      snap.docs.forEach(d => {
        const { subjectId } = d.data();
        p[subjectId] = (p[subjectId] || 0) + 1;
      });
      setProgress(p);
    });
  }, [user]);

  const years = ['All','1st Year','2nd Year','3rd Year','4th Year'];
  const filtered = SUBJECTS.filter(s =>
    yearFilter === 'All' || s.year === yearFilter
  );
  const pct = s =>
    Math.round(((progress[s.id] || 0) / s.topics) * 100);

  return (
    <div style={{ padding: '30px', color: 'white',
      fontFamily: "'Segoe UI',sans-serif" }}>
      <button onClick={onBack} style={{ background: 'rgba(249,115,22,0.1)',
        border: '1px solid #f97316', color: '#f97316',
        padding: '7px 18px', borderRadius: '8px',
        cursor: 'pointer', marginBottom: '20px', fontSize: '13px' }}>
        ← Back
      </button>
      <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800 }}>
        Select Subject
      </h2>
      <p style={{ color: '#888', marginBottom: '20px', fontSize: '13px' }}>
        {noteType === 'detailed' ? '📖 Detailed Notes'
          : noteType === 'rapid' ? '⚡ Rapid Revision'
          : '📝 PYQ with Answers'}
      </p>

      {/* Year filter */}
      <div style={{ display: 'flex', gap: '8px',
        flexWrap: 'wrap', marginBottom: '24px' }}>
        {years.map(y => (
          <button key={y} onClick={() => setYearFilter(y)} style={{
            padding: '5px 14px', borderRadius: '20px',
            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            background: yearFilter === y ? '#f97316'
              : 'rgba(255,255,255,0.05)',
            border: yearFilter === y ? '1px solid #f97316'
              : '1px solid rgba(255,255,255,0.1)',
            color: yearFilter === y ? 'white' : '#aaa' }}>
            {y}
          </button>
        ))}
      </div>

      {/* Subject grid */}
      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))',
        gap: '16px' }}>
        {filtered.map(s => {
          const p = pct(s);
          const mastered = p === 100;
          return (
            <div key={s.id} onClick={() => onSelectSubject(s)}
              style={{ background: '#1a1a2e',
                border: `1px solid ${mastered
                  ? '#f59e0b' : 'rgba(249,115,22,0.15)'}`,
                borderRadius: '14px', padding: '20px',
                cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e =>
                e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e =>
                e.currentTarget.style.transform = 'none'}>
              <div style={{ fontSize: '28px',
                marginBottom: '10px' }}>{s.icon}</div>
              {mastered && (
                <div style={{ background: '#f59e0b', color: '#000',
                  fontSize: '9px', fontWeight: 800,
                  padding: '2px 8px', borderRadius: '10px',
                  display: 'inline-block', marginBottom: '6px' }}>
                  ⭐ MASTERED
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: '14px',
                marginBottom: '3px' }}>{s.name}</div>
              <div style={{ color: '#888', fontSize: '11px',
                marginBottom: '10px' }}>
                {s.year} · {s.units} units · {s.topics} topics
              </div>
              <div style={{ background: '#333',
                borderRadius: '6px', height: '5px' }}>
                <div style={{ background: mastered
                    ? '#f59e0b' : '#f97316',
                  width: `${p}%`, height: '5px',
                  borderRadius: '6px', transition: 'width 0.5s' }} />
              </div>
              <div style={{ color: '#888', fontSize: '11px',
                marginTop: '5px', textAlign: 'right' }}>{p}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}