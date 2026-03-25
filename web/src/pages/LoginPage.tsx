import React, { useState, useEffect } from 'react'; // 🔥 Dodano import useEffect
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';

const Login = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // 🔥 DODANE: Sprawdzamy od razu przy wejściu, czy użytkownik jest już zalogowany
  useEffect(() => {
    const isLogged = localStorage.getItem('loggedUser');
    if (isLogged) {
      navigate('/home'); // Jeśli ma sesję, wyrzucamy go na główną stronę
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
        localStorage.setItem('loggedUser', loginData.email);
        localStorage.setItem('authToken', data.access_token); 
        localStorage.setItem('userRole', data.role);
        
        navigate('/home');
      } else {
        setErrorMsg(data.message || "Błędny login lub hasło");
      }
    } catch (err) {
      setErrorMsg("Błąd połączenia z serwerem");
    }
  };

  // Funkcja handleBack została usunięta, skoro to i tak strona wejściowa :)

  return (
    <div className="login-wrapper">

      <div className="login-form-container">
        <div className="login-header">
          <h1>LOGOWANIE</h1>
          <h2>TRANSPORT FIRMOWY</h2>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {errorMsg && <p style={{ color: 'red', textAlign: 'center' }}>{errorMsg}</p>}

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