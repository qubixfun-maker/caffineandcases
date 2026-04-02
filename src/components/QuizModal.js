import React, { useState, useEffect } from 'react';
import { generateQuiz } from '../utils/gemini';

export default function QuizModal({ topic, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    setQuestions([]); setCurrent(0);
    setSelected(null); setScore(0); setFinished(false);
    try {
      const qs = await generateQuiz(topic.title, topic.subjectId);
      setQuestions(qs);
    } catch {
      setError('Failed to generate quiz. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [topic.id]);

  const handleSelect = idx => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[current].correctIndex)
      setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  };

  const q = questions[current];

  const optStyle = idx => {
    if (selected === null)
      return { bg: 'rgba(255,255,255,0.05)',
        border: 'rgba(255,255,255,0.1)', color: '#ccc' };
    if (idx === q?.correctIndex)
      return { bg: 'rgba(16,185,129,0.15)',
        border: '#10b981', color: '#10b981' };
    if (idx === selected)
      return { bg: 'rgba(239,68,68,0.15)',
        border: '#ef4444', color: '#ef4444' };
    return { bg: 'rgba(255,255,255,0.03)',
      border: 'rgba(255,255,255,0.06)', color: '#555' };
  };

  return (
    <div style={{ position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '20px' }}>
      <div style={{ background: '#1a1a2e',
        border: '1px solid rgba(249,115,22,0.3)',
        borderRadius: '16px', width: '100%', maxWidth: '560px',
        maxHeight: '90vh', overflowY: 'auto',
        padding: '28px', position: 'relative' }}>

        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '14px', right: '16px',
          background: 'transparent', border: 'none',
          color: '#888', fontSize: '22px', cursor: 'pointer',
          lineHeight: 1 }}>×</button>

        <h3 style={{ color: '#f97316', margin: '0 0 4px',
          fontSize: '16px', fontWeight: 800, paddingRight: '30px' }}>
          🧠 Quick Quiz
        </h3>
        <p style={{ color: '#888', fontSize: '12px',
          marginBottom: '20px' }}>{topic.title}</p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0',
            color: '#f97316' }}>
            ⏳ Generating AI questions...
          </div>
        )}

        {error && (
          <div style={{ color: '#ef4444', textAlign: 'center',
            padding: '20px 0' }}>
            {error}
            <br />
            <button onClick={load} style={{
              marginTop: '12px', padding: '8px 20px',
              background: 'rgba(249,115,22,0.1)',
              border: '1px solid #f97316', color: '#f97316',
              borderRadius: '8px', cursor: 'pointer',
              fontSize: '13px' }}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && !finished && q && (
          <div>
            {/* Progress */}
            <div style={{ display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px' }}>
              <span style={{ color: '#888', fontSize: '12px' }}>
                Question {current + 1} of {questions.length}
              </span>
              <span style={{ color: '#f97316', fontSize: '12px',
                fontWeight: 700 }}>
                {score} correct
              </span>
            </div>
            <div style={{ background: '#333', borderRadius: '4px',
              height: '4px', marginBottom: '20px' }}>
              <div style={{ background: '#f97316', height: '4px',
                borderRadius: '4px',
                width: `${((current + 1) / questions.length) * 100}%`,
                transition: 'width 0.3s' }} />
            </div>

            <p style={{ color: 'white', fontSize: '15px',
              fontWeight: 600, marginBottom: '18px',
              lineHeight: '1.5' }}>
              {q.question}
            </p>

            {q.options.map((opt, i) => {
              const c = optStyle(i);
              return (
                <div key={i} onClick={() => handleSelect(i)} style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.color, borderRadius: '10px',
                  padding: '12px 16px', marginBottom: '8px',
                  cursor: selected === null ? 'pointer' : 'default',
                  fontSize: '13px', transition: 'all 0.2s' }}>
                  {opt}
                </div>
              );
            })}

            {selected !== null && (
              <>
                <div style={{ marginTop: '14px',
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: '8px', padding: '12px',
                  color: '#a5b4fc', fontSize: '12px',
                  lineHeight: '1.6' }}>
                  💡 {q.explanation}
                </div>
                <button onClick={handleNext} style={{
                  marginTop: '14px', width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(90deg,#f97316,#f59e0b)',
                  border: 'none', color: 'white',
                  borderRadius: '10px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 700 }}>
                  {current < questions.length - 1
                    ? 'Next Question →' : 'See Results'}
                </button>
              </>
            )}
          </div>
        )}

        {!loading && finished && (
          <div style={{ textAlign: 'center', paddingTop: '10px' }}>
            <div style={{ fontSize: '52px', marginBottom: '12px' }}>
              {score === 5 ? '🏆' : score >= 3 ? '👍' : '📚'}
            </div>
            <h3 style={{ color: 'white', fontSize: '24px',
              fontWeight: 800, margin: '0 0 6px' }}>
              {score}/{questions.length}
            </h3>
            <p style={{ color: '#888', marginBottom: '24px',
              fontSize: '14px' }}>
              {score === 5 ? 'Perfect! You nailed it! 🎉'
                : score >= 3 ? 'Good job! Keep revising! 💪'
                : 'Keep practicing! You will get there! 📖'}
            </p>
            <div style={{ display: 'flex', gap: '12px',
              justifyContent: 'center' }}>
              <button onClick={load} style={{ padding: '11px 24px',
                background: 'rgba(249,115,22,0.15)',
                border: '1px solid #f97316', color: '#f97316',
                borderRadius: '10px', cursor: 'pointer',
                fontSize: '14px', fontWeight: 600 }}>
                🔄 Try Again
              </button>
              <button onClick={onClose} style={{
                padding: '11px 24px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#ccc', borderRadius: '10px',
                cursor: 'pointer', fontSize: '14px',
                fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}