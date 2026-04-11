import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePageDriver.css';

const HomePageDriver = () => {
  const navigate = useNavigate();
  const [loggedUser, setLoggedUser] = useState<string | null>('Kierowca');
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    const user = localStorage.getItem('loggedUser');
    if (user) setLoggedUser(user);
  }, []);

const handleLogout = () => {
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole'); // 🔥 Dodane: Czyszczenie roli
    setLoggedUser(null);
    navigate('/');
  };
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleAcceptTask = (id: number) => {
    alert(`Przyjęto zlecenie #${id}! Rozpoczynanie nawigacji...`);
  };

  return (
    <div className="driver-page-wrapper">
      
      {/* NAGŁÓWEK */}
      <header className="driver-header">
        <div className="driver-logo">
          <span className="driver-logo-text">MICHELIN</span>
        </div>
        <div className="driver-header-actions">
          <span className="welcome-text">Witaj, {loggedUser}!</span>
          <button className="driver-menu-btn" onClick={toggleMenu}>☰</button>
        </div>
      </header>

      {/* WYSUWANE MENU Z PRAWEJ */}
      <div className={`driver-side-menu ${isMenuOpen ? 'open' : ''}`}>
        <button className="close-menu-btn" onClick={toggleMenu}>✕ Zamknij</button>
        
        <div className="driver-menu-header">👤 Profil Kierowcy</div>
        <button className={`driver-menu-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => { setActiveTab('tasks'); setIsMenuOpen(false); }}>Lista zleceń</button>
        <button className="driver-menu-item">Pauza (Przerwa)</button>
        
        <div className="driver-menu-bottom">
          <button className={`driver-menu-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setIsMenuOpen(false); }}>Historia kursów</button>
          <button className="driver-menu-item logout-text" onClick={handleLogout}>Wyloguj się</button>
        </div>
      </div>

      {/* GŁÓWNY OBSZAR ROBOCZY */}
      <div className="driver-main-content">
        
        {activeTab === 'tasks' && (
          <>
            {/* LEWY PANEL (Lista nadchodzących zleceń) */}
            <aside className="driver-sidebar">
              <div className="task-panel-card">
                <h2 className="panel-title">Dostępne zlecenia</h2>
                
                <div className="tasks-container">
                  {/* Przykładowe Zlecenie 1 */}
                  <div className="task-card">
                    <div className="task-header">
                      <span className="task-time">Teraz</span>
                      <span className="task-distance">2.5 km stąd</span>
                    </div>
                    <div className="task-route">
                      <div className="route-point"><strong>Od:</strong> Brama Główna</div>
                      <div className="route-point"><strong>Do:</strong> Magazyn 4</div>
                    </div>
                    <div className="task-actions">
                      <button className="btn-reject">Odrzuć</button>
                      <button className="btn-accept" onClick={() => handleAcceptTask(1)}>Przyjmij</button>
                    </div>
                  </div>

                  {/* Przykładowe Zlecenie 2 */}
                  <div className="task-card">
                    <div className="task-header">
                      <span className="task-time">Za 15 min</span>
                      <span className="task-distance">4.0 km stąd</span>
                    </div>
                    <div className="task-route">
                      <div className="route-point"><strong>Od:</strong> Biurowiec A</div>
                      <div className="route-point"><strong>Do:</strong> Dworzec PKP</div>
                    </div>
                    <div className="task-actions">
                      <button className="btn-reject">Odrzuć</button>
                      <button className="btn-accept" onClick={() => handleAcceptTask(2)}>Przyjmij</button>
                    </div>
                  </div>
                </div>

              </div>
            </aside>

            {/* PRAWY PANEL (Nowoczesna mapa) */}
            <main className="driver-map-area">
              <div className="map-card">
                <span className="map-placeholder-text">Podgląd Mapy i Nawigacji</span>
              </div>
            </main>
          </>
        )}

        {activeTab === 'history' && (
          <main className="driver-history-area">
            <div className="task-panel-card">
              <h2>Historia kursów</h2>
              <p>Tutaj znajdzie się lista wykonanych przez Ciebie kursów.</p>
            </div>
          </main>
        )}

      </div>
    </div>
  );
};

export default HomePageDriver;