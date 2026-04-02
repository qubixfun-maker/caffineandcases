import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div style={{
      minHeight:'100vh',
      background:'#0a0a0a',
      color:'white',
      fontFamily:"'Segoe UI', sans-serif",
      display:'flex'
    }}>
      {/* Sidebar */}
      <div style={{
        width:'240px',
        background:'#1a1a2e',
        borderRight:'1px solid rgba(249,115,22,0.2)',
        padding:'30px 20px',
        display:'flex',
        flexDirection:'column'
      }}>
        <div style={{textAlign:'center', marginBottom:'40px'}}>
          <div style={{fontSize:'28px'}}>☕</div>
          <div style={{color:'#f97316', fontWeight:'800', fontSize:'16px'}}>
            Admin Panel
          </div>
        </div>

        {['📊 Overview','👥 Students','📚 Notes','🧠 Question Bank','🎬 Videos','📋 Surveys','🔗 Affiliates','⚙️ Settings'].map(item => (
          <div key={item} style={{
            padding:'12px 15px',
            borderRadius:'10px',
            cursor:'pointer',
            marginBottom:'5px',
            color:'#ccc',
            fontSize:'14px'
          }}>
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

      {/* Main */}
      <div style={{flex:1, padding:'40px'}}>
        <h1 style={{margin:'0 0 40px', fontSize:'26px', fontWeight:'800'}}>
          Admin Overview 📊
        </h1>

        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',
          gap:'20px'
        }}>
          {[
            {label:'Total Students', value:'0', icon:'👥', color:'#6366f1'},
            {label:'Active Today', value:'0', icon:'🟢', color:'#10b981'},
            {label:'Total Notes', value:'0', icon:'📚', color:'#f97316'},
            {label:'Total MCQs', value:'0', icon:'🧠', color:'#f59e0b'},
          ].map(card => (
            <div key={card.label} style={{
              background:'#1a1a2e',
              border:`1px solid ${card.color}33`,
              borderRadius:'15px',
              padding:'25px',
              textAlign:'center'
            }}>
              <div style={{fontSize:'32px'}}>{card.icon}</div>
              <div style={{color:card.color, fontSize:'28px', fontWeight:'800', margin:'10px 0 5px'}}>
                {card.value}
              </div>
              <div style={{color:'#888', fontSize:'13px'}}>{card.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;