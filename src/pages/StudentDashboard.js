import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function StudentDashboard() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: 'white',
      fontFamily: "'Segoe UI', sans-serif",
      display: 'flex'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '240px',
        background: '#1a1a2e',
        borderRight: '1px solid rgba(249,115,22,0.2)',
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{textAlign:'center', marginBottom:'40px'}}>
          <div style={{fontSize:'28px'}}>☕</div>
          <div style={{color:'#f97316', fontWeight:'800', fontSize:'16px'}}>
            Caffeineandcases
          </div>
        </div>

        {['🏠 Home','📚 Notes','🧠 Question Bank','🎮 Games','🤖 AI Tutor','🏆 Leaderboard','👤 Profile'].map(item => (
          <div key={item} style={{
            padding: '12px 15px',
            borderRadius: '10px',
            cursor: 'pointer',
            marginBottom: '5px',
            color: '#ccc',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.target.style.background='rgba(249,115,22,0.1)'}
          onMouseOut={e => e.target.style.background='transparent'}
          >
            {item}
          </div>
        ))}

        <div style={{marginTop:'auto'}}>
          <button onClick={handleLogout} style={{
            width:'100%',
            padding:'10px',
            background:'rgba(239,68,68,0.1)',
            border:'1px solid rgba(239,68,68,0.3)',
            color:'#ef4444',
            borderRadius:'10px',
            cursor:'pointer',
            fontSize:'14px'
          }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{flex:1, padding:'40px'}}>
        {/* Top Bar */}
        <div style={{
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
          marginBottom:'40px'
        }}>
          <div>
            <h1 style={{margin:0, fontSize:'26px', fontWeight:'800'}}>
              Hey {user?.displayName?.split(' ')[0]} 👋
            </h1>
            <p style={{margin:'5px 0 0', color:'#888', fontSize:'14px'}}>
              Ready to study today?
            </p>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
            <div style={{
              background:'rgba(249,115,22,0.15)',
              border:'1px solid rgba(249,115,22,0.3)',
              padding:'8px 16px',
              borderRadius:'20px',
              color:'#f97316',
              fontSize:'14px',
              fontWeight:'700'
            }}>
              ⚡ 0 XP
            </div>
            <img
              src={user?.photoURL || 'https://via.placeholder.com/40'}
              alt="profile"
              style={{width:'42px', height:'42px', borderRadius:'50%', border:'2px solid #f97316'}}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',
          gap:'20px',
          marginBottom:'40px'
        }}>
          {[
            {label:'🔥 Streak', value:'0 days', color:'#f97316'},
            {label:'⚡ XP Points', value:'0 XP', color:'#f59e0b'},
            {label:'📚 Notes Read', value:'0', color:'#10b981'},
            {label:'🧠 MCQs Done', value:'0', color:'#6366f1'},
          ].map(card => (
            <div key={card.label} style={{
              background:'#1a1a2e',
              border:`1px solid ${card.color}33`,
              borderRadius:'15px',
              padding:'20px',
              textAlign:'center'
            }}>
              <div style={{color:card.color, fontSize:'24px', fontWeight:'800'}}>
                {card.value}
              </div>
              <div style={{color:'#888', fontSize:'13px', marginTop:'5px'}}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Today's Goal */}
        <div style={{
          background:'#1a1a2e',
          border:'1px solid rgba(249,115,22,0.2)',
          borderRadius:'15px',
          padding:'25px',
          marginBottom:'30px'
        }}>
          <h3 style={{margin:'0 0 20px', color:'#f97316'}}>
            📋 Today's Study Goal
          </h3>
          <div style={{marginBottom:'15px'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
              <span style={{color:'#ccc', fontSize:'14px'}}>MCQs (0 / 20)</span>
              <span style={{color:'#888', fontSize:'14px'}}>0%</span>
            </div>
            <div style={{background:'#333', borderRadius:'10px', height:'8px'}}>
              <div style={{background:'#f97316', width:'0%', height:'8px', borderRadius:'10px'}}/>
            </div>
          </div>
          <div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
              <span style={{color:'#ccc', fontSize:'14px'}}>Notes (0 / 2)</span>
              <span style={{color:'#888', fontSize:'14px'}}>0%</span>
            </div>
            <div style={{background:'#333', borderRadius:'10px', height:'8px'}}>
              <div style={{background:'#10b981', width:'0%', height:'8px', borderRadius:'10px'}}/>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{display:'flex', gap:'15px', flexWrap:'wrap'}}>
          {[
            {label:'Start MCQ 🧠', color:'#f97316'},
            {label:'Read Notes 📚', color:'#10b981'},
            {label:'Ask AI 🤖', color:'#6366f1'},
          ].map(btn => (
            <button key={btn.label} style={{
              padding:'14px 28px',
              background:`${btn.color}22`,
              border:`1px solid ${btn.color}`,
              color:btn.color,
              borderRadius:'12px',
              cursor:'pointer',
              fontSize:'15px',
              fontWeight:'600'
            }}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;