import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query,
         where, deleteDoc, doc, updateDoc }
  from 'firebase/firestore';
import { db } from '../firebase';
import { SUBJECTS, NOTE_TYPES } from '../config';
import AdminUpload from './AdminUpload';

const DC = {
  Easy:'#10b981', Medium:'#f59e0b',
  Hard:'#f97316', 'Very Hard':'#ef4444'
};

export default function AdminNotes() {
  const [noteType, setNoteType] = useState('detailed');
  const [notes, setNotes] = useState([]);
  const [exSubject, setExSubject] = useState(null);
  const [exUnit, setExUnit] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const q = query(collection(db,'notes'),
      where('noteType','==',noteType));
    return onSnapshot(q, s =>
      setNotes(s.docs.map(d => ({ id:d.id, ...d.data() })))
    );
  }, [noteType]);

  const handleDelete = async id => {
    if (window.confirm('Delete this topic permanently?'))
      await deleteDoc(doc(db,'notes',id));
  };

  const handleToggle = async (id, current) => {
    await updateDoc(doc(db,'notes',id), {
      status: current === 'live' ? 'draft' : 'live'
    });
  };

  const sNotes = sid => notes.filter(n => n.subjectId === sid);
  const unitNames = sid => [...new Set(
    notes.filter(n => n.subjectId === sid).map(n => n.unitName)
  )];
  const uNotes = (sid, u) =>
    notes.filter(n => n.subjectId === sid && n.unitName === u);

  if (showUpload) return (
    <AdminUpload
      defaultType={noteType}
      onBack={() => setShowUpload(false)}
    />
  );

  return (
    <div style={{ padding: '30px', color: 'white',
      fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '22px',
          fontWeight: 800 }}>Manage Notes</h2>
        <button onClick={() => setShowUpload(true)} style={{
          padding: '10px 22px',
          background: 'linear-gradient(90deg,#f97316,#f59e0b)',
          border: 'none', color: 'white', borderRadius: '10px',
          cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>
          + Upload Topic
        </button>
      </div>

      {/* Note type tabs */}
      <div style={{ display: 'flex', gap: '8px',
        marginBottom: '24px' }}>
        {NOTE_TYPES.map(nt => (
          <button key={nt.id} onClick={() => setNoteType(nt.id)}
            style={{ padding: '8px 18px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              background: noteType === nt.id
                ? '#f97316' : 'rgba(255,255,255,0.05)',
              border: noteType === nt.id
                ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: noteType === nt.id ? 'white' : '#aaa' }}>
            {nt.label}
          </button>
        ))}
      </div>

      {/* Content tree */}
      {SUBJECTS.map(s => {
        const sn = sNotes(s.id);
        if (sn.length === 0) return null;
        return (
          <div key={s.id} style={{ marginBottom: '6px' }}>
            {/* Subject row */}
            <div onClick={() =>
                setExSubject(exSubject === s.id ? null : s.id)}
              style={{ background: '#1a1a2e',
                border: '1px solid #2a2a4e',
                borderRadius: '10px', padding: '13px 18px',
                cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>
                {s.icon} {s.name}
                <span style={{ color: '#888', fontSize: '12px',
                  fontWeight: 400, marginLeft: '10px' }}>
                  {sn.length} topics
                </span>
              </div>
              <span style={{ color: '#f97316' }}>
                {exSubject === s.id ? '▼' : '▶'}
              </span>
            </div>

            {/* Units */}
            {exSubject === s.id && unitNames(s.id).map(u => (
              <div key={u} style={{ marginLeft: '16px',
                marginTop: '3px' }}>
                <div onClick={() =>
                    setExUnit(exUnit === u ? null : u)}
                  style={{ background: 'rgba(26,26,46,0.7)',
                    borderLeft: '3px solid #f97316',
                    padding: '10px 14px', cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#ccc', fontSize: '13px' }}>
                  {u}
                  <span style={{ color: '#f97316' }}>
                    {exUnit === u ? '▼' : '▶'}
                  </span>
                </div>

                {/* Topics */}
                {exUnit === u && uNotes(s.id, u).map(n => (
                  <div key={n.id} style={{ marginLeft: '16px',
                    padding: '10px 14px',
                    background: 'rgba(10,10,10,0.6)',
                    borderBottom:
                      '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center' }}>
                    <div>
                      <span style={{ color: 'white',
                        fontSize: '13px' }}>{n.title}</span>
                      <span style={{ marginLeft: '8px',
                        color: DC[n.difficulty]||'#888',
                        fontSize: '11px' }}>
                        {n.difficulty}
                      </span>
                      <span style={{ marginLeft: '8px',
                        color: '#555', fontSize: '11px' }}>
                        {n.fileUrl ? '✅ PDF' : '⚠️ No PDF'}
                      </span>
                    </div>
                    <div style={{ display: 'flex',
                      gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px',
                        fontWeight: 600,
                        color: n.status==='live'
                          ? '#10b981':'#888' }}>
                        {n.status==='live' ? 'LIVE' : 'DRAFT'}
                      </span>
                      <button
                        onClick={() => handleToggle(n.id, n.status)}
                        style={{ padding: '3px 10px',
                          fontSize: '11px', cursor: 'pointer',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#aaa', borderRadius: '5px' }}>
                        Toggle
                      </button>
                      <button
                        onClick={() => handleDelete(n.id)}
                        style={{ padding: '3px 10px',
                          fontSize: '11px', cursor: 'pointer',
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          color: '#ef4444', borderRadius: '5px' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}