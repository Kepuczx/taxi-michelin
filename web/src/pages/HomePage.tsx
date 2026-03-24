import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css'; 
import '../styles/HomePage.css'; // Upewnij się, że ścieżka do tego pliku jest poprawna!

const HomePage = () => {
  const [message, setMessage] = useState('Łączenie z backendem...');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [loggedUser, setLoggedUser] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Sprawdzamy połączenie z backendem
    fetch('http://localhost:3000')
      .then(res => res.text())
      .then(data => setMessage(`✅ Połączono: ${data}`))
      .catch(err => setMessage('❌ Brak połączenia z backendem'));

    // 2. Sprawdzamy logowanie
    const user = localStorage.getItem('loggedUser');
    if (user) {
      setLoggedUser(user);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('authToken');
    setLoggedUser(null);
  };

  return (
    <div className="app">
      <header className="home-header">
        
        <div className="home-header-content">
          
          <h1 className="home-title">
            TAXI MICHELIN
          </h1>
          
          <div className="home-header-actions">
            
            {loggedUser ? (
              // WIDOK DLA ZALOGOWANEGO UŻYTKOWNIKA
              <>
                <span className="user-greeting">
                  Witaj, {loggedUser}!
                </span>
                
                <Link to="/admin">
                  <button className="header-btn btn-admin">
                    Panel Admina
                  </button>
                </Link>

                <button onClick={handleLogout} className="header-btn btn-logout">
                  Wyloguj
                </button>
              </>
            ) : (
              // WIDOK DLA NIEZALOGOWANEGO (GOŚCIA)
              <Link to="/login">
                <button className="header-btn btn-login">
                  Logowanie
                </button>
              </Link>
            )}

          </div>
        </div>
        
        {/* Zostawiłem klasę "status" z Twojego starego kodu i dodałem nową "status-message" */}
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