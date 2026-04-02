import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SUBJECTS, NOTE_TYPES } from '../config';

const TAGS = ['High Yield','NEET PG','AIIMS','PYQ',
              'INI-CET','Rarely Asked','USMLE'];

export default function AdminUpload({ onBack, defaultType='detailed' }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    noteType: defaultType, subjectId: 'anatomy',
    unitName: '', title: '', difficulty: 'Medium',
    examWeightNEET: '', examWeightAIIMS: '',
    examWeightINICET: '', pages: '', mcqCount: '',
    tags: [], relatedTopics: '',
    fileUrl: '', audioUrl: '', status: 'live',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const upload = async (file) => {
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { storage } = await import('../firebase');

    const fileName = `notes/${Date.now()}_${file.name
      .replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, fileName);

    const metadata = {
      contentType: file.type || 'application/pdf',
      cacheControl: 'public,max-age=3600',
    };

    try {
      const snapshot = await uploadBytes(storageRef, file, metadata);
      setUploadPct(100);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (err) {
      console.error('Upload error details:', err.code, err.message);
      throw new Error(err.message);
    }
  };

  const handlePDF = async e => {
    const f = e.target.files[0];
    if (!f) return;
    setUploading(true);
    setUploadPct(0);
    setMsg('');
    try {
      const url = await upload(f);
      setForm(prev => ({ ...prev, fileUrl: url }));
      setMsg('✅ PDF uploaded successfully!');
    } catch (err) {
      setMsg(`❌ ${err.message}`);
      console.error(err);
    }
    setUploading(false);
  };

  const handleAudio = async e => {
    const f = e.target.files[0];
    if (!f) return;
    setUploading(true);
    setUploadPct(0);
    try {
      const url = await upload(f);
      setForm(prev => ({ ...prev, audioUrl: url }));
      setMsg('✅ Audio uploaded!');
    } catch (err) {
      setMsg(`❌ Audio upload failed: ${err}`);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.fileUrl) {
      setMsg('❌ Title and PDF are required!'); return;
    }
    setSaving(true);
    await addDoc(collection(db, 'notes'), {
      ...form,
      relatedTopics: form.relatedTopics
        .split(',').map(s => s.trim()).filter(Boolean),
      pages: parseInt(form.pages) || 0,
      mcqCount: parseInt(form.mcqCount) || 0,
      createdAt: new Date().toISOString(),
    });
    setMsg('✅ Topic published! Students can see it now.');
    setSaving(false);
    setStep(1);
    setForm(p => ({
      ...p, title:'', unitName:'', fileUrl:'', audioUrl:'',
      tags:[], relatedTopics:'', pages:'', mcqCount:''
    }));
    setUploadPct(0);
  };

  const inp = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px', color: 'white', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box', marginBottom: '12px'
  };

  return (
    <div style={{ padding: '30px', color: 'white',
      fontFamily: "'Segoe UI',sans-serif", maxWidth: '680px' }}>
      <button onClick={onBack} style={{
        background: 'rgba(249,115,22,0.1)',
        border: '1px solid #f97316', color: '#f97316',
        padding: '7px 18px', borderRadius: '8px',
        cursor: 'pointer', marginBottom: '20px',
        fontSize: '13px' }}>
        ← Back
      </button>
      <h2 style={{ margin: '0 0 6px', fontWeight: 800 }}>
        Upload New Topic
      </h2>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '28px' }}>
        {['Select','Details','Upload Files'].map((label, i) => (
          <div key={label} style={{ flex: 1, padding: '10px',
            textAlign: 'center',
            background: step === i+1
              ? 'rgba(249,115,22,0.1)' : 'transparent',
            borderBottom: `2px solid ${step === i+1
              ? '#f97316' : '#2a2a4e'}`,
            color: step === i+1 ? '#f97316' : '#888',
            fontSize: '12px', fontWeight: 600 }}>
            {i+1}. {label}
          </div>
        ))}
      </div>

      {/* Message */}
      {msg && (
        <div style={{
          background: msg.startsWith('✅')
            ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.startsWith('✅')
            ? '#10b981' : '#ef4444'}`,
          color: msg.startsWith('✅') ? '#10b981' : '#ef4444',
          padding: '10px 14px', borderRadius: '8px',
          marginBottom: '16px', fontSize: '13px' }}>
          {msg}
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <div>
          <label style={{ color:'#aaa', fontSize:'12px',
            display:'block', marginBottom:'5px' }}>
            Note Type
          </label>
          <select value={form.noteType}
            onChange={e => setForm(p =>
              ({ ...p, noteType: e.target.value }))}
            style={{ ...inp, cursor:'pointer' }}>
            {NOTE_TYPES.map(t => (
              <option key={t.id} value={t.id}
                style={{ background:'#1a1a2e' }}>
                {t.label}
              </option>
            ))}
          </select>

          <label style={{ color:'#aaa', fontSize:'12px',
            display:'block', marginBottom:'5px' }}>
            Subject
          </label>
          <select value={form.subjectId}
            onChange={e => setForm(p =>
              ({ ...p, subjectId: e.target.value }))}
            style={{ ...inp, cursor:'pointer' }}>
            {SUBJECTS.map(s => (
              <option key={s.id} value= {s.id}
                style={{ background:'#1a1a2e' }}>
                {s.name}
              </option>
            ))}
          </select>

          <label style={{ color:'#aaa', fontSize:'12px',
            display:'block', marginBottom:'5px' }}>
            Unit Name
          </label>
          <input
            placeholder="e.g. Unit 1 - Upper Limb"
            value={form.unitName}
            onChange={e => setForm(p =>
              ({ ...p, unitName: e.target.value }))}
            style={inp}
          />

          <label style={{ color:'#aaa', fontSize:'12px',
            display:'block', marginBottom:'5px' }}>
            Topic Title
          </label>
          <input
            placeholder="e.g. Brachial Plexus"
            value={form.title}
            onChange={e => setForm(p =>
              ({ ...p, title: e.target.value }))}
            style={inp}
          />

          <button
            onClick={() => setStep(2)}
            disabled={!form.unitName || !form.title}
            style={{ padding:'11px 28px',
              background: (!form.unitName || !form.title)
                ? '#333'
                : 'linear-gradient(90deg,#f97316,#f59e0b)',
              border:'none', color:'white', borderRadius:'10px',
              cursor: (!form.unitName || !form.title)
                ? 'not-allowed' : 'pointer',
              fontSize:'14px', fontWeight:700 }}>
            Next: Details →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <label style={{ color:'#aaa', fontSize:'12px',
            display:'block', marginBottom:'5px' }}>
            Difficulty
          </label>
          <select value={form.difficulty}
            onChange={e => setForm(p =>
              ({ ...p, difficulty: e.target.value }))}
            style={{ ...inp, cursor:'pointer' }}>
            {['Easy','Medium','Hard','Very Hard'].map(d => (
              <option key={d} value={d}
                style={{ background:'#1a1a2e' }}>{d}</option>
            ))}
          </select>

          <div style={{ display:'grid',
            gridTemplateColumns:'1fr 1fr 1fr',
            gap:'10px', marginBottom:'12px' }}>
            {[
              ['examWeightNEET','NEET PG'],
              ['examWeightAIIMS','AIIMS PG'],
              ['examWeightINICET','INI-CET'],
            ].map(([k, ph]) => (
              <div key={k}>
                <label style={{ color:'#aaa', fontSize:'11px',
                  display:'block', marginBottom:'4px' }}>
                  {ph}
                </label>
                <input placeholder="e.g. 4-5 Qs"
                  value={form[k]}
                  onChange={e => setForm(p =>
                    ({ ...p, [k]: e.target.value }))}
                  style={{ ...inp, marginBottom:0 }}
                />
              </div>
            ))}
          </div>

          <div style={{ display:'grid',
            gridTemplateColumns:'1fr 1fr',
            gap:'10px', marginBottom:'12px' }}>
            {[
              ['pages','Pages'],
              ['mcqCount','MCQ Count'],
            ].map(([k, ph]) => (
              <div key={k}>
                <label style={{ color:'#aaa', fontSize:'11px',
                  display:'block', marginBottom:'4px' }}>
                  {ph}
                </label>
                <input type="number" placeholder={ph}
                  value={form[k]}
                  onChange={e => setForm(p =>
                    ({ ...p, [k]: e.target.value }))}
                  style={{ ...inp, marginBottom:0 }}
                />
              </div>
            ))}
          </div>

          <label style={{ color:'#aaa', fontSize:'12px',
            display:'block', marginBottom:'8px' }}>
            Tags
          </label>
          <div style={{ display:'flex', gap:'8px',
            flexWrap:'wrap', marginBottom:'14px' }}>
            {TAGS.map(tag => {
              const sel = form.tags.includes(tag);
              return (
                <span key={tag}
                  onClick={() => setForm(p => ({
                    ...p, tags: sel
                      ? p.tags.filter(t => t !== tag)
                      : [...p.tags, tag]
                  }))}
                  style={{ padding:'5px 12px',
                    borderRadius:'20px', cursor:'pointer',
                    fontSize:'12px', fontWeight:600,
                    background: sel
                      ? 'rgba(249,115,22,0.2)'
                      : 'rgba(255,255,255,0.05)',
                    border:`1px solid ${sel
                      ? '#f97316' : 'rgba(255,255,255,0.1)'}`,
                    color: sel ? '#f97316' : '#888' }}>
                  {tag}
                </span>
              );
            })}
          </div>

          <label style={{ color:'#aaa', fontSize:'12px',
            display:'block', marginBottom:'5px' }}>
            Related Topics (comma separated)
          </label>
          <input
            placeholder="e.g. Lumbar Plexus, Radial Nerve"
            value={form.relatedTopics}
            onChange={e => setForm(p =>
              ({ ...p, relatedTopics: e.target.value }))}
            style={inp}
          />

          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={() => setStep(1)} style={{
              padding:'11px 24px',
              background:'rgba(255,255,255,0.05)',
              border:'1px solid rgba(255,255,255,0.1)',
              color:'#aaa', borderRadius:'10px',
              cursor:'pointer', fontSize:'14px' }}>
              ← Back
            </button>
            <button onClick={() => setStep(3)} style={{
              padding:'11px 28px',
              background:'linear-gradient(90deg,#f97316,#f59e0b)',
              border:'none', color:'white', borderRadius:'10px',
              cursor:'pointer', fontSize:'14px', fontWeight:700 }}>
              Next: Upload Files →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div>
          <div style={{ background:'#1a1a2e',
            border:'1px solid rgba(249,115,22,0.2)',
            borderRadius:'12px', padding:'20px',
            marginBottom:'14px' }}>
            <h4 style={{ color:'#f97316', margin:'0 0 12px' }}>
              📄 Upload PDF (required)
            </h4>
            <input type="file" accept=".pdf"
              onChange={handlePDF}
              style={{ color:'#ccc', fontSize:'13px',
                display:'block', marginBottom:'10px' }}
            />
            {uploading && (
              <div>
                <div style={{ background:'#333',
                  borderRadius:'6px', height:'8px',
                  marginBottom:'6px' }}>
                  <div style={{ background:'#f97316',
                    height:'8px', borderRadius:'6px',
                    width:`${uploadPct}%`,
                    transition:'width 0.2s' }} />
                </div>
                <span style={{ color:'#888',
                  fontSize:'12px' }}>{uploadPct}%</span>
              </div>
            )}
            {form.fileUrl && !uploading && (
              <div style={{ color:'#10b981', fontSize:'13px' }}>
                ✅ PDF uploaded and ready!
              </div>
            )}
          </div>

          <div style={{ background:'#1a1a2e',
            border:'1px solid #2a2a4e', borderRadius:'12px',
            padding:'20px', marginBottom:'20px' }}>
            <h4 style={{ color:'#888', margin:'0 0 12px' }}>
              🎵 Upload Audio (optional)
            </h4>
            <input type="file" accept=".mp3,audio/*"
              onChange={handleAudio}
              style={{ color:'#ccc', fontSize:'13px',
                display:'block' }}
            />
            {form.audioUrl && (
              <div style={{ color:'#10b981', fontSize:'13px',
                marginTop:'6px' }}>✅ Audio uploaded!</div>
            )}
          </div>

          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={() => setStep(2)} style={{
              padding:'11px 24px',
              background:'rgba(255,255,255,0.05)',
              border:'1px solid rgba(255,255,255,0.1)',
              color:'#aaa', borderRadius:'10px',
              cursor:'pointer', fontSize:'14px' }}>
              ← Back
            </button>
            <button onClick={handleSave}
              disabled={saving || uploading} style={{
                padding:'11px 28px',
                background: (saving || uploading)
                ? '#333'
                : 'linear-gradient(90deg,#f97316,#f59e0b)',
                border:'none', color:'white',
                borderRadius:'10px',
                cursor: (saving || uploading)
                ? 'not-allowed' : 'pointer',
                fontSize:'14px', fontWeight:700 }}>
              {saving ? 'Publishing...' : '🚀 Publish Topic'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
