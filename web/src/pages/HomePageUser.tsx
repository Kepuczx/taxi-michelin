import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePageUser.css';

const HomePageUser = () => {
  const navigate = useNavigate();
  const [loggedUser, setLoggedUser] = useState<string | null>('Pracownik');
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');

  const [firstName, setFirstName] = useState<string>(() => {
    const fullName = localStorage.getItem('userName');
    // split(' ') dzieli tekst na tablicę po spacji (np. ["Jan", "Kowalski"])
    // [0] bierze pierwszy element (czyli "Jan")
    return fullName ? fullName.split(' ')[0] : 'Pracownik';
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('order');

  useEffect(() => {
    const user = localStorage.getItem('loggedUser');
    if (user) setLoggedUser(user);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Czy na pewno chcesz się wylogować?')) {
      localStorage.removeItem('loggedUser');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      setLoggedUser(null);
      navigate('/');
    }
  };
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleOrderTaxi = () => {
    if (pickupLocation && destination) {
      alert(`Zamówiono TAXI z ${pickupLocation} do ${destination}!`);
    } else {
      alert('Proszę wypełnić oba pola: miejsce rozpoczęcia trasy i miejsce docelowe.');
    }
  };

  return (
    <div className="user-page-wrapper">
      
      {/* NAGŁÓWEK */}
      <header className="user-header">
        <div className="user-logo">
          <span className="user-logo-text">MICHELIN</span>
        </div>
        <div className="user-header-actions">
          <span className="welcome-text">Witaj, {firstName}!</span>
          <button className="user-menu-btn" onClick={toggleMenu}>☰</button>
        </div>
      </header>

      {/* WYSUWANE MENU Z PRAWEJ */}
      <div className={`user-side-menu ${isMenuOpen ? 'open' : ''}`}>
        <button className="close-menu-btn" onClick={toggleMenu}>✕ Zamknij</button>
        
        <div className="user-menu-header">Twój Profil</div>
        <button className="user-menu-item">Rezerwacja auta</button>
        <button className={`user-menu-item ${activeTab === 'order' ? 'active' : ''}`} onClick={() => { setActiveTab('order'); setIsMenuOpen(false); }}>Zamów TAXI</button>
        <button className="user-menu-item">Status przejazdu</button>
        <button className="user-menu-item">Zgłoś usterkę</button>
        
        <div className="user-menu-bottom">
          <button className={`user-menu-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setIsMenuOpen(false); }}>Historia przejazdów</button>
          <button className="user-menu-item logout-text" onClick={handleLogout}>Wyloguj się</button>
        </div>
      </div>

      {/* GŁÓWNY OBSZAR ROBOCZY */}
      <div className="user-main-content">
        
        {activeTab === 'order' && (
          <>
            {/* LEWY PANEL (Nowoczesny formularz) */}
            <aside className="user-sidebar">
              <div className="form-card">
                <h2 className="form-title">Zaplanuj trasę</h2>
                
                <div className="input-group">
                  <label>MIEJSCE ODBIORU</label>
                  <input 
                    type="text" 
                    placeholder="Np. Brama Główna"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>MIEJSCE DOCELOWE</label>
                  <input 
                    type="text" 
                    placeholder="Np. Magazyn nr 4"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>

                <button className="order-btn" onClick={handleOrderTaxi}>
                  ZAMÓW PRZEJAZD
                </button>
              </div>
            </aside>

            {/* PRAWY PANEL (Nowoczesna mapa) */}
            <main className="user-map-area">
              <div className="map-card">
                <span className="map-placeholder-text">Podgląd Mapy</span>
              </div>
            </main>
          </>
        )}

        {activeTab === 'history' && (
          <main className="user-history-area">
            <div className="form-card">
              <h2>Historia przejazdów</h2>
              <p>Tutaj znajdzie się lista Twoich kursów.</p>
            </div>
          </main>
        )}

      </div>
    </div>
  );
};

export default HomePageUser;