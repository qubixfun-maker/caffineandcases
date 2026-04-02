import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  if (loading) return <div style={{color:'white',display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'#0a0a0a',fontSize:'18px'}}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  const [user, loading] = useAuthState(auth);
  if (loading) return <div style={{color:'white',display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'#0a0a0a',fontSize:'18px'}}>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;