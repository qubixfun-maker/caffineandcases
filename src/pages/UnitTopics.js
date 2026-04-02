import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot }
  from 'firebase/firestore';
import { auth, db } from '../firebase';

const DC = {
  Easy:'#10b981', Medium:'#f59e0b',
  Hard:'#f97316', 'Very Hard':'#ef4444'
};
const TC = {
  'High Yield':'#f97316','NEET PG':'#6366f1',
  PYQ:'#10b981', AIIMS:'#3b82f6'
};

export default function UnitTopics({
  subject, noteType, onOpenTopic, onBack
}) {
  const user = auth.currentUser;
  const [notes, setNotes] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [expanded, setExpanded] = useState({});
  const [diffFilter, setDiffFilter] = useState('All');

  useEffect(() => {
    const q = query(
      collection(db, 'notes'),
      where('subjectId', '==', subject.id),
      where('noteType', '==', noteType),
      where('status', '==', 'live')
    );
    return onSnapshot(q, s =>
      setNotes(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [subject, noteType]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'topicProgress'),
      where('userId', '==', user.uid),
      where('subjectId', '==', subject.id),
      where('completed', '==', true)
    );
    return onSnapshot(q, s =>
      setCompletedIds(new Set(s.docs.map(d => d.data().noteId)))
    );
  }, [user, subject]);

  const units = [...new Set(notes.map(n => n.unitName))].sort();
  const toggle = u =>
    setExpanded(p => ({ ...p, [u]: !p[u] }));
  const unitTopics = u => notes.filter(n =>
    n.unitName === u &&
    (diffFilter === 'All' || n.difficulty === diffFilter)
  );
  const unitDone = u => notes.filter(n =>
    n.unitName === u && completedIds.has(n.id)
  ).length;

  return (
    <div style={{ padding: '30px', color: 'white',
      fontFamily: "'Segoe UI',sans-serif" }}>
      <button onClick={onBack} style={{ background: 'rgba(249,115,22,0.1)',
        border: '1px solid #f97316', color: '#f97316',
        padding: '7px 18px', borderRadius: '8px',
        cursor: 'pointer', marginBottom: '16px', fontSize: '13px' }}>
        ← Back to Subjects
      </button>
      <h2 style={{ margin: '0 0 4px', fontWeight: 800 }}>
        {subject.icon} {subject.name}
      </h2>
      <p style={{ color: '#888', marginBottom: '20px', fontSize: '13px' }}>
        {notes.length} topics available
      </p>

      {/* Difficulty filter */}
      <div style={{ display: 'flex', gap: '8px',
        flexWrap: 'wrap', marginBottom: '20px' }}>
        {['All','Easy','Medium','Hard','Very Hard'].map(d => (
          <button key={d} onClick={() => setDiffFilter(d)} style={{
            padding: '5px 14px', borderRadius: '20px',
            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            background: diffFilter === d
              ? (DC[d] || '#f97316') : 'rgba(255,255,255,0.05)',
            border: `1px solid ${diffFilter === d
              ? (DC[d] || '#f97316') : 'rgba(255,255,255,0.1)'}`,
            color: diffFilter === d ? 'white' : '#aaa' }}>
            {d}
          </button>
        ))}
      </div>

      {notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px',
          color: '#555' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>
            📭
          </div>
          No topics uploaded yet for this subject.
        </div>
      ) : (
        units.map(u => {
          const topics = unitTopics(u);
          const total = notes.filter(n => n.unitName === u).length;
          const done = unitDone(u);
          const p = total ? Math.round((done / total) * 100) : 0;
          return (
            <div key={u} style={{ marginBottom: '10px' }}>
              {/* Unit header */}
              <div onClick={() => toggle(u)}
                style={{ background: '#1a1a2e',
                  border: '1px solid rgba(249,115,22,0.2)',
                  borderRadius: '12px', padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700,
                    fontSize: '15px' }}>{u}</div>
                  <div style={{ display: 'flex',
                    alignItems: 'center', gap: '10px',
                    marginTop: '6px' }}>
                    <div style={{ background: '#333',
                      borderRadius: '4px', height: '4px',
                      flex: 1, maxWidth: '150px' }}>
                      <div style={{ background: '#f97316',
                        width: `${p}%`, height: '4px',
                        borderRadius: '4px' }} />
                    </div>
                    <span style={{ color: '#888',
                      fontSize: '12px' }}>
                      {done}/{total} · {p}%
                    </span>
                  </div>
                </div>
                <span style={{ color: '#f97316',
                  fontSize: '18px', marginLeft: '10px' }}>
                  {expanded[u] ? '▼' : '▶'}
                </span>
              </div>

              {/* Topics */}
              {expanded[u] && topics.map(t => (
                <div key={t.id} onClick={() => onOpenTopic(t)}
                  style={{ background: 'rgba(26,26,46,0.6)',
                    borderLeft: `3px solid ${DC[t.difficulty]||'#888'}`,
                    padding: '12px 20px', cursor: 'pointer',
                    marginTop: '1px',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseOver={e =>
                    e.currentTarget.style.background =
                      'rgba(249,115,22,0.05)'}
                  onMouseOut={e =>
                    e.currentTarget.style.background =
                      'rgba(26,26,46,0.6)'}>
                  <div style={{ display: 'flex',
                    alignItems: 'center', gap: '10px', flex: 1,
                    flexWrap: 'wrap' }}>
                    <span style={{ color: DC[t.difficulty]||'#888',
                      fontSize: '10px' }}>●</span>
                    <span style={{ fontSize: '13px',
                      color: 'white', fontWeight: 500 }}>
                      {t.title}
                    </span>
                    {(t.tags||[]).map(tag => (
                      <span key={tag} style={{
                        background: `${TC[tag]||'#888'}22`,
                        color: TC[tag]||'#aaa',
                        padding: '1px 7px', borderRadius: '10px',
                        fontSize: '10px', fontWeight: 600 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex',
                    alignItems: 'center', gap: '10px',
                    flexShrink: 0 }}>
                    {t.examWeightNEET && (
                      <span style={{ color: '#6366f1',
                        fontSize: '11px',
                        background: 'rgba(99,102,241,0.1)',
                        padding: '2px 8px', borderRadius: '8px' }}>
                        {t.examWeightNEET}
                      </span>
                    )}
                    {completedIds.has(t.id) && (
                      <span style={{ color: '#10b981',
                        fontSize: '16px' }}>✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}