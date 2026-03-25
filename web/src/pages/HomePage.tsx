import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css'; 
import '../styles/HomePage.css';

const HomePage = () => {
  const [message, setMessage] = useState('Łączenie z backendem...');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 🔥 Od razu ładujemy użytkownika z pamięci przeglądarki!
  const [loggedUser, setLoggedUser] = useState<string | null>(() => localStorage.getItem('loggedUser'));
  const navigate = useNavigate();

  const role = localStorage.getItem('userRole');

  useEffect(() => {
    // 1. Sprawdzenie połączenia z backendem
    fetch('http://localhost:3000')
      .then(res => res.text())
      .then(data => setMessage(`✅ Połączono: ${data}`))
      .catch(err => setMessage('❌ Brak połączenia z backendem'));

    // 2. Sprawdzanie logowania i AUTOMATYCZNE PRZEKIEROWANIE 🔥
    const user = localStorage.getItem('loggedUser');
    if (user) {
      setLoggedUser(user);
    } else {
      // Jeśli nie ma użytkownika w pamięci, natychmiast wyrzuć go na stronę logowania
      navigate('/');
    }
  }, [navigate]); // <- dodaliśmy navigate do tablicy zależności

  const handleLogout = () => {
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    setLoggedUser(null);
    navigate('/'); // 🔥 Po wylogowaniu też od razu wyrzucamy do logowania!
  };

  return (
    <div className="app">
      <header className="home-header">
        <div className="home-header-content">
          <h1 className="home-title">TAXI MICHELIN</h1>
          
          <div className="home-header-actions">
            {/* Tutaj już wiemy na 100%, że użytkownik JEST zalogowany */}
            <span className="user-greeting">
              Witaj, {loggedUser}!
            </span>
            
            {role === 'admin' && (
              <Link to="/admin">
                <button className="header-btn btn-admin">
                  Panel Admina
                </button>
              </Link>
            )}

            <button onClick={handleLogout} className="header-btn btn-logout">
              Wyloguj
            </button>
          </div>
        </div>
        
        <p className="status status-message">
          {message}
        </p>
      </header>

      <main>
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            {/* Miejsce na Twój dashboard */}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;