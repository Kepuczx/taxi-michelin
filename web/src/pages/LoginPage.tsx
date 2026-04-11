import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';

const Login = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Sprawdzamy od razu przy wejściu, czy użytkownik jest już zalogowany
  useEffect(() => {
    const isLogged = localStorage.getItem('loggedUser');
    const userRole = localStorage.getItem('userRole'); // Pobieramy też rolę!

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

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginData.email, password: loginData.password })
      });

      const data = await response.json();

      if (response.ok) {
        // Zapisujemy dane do pamięci przeglądarki
        localStorage.setItem('loggedUser', loginData.email);
        localStorage.setItem('authToken', data.access_token); 
        localStorage.setItem('userRole', data.role); // Koniecznie zapisujemy rolę z backendu
        
        // Magia przekierowania: sprawdzamy rolę, którą zwrócił backend
        if (data.role === 'admin') {
          navigate('/homeAdmin');
        } else if (data.role === 'driver') {
          navigate('/homeDriver');
        } else if (data.role === 'employee') {
          navigate('/homeUser');
        } else {
          // Zabezpieczenie, gdyby rola z backendu była jakaś inna
          setErrorMsg("Błąd: Nieznana rola użytkownika.");
        }
        
      } else {
        setErrorMsg(data.message || "Błędny login lub hasło");
      }
    } catch (err) {
      setErrorMsg("Błąd połączenia z serwerem");
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
            />
          </div>

          <button type="submit" className="login-submit-btn">Zaloguj</button>
        </form>
      </div>
    </div>
  );
};

export default Login;