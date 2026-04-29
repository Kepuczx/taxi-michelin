import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';

const Login = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Sprawdzamy od razu przy wejściu, czy użytkownik jest już zalogowany
  useEffect(() => {
    const isLogged = localStorage.getItem('loggedUser');
    const userRole = localStorage.getItem('userRole');

    if (isLogged && userRole) {
      // Przenosimy na odpowiedni dashboard na podstawie roli z localStorage
      if (userRole === 'admin') navigate('/homeAdmin');
      else if (userRole === 'driver') navigate('/homeDriver');
      else if (userRole === 'employee') navigate('/homeUser');
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginData.email, password: loginData.password })
      });

      const data = await response.json();

      if (response.ok) {
        // 🔥 ZAPISUJEMY WSZYSTKIE DANE
        localStorage.setItem('loggedUser', loginData.email);
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('userRole', data.role);
        
        // 🔥 KLUCZOWE: ZAPISUJEMY ID UŻYTKOWNIKA
        if (data.user && data.user.id) {
          localStorage.setItem('userId', data.user.id.toString());
          localStorage.setItem('userName', `${data.user.firstName} ${data.user.lastName}`);
          localStorage.setItem('userEmail', data.user.email);
          
        } else {
          // Jeśli backend nie zwraca user.id, spróbuj z sub z tokena (ale lepiej poprawić backend)
          console.warn('Backend nie zwrócił user.id');
        }
        
        console.log('Zapisane dane:', {
          role: data.role,
          userId: localStorage.getItem('userId'),
          userName: localStorage.getItem('userName')
        });
        
        // Przekierowanie na podstawie roli
        if (data.role === 'admin') {
          navigate('/homeAdmin');
        } else if (data.role === 'driver') {
          navigate('/homeDriver');
        } else if (data.role === 'employee') {
          navigate('/homeUser');
        } else {
          setErrorMsg("Błąd: Nieznana rola użytkownika.");
        }
        
      } else {
        setErrorMsg(data.message || "Błędny login lub hasło");
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg("Błąd połączenia z serwerem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-form-container">
        <div className="login-header">
          <h1>LOGOWANIE</h1>
          <h2>TRANSPORT FIRMOWY</h2>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {errorMsg && <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>{errorMsg}</p>}

          <div className="input-field">
            <input 
              type="text" 
              name="email"
              placeholder="E-mail"
              value={loginData.email}
              onChange={handleChange}
              required 
              disabled={loading}
            />
          </div>

          <div className="input-field">
            <input 
              type="password" 
              name="password"
              placeholder="Hasło"
              value={loginData.password}
              onChange={handleChange}
              required 
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Logowanie...' : 'Zaloguj'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;