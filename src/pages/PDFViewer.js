import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { scheduleRevision, getNextRevisionDate }
  from '../utils/spacedRepetition';
import { generateTopicSummary } from '../utils/gemini';
import QuizModal from '../components/QuizModal';
import PDFRenderer from '../components/PDFRenderer';

export default function PDFViewer({ topic, onExit }) {
  const user = auth.currentUser;
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('ai');
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [annotation, setAnnotation] = useState('');
  const [annotTimer, setAnnotTimer] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [nextRevision, setNextRevision] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const saveTimer = useRef(null);
  const pid = `${user.uid}_${topic.id}`;

  useEffect(() => {
    getDoc(doc(db,'readingProgress',pid))
      .then(s => { if(s.exists()) setProgress(s.data().percent||0); });
    getDoc(doc(db,'annotations',pid))
      .then(s => { if(s.exists()) setAnnotation(s.data().text||''); });
    getDoc(doc(db,'bookmarks',pid))
      .then(s => setBookmarked(s.exists()));
    getDoc(doc(db,'topicProgress',pid))
      .then(s => setCompleted(s.exists() && s.data().completed));
    getNextRevisionDate(user.uid, topic.id)
      .then(d => setNextRevision(d||''));

    saveTimer.current = setInterval(() => {
      setProgress(p => {
        setDoc(doc(db,'readingProgress',pid), {
          userId: user.uid, noteId: topic.id,
          percent: p, updatedAt: new Date().toISOString()
        });
        return p;
      });
    }, 30000);
    return () => clearInterval(saveTimer.current);
  }, [topic.id, user.uid]);

  const saveProgress = val => {
    setProgress(val);
    setDoc(doc(db,'readingProgress',pid), {
      userId: user.uid, noteId: topic.id,
      percent: val, updatedAt: new Date().toISOString()
    });
  };

  const handleMarkDone = async () => {
    await setDoc(doc(db,'topicProgress',pid), {
      userId: user.uid, noteId: topic.id,
      subjectId: topic.subjectId, completed: true,
      completedAt: new Date().toISOString()
    });
    const next = await scheduleRevision(user.uid, topic.id);
    setNextRevision(next);
    setCompleted(true);
    saveProgress(100);
  };

  const handleBookmark = async () => {
    if (bookmarked) {
      setBookmarked(false);
    } else {
      await setDoc(doc(db,'bookmarks',pid), {
        userId: user.uid, noteId: topic.id,
        subjectId: topic.subjectId, title: topic.title,
        bookmarkedAt: new Date().toISOString()
      });
      setBookmarked(true);
    }
  };

  const handleAnnotation = val => {
    setAnnotation(val);
    if (annotTimer) clearTimeout(annotTimer);
    setAnnotTimer(setTimeout(() => {
      setDoc(doc(db,'annotations',pid), {
        userId: user.uid, noteId: topic.id,
        text: val, updatedAt: new Date().toISOString()
      });
    }, 2000));
  };

  const handleAI = async () => {
    setAiLoading(true);
    const txt = await generateTopicSummary(topic.title, topic.subjectId);
    setAiSummary(txt);
    setAiLoading(false);
  };

  const tabs = ['ai','info','notes','links'];

  return (
    <div style={{ position: 'fixed', inset: 0,
      background: '#0a0a0a', display: 'flex',
      flexDirection: 'column', zIndex: 1000,
      fontFamily: "'Segoe UI',sans-serif" }}>

      {/* Progress bar */}
      <div style={{ height: '3px', background: '#333' }}>
        <div style={{ background: '#f97316', height: '3px',
          width: `${progress}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Toolbar */}
      <div style={{ background: '#1a1a2e',
        borderBottom: '1px solid #2a2a4e',
        padding: '8px 16px', display: 'flex',
        alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
        <button onClick={onExit} style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid #ef4444', color: '#ef4444',
          padding: '6px 14px', borderRadius: '8px',
          cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
          ← Exit
        </button>
        <span style={{ color: 'white', fontWeight: 700,
          fontSize: '13px', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' }}>
          {topic.title}
        </span>
        <div style={{ display: 'flex', gap: '5px' }}>
          {[25,50,75,100].map(p => (
            <button key={p} onClick={() => saveProgress(p)} style={{
              padding: '4px 9px', borderRadius: '6px',
              cursor: 'pointer', fontSize: '11px',
              background: progress >= p
                ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${progress >= p
                ? '#f97316' : 'rgba(255,255,255,0.1)'}`,
              color: progress >= p ? '#f97316' : '#aaa' }}>
              {p}%
            </button>
          ))}
        </div>
        <button onClick={() => setShowQuiz(true)} style={{
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid #6366f1', color: '#6366f1',
          padding: '6px 12px', borderRadius: '8px',
          cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
          🧠 Quiz
        </button>
        <button onClick={handleBookmark} style={{
          background: bookmarked
            ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${bookmarked
            ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
          color: bookmarked ? '#f59e0b' : '#aaa',
          padding: '6px 12px', borderRadius: '8px',
          cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
          {bookmarked ? '🔖 Saved' : '🔖 Save'}
        </button>
        <button onClick={handleMarkDone} disabled={completed} style={{
          background: completed
            ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.4)',
          color: '#10b981', padding: '6px 12px',
          borderRadius: '8px',
          cursor: completed ? 'default' : 'pointer',
          fontSize: '12px', fontWeight: 600 }}>
          {completed ? '✓ Done' : '✓ Mark Done'}
        </button>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* PDF panel */}
        <div style={{ flex: 1, position: 'relative',
          overflow: 'hidden' }}>
          <PDFRenderer
            url={topic.fileUrl}
            userName={user?.displayName || 'Student'}
            userEmail={user?.email || ''}
          />
        </div>

        {/* Sidebar */}
        <div style={{ width: '300px', background: '#1a1a2e',
          borderLeft: '1px solid #2a2a4e',
          display: 'flex', flexDirection: 'column',
          flexShrink: 0 }}>
          {/* Tab buttons */}
          <div style={{ display: 'flex',
            borderBottom: '1px solid #2a2a4e' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                flex: 1, padding: '10px 4px',
                cursor: 'pointer', fontSize: '10px', fontWeight: 700,
                background: activeTab === t
                  ? 'rgba(249,115,22,0.1)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === t
                  ? '2px solid #f97316' : '2px solid transparent',
                color: activeTab === t ? '#f97316' : '#888',
                textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

            {/* AI Tab */}
            {activeTab === 'ai' && (
              <div>
                <button onClick={handleAI} disabled={aiLoading} style={{
                  width: '100%', padding: '10px',
                  background: 'linear-gradient(90deg,#f97316,#f59e0b)',
                  border: 'none', color: 'white', borderRadius: '8px',
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  fontSize: '13px', fontWeight: 700,
                  marginBottom: '12px' }}>
                  {aiLoading ? '⏳ Generating...'
                    : '✨ Generate AI Summary'}
                </button>
                {aiSummary && (
                  <div style={{ background: 'rgba(249,115,22,0.05)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    borderRadius: '8px', padding: '12px',
                    color: '#ccc', fontSize: '12px',
                    lineHeight: '1.7', whiteSpace: 'pre-wrap',
                    marginBottom: '12px' }}>
                    {aiSummary}
                  </div>
                )}
                {nextRevision && (
                  <div style={{ background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '8px', padding: '10px',
                    color: '#6366f1', fontSize: '12px',
                    marginBottom: '12px' }}>
                    📅 Next revision: <b>{nextRevision}</b>
                  </div>
                )}
                <div style={{ background: 'rgba(16,185,129,0.05)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '8px', padding: '12px' }}>
                  <div style={{ color: '#10b981', fontSize: '11px',
                    fontWeight: 700, marginBottom: '8px' }}>
                    📊 Exam Weightage
                  </div>
                  {[
                    ['NEET PG', topic.examWeightNEET],
                    ['AIIMS PG', topic.examWeightAIIMS],
                    ['INI-CET', topic.examWeightINICET],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '5px' }}>
                      <span style={{ color: '#888',
                        fontSize: '11px' }}>{label}</span>
                      <span style={{ color: 'white',
                        fontSize: '11px', fontWeight: 600 }}>
                        {val || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Tab */}
            {activeTab === 'info' && (
              <div>
                {[
                  ['Difficulty', topic.difficulty || 'N/A'],
                  ['Pages', topic.pages || 'N/A'],
                  ['MCQs Available', topic.mcqCount || '0'],
                  ['Last Updated',
                    topic.createdAt?.split('T')[0] || 'N/A'],
                  ['Tags',
                    (topic.tags||[]).join(', ') || 'None'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex',
                    justifyContent: 'space-between',
                    padding: '9px 0',
                    borderBottom: '1px solid #2a2a4e' }}>
                    <span style={{ color: '#888',
                      fontSize: '12px' }}>{label}</span>
                    <span style={{ color: 'white',
                      fontSize: '12px', fontWeight: 600,
                      maxWidth: '160px', textAlign: 'right' }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div>
                <p style={{ color: '#888', fontSize: '11px',
                  marginBottom: '8px' }}>
                  ✏️ Personal notes — auto-saved, only you can see
                </p>
                <textarea
                  value={annotation}
                  onChange={e => handleAnnotation(e.target.value)}
                  placeholder="Type your personal notes here..."
                  style={{ width: '100%', minHeight: '220px',
                    background: '#0a0a0a',
                    border: '1px solid #2a2a4e',
                    borderRadius: '8px', color: 'white',
                    padding: '10px', fontSize: '12px',
                    resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box', lineHeight: '1.6' }}
                />
                <p style={{ color: '#555', fontSize: '10px',
                  marginTop: '6px' }}>
                  Auto-saves 2 seconds after you stop typing
                </p>
              </div>
            )}

            {/* Links Tab */}
            {activeTab === 'links' && (
              <div>
                <p style={{ color: '#888', fontSize: '11px',
                  marginBottom: '12px' }}>
                  🔗 Related Topics
                </p>
                {(topic.relatedTopics||[]).length === 0 ? (
                  <p style={{ color: '#555', fontSize: '12px' }}>
                    No related topics added yet.
                  </p>
                ) : (
                  (topic.relatedTopics||[]).map((t, i) => (
                    <div key={i} style={{ padding: '10px 12px',
                      background: '#0a0a0a', borderRadius: '8px',
                      marginBottom: '6px', color: '#ccc',
                      fontSize: '12px', cursor: 'pointer',
                      border: '1px solid #2a2a4e' }}>
                      📌 {t}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showQuiz && (
        <QuizModal
          topic={topic}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </div>
  );
}
