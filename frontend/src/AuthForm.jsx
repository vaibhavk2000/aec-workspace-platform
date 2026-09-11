import React, { useState } from 'react';

export default function AuthForm({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const path = isLogin ? 'login' : 'signup';
    try {
      const res = await fetch(`http://localhost/api/v1/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authentication failed.');
      
      if (isLogin && data.access_token) {
        localStorage.setItem('token', data.access_token);
        onAuthSuccess();
      } else {
        setIsLogin(true);
        alert('Account ready. Please login.');
      }
    } catch (err) { setError(err.message); }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1e1e1e' }}>
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#252526', padding: '32px', borderRadius: '6px', width: '300px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid #3c3c3c' }}>
        <h3 style={{ color: '#fff', textAlign: 'center', margin: 0 }}>{isLogin ? '🔒 AECWebService Login' : '📝 Student Registration'}</h3>
        {error && <div style={{ color: '#f44336', fontSize: '13px', textAlign: 'center' }}>{error}</div>}
        <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '8px', backgroundColor: '#3c3c3c', color: '#fff', border: '1px solid #555', borderRadius: '4px' }} />
        <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '8px', backgroundColor: '#3c3c3c', color: '#fff', border: '1px solid #555', borderRadius: '4px' }} />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#007fff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{isLogin ? 'Login' : 'Register'}</button>
        <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#00ffcc', fontSize: '12px', textAlignment: 'center', cursor: 'pointer', textDecoration: 'underline' }}>{isLogin ? 'Create profile' : 'Back to login'}</span>
      </form>
    </div>
  );
}
