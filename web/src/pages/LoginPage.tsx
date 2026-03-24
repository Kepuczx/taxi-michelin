import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';

const Login = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState(''); // Dodano stan do obsługi błędów
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); // Czyścimy błąd przed nową próbą

    try {
      // 1. Wysyłamy dane do naszego backendu (tego, który zrobiliśmy wczoraj/dzisiaj)
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Używamy "email" jako username, w zależności jak zaprogramowałeś backend
        body: JSON.stringify({ username: loginData.email, password: loginData.password })
      });

      const data = await response.json();

      if (response.ok) {
        // SUKCES
        localStorage.setItem('loggedUser', loginData.email);
        localStorage.setItem('authToken', data.token);
        
        // Przekierowujemy na stronę główną
        navigate('/');
      } else {
        // BŁĄD LOGOWANIA
        setErrorMsg(data.error || "Błędny login lub hasło");
      }
    } catch (err) {
      setErrorMsg("Błąd połączenia z serwerem");
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="login-wrapper">
      <button className="back-btn" onClick={handleBack}>
        Cofnij
      </button>

      <div className="login-form-container">
        <div className="login-header">
          <h1>LOGOWANIE</h1>
          <h2>TRANSPORT FIRMOWY</h2>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {/* Wyświetlanie błędu nad formularzem, jeśli wystąpił */}
          {errorMsg && <p style={{ color: 'red', textAlign: 'center' }}>{errorMsg}</p>}

          <div className="input-field">
            <input 
              type="text" 
              name="email"
              placeholder="E-mail (admin)" // Zmieniłem placeholder pod naszego mocka
              value={loginData.email}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="input-field">
            <input 
              type="password" 
              name="password"
              placeholder="Hasło (admin)" // Zmieniłem placeholder pod naszego mocka
              value={loginData.password}
              onChange={handleChange}
              required 
            />
          </div>

          <button type="submit" className="login-submit-btn">Zaloguj</button>
        </form>
      </div>
    </div>
  );
};

export default Login;