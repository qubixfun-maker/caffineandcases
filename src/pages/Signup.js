import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';

function Signup() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: user?.displayName || '',
    college: '',
    year: '',
    mobile: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.college || !form.year || !form.mobile) {
      setError('Please fill all fields');
      return;
    }
    if (form.mobile.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: form.name,
        email: user.email,
        photo: user.photoURL || '',
        college: form.college,
        year: form.year,
        mobile: form.mobile,
        role: 'student',
        plan: 'free',
        xp: 0,
        streak: 0,
        createdAt: new Date().toISOString()
      });
      navigate('/dashboard');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '13px 15px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '15px'
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
        maxWidth: '460px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{textAlign:'center', marginBottom:'30px'}}>
          <div style={{fontSize:'32px'}}>☕</div>
          <h2 style={{color:'#f97316', margin:'8px 0 4px', fontSize:'22px', fontWeight:'800'}}>
            Complete Your Profile
          </h2>
          <p style={{color:'#888', fontSize:'13px', margin:0}}>
            Signed in as {user?.email}
          </p>
        </div>

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

        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="college"
          placeholder="College Name (e.g. AIIMS Delhi)"
          value={form.college}
          onChange={handleChange}
          style={inputStyle}
        />

        <select
          name="year"
          value={form.year}
          onChange={handleChange}
          style={{...inputStyle, cursor:'pointer'}}
        >
          <option value="" style={{background:'#1a1a2e'}}>Select Year of Study</option>
          <option value="1st Year" style={{background:'#1a1a2e'}}>1st Year</option>
          <option value="2nd Year" style={{background:'#1a1a2e'}}>2nd Year</option>
          <option value="3rd Year" style={{background:'#1a1a2e'}}>3rd Year</option>
          <option value="Final Year" style={{background:'#1a1a2e'}}>Final Year</option>
          <option value="Intern" style={{background:'#1a1a2e'}}>Intern</option>
        </select>

        <input
          name="mobile"
          placeholder="Mobile Number (10 digits)"
          value={form.mobile}
          onChange={handleChange}
          maxLength={10}
          style={inputStyle}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#555' : 'linear-gradient(90deg, #f97316, #f59e0b)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '5px'
          }}
        >
          {loading ? 'Saving...' : 'Start Learning 🚀'}
        </button>
      </div>
    </div>
  );
}

export default Signup;