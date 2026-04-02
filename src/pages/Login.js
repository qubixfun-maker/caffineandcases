
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, provider, db } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        navigate('/signup');
      } else {
        const data = userDoc.data();
        if (data.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: "'Segoe UI', sans-serif",
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(249,115,22,0.3)',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{fontSize:'32px', marginBottom:'12px'}}>☕</div>
        <h2 style={{color:'#f97316', margin:'0 0 8px', fontSize:'24px', fontWeight:'800'}}>
          Caffeine and Cases
        </h2>
        <p style={{color:'#888', fontSize:'14px', margin:'0 0 30px'}}>
          The #1 platform for MBBS students.
        </p>

        {error && (
          <div style={{
            background:'rgba(239,68,68,0.1)',
            border:'1px solid #ef4444',
            color:'#ef4444',
            padding:'10px',
            borderRadius:'8px',
            marginBottom:'15px',
            fontSize:'14px'
          }}>{error}</div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#555' : 'white',
            color: 'black',
            border: 'none',
            borderRadius: '10px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style={{width: '20px', height: '20px'}} />
          {loading ? 'Please wait...' : 'Sign in with Google'}
        </button>

        <p style={{color:'#555', fontSize:'11px', marginTop:'25px'}}>
          By signing in, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
