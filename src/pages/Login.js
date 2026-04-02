import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, provider, db } from '../firebase';

function Login() {
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
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(249,115,22,0.3)',
        borderRadius: '20px',
        padding: '50px 40px',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Logo */}
        <div style={{fontSize:'40px', marginBottom:'10px'}}>☕</div>
        <h1 style={{
          color: '#f97316',
          fontSize: '28px',
          fontWeight: '800',
          margin: '0 0 5px 0',
          letterSpacing: '-1px'
        }}>
          Caffeineandcases
        </h1>
        <p style={{color:'#888', fontSize:'14px', margin:'0 0 8px 0'}}>
          Study smarter. Score higher.
        </p>

        {/* Founder Badge */}
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(90deg, #f97316, #f59e0b)',
          color: 'white',
          fontSize: '12px',
          fontWeight: '700',
          padding: '4px 14px',
          borderRadius: '20px',
          marginBottom: '35px'
        }}>
          🎉 Founder Pricing: ₹49/month — Limited slots!
        </div>

        {/* Features */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginBottom: '35px'
        }}>
          {['📚 Notes', '🧠 MCQs', '🎮 Games', '🤖 AI Tutor'].map(f => (
            <div key={f} style={{color:'#aaa', fontSize:'12px'}}>{f}</div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>{error}</div>
        )}

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#333' : 'white',
            color: '#333',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s'
          }}
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            style={{width:'20px', height:'20px'}}
          />
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <p style={{color:'#555', fontSize:'12px', marginTop:'25px'}}>
          For MBBS students across India 🇮🇳
        </p>
      </div>
    </div>
  );
}

export default Login;