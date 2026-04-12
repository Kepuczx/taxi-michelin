import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../services/vehicleService';
import type { Vehicle } from '../types/vehicle.types';
import '../styles/HomePageDriver.css';

interface VehicleWithDriver extends Vehicle {
  currentDriver?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

const HomePageDriver = () => {
  const navigate = useNavigate();
  const [loggedUser, setLoggedUser] = useState<string | null>('Kierowca');
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  
  // Stan dla pojazdów i przypisanego pojazdu
  const [vehicles, setVehicles] = useState<VehicleWithDriver[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<VehicleWithDriver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('loggedUser');
    const id = localStorage.getItem('userId');
    const name = localStorage.getItem('userName');
    const role = localStorage.getItem('userRole');
    
    console.log('🔍 Dane z localStorage:', { user, id, name, role });
    
    if (role !== 'driver') {
      navigate('/');
      return;
    }
    
    if (user) setLoggedUser(user);
    if (id) setUserId(parseInt(id));
    if (name) setUserName(name);
    
    fetchVehiclesAndCheckAssignment();
  }, []);

  const fetchVehiclesAndCheckAssignment = async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);
      
      console.log('🚗 Wszystkie pojazdy:', data);
      console.log('👤 ID kierowcy:', userId);
      
      // Sprawdź czy kierowca ma już przypisany pojazd
      const myVehicle = data.find(v => v.currentDriverId === userId);
      console.log('🔍 Znaleziony pojazd kierowcy:', myVehicle);
      
      if (myVehicle) {
        setAssignedVehicle(myVehicle);
      } else {
        setAssignedVehicle(null);
      }
    } catch (error) {
      console.error('Błąd pobierania pojazdów:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = async (vehicleId: number) => {
    if (!userId) {
      console.error('Brak ID kierowcy');
      return;
    }
    
    console.log('🚗 Wybieram pojazd ID:', vehicleId, 'dla kierowcy ID:', userId);
    
    try {
      const updatedVehicle = await vehicleService.assignDriver(vehicleId, userId);
      console.log('✅ Przypisano pojazd:', updatedVehicle);
      setAssignedVehicle(updatedVehicle);
      await fetchVehiclesAndCheckAssignment();
    } catch (error) {
      console.error('❌ Błąd przypisywania pojazdu:', error);
      alert('Nie udało się przypisać pojazdu. Spróbuj ponownie.');
    }
  };

  const handleReleaseVehicle = async () => {
    if (!assignedVehicle) return;
    
    if (window.confirm(`Czy na pewno chcesz zakończyć pracę z pojazdem ${assignedVehicle.registration}?`)) {
      try {
        await vehicleService.releaseDriver(assignedVehicle.id);
        setAssignedVehicle(null);
        await fetchVehiclesAndCheckAssignment();
      } catch (error) {
        console.error('Błąd zwalniania pojazdu:', error);
        alert('Nie udało się zwolnić pojazdu.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleAcceptTask = (id: number) => {
    alert(`Przyjęto zlecenie #${id}! Rozpoczynanie nawigacji...`);
  };

  // Jeśli ładuje – pokaż loading
  if (loading) {
    return (
      <div className="driver-page-wrapper">
        <header className="driver-header">
          <div className="driver-logo">
            <span className="driver-logo-text">MICHELIN</span>
          </div>
          <div className="driver-header-actions">
            <span className="welcome-text">Ładowanie...</span>
            <button className="driver-menu-btn" onClick={toggleMenu}>☰</button>
          </div>
        </header>
        <div className="driver-main-content">
          <p>Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  // 🔥 SPRAWDŹ CZY KIEROWCA MA PRZYPISANY POJAZD
  // Jeśli NIE ma przypisanego pojazdu – pokaż widok wyboru
  if (!assignedVehicle) {
    const availableVehicles = vehicles.filter(v => v.status === 'dostępny' && !v.isBreakdown);
    console.log('📋 Dostępne pojazdy:', availableVehicles);
    
    return (
      <div className="driver-page-wrapper">
        <header className="driver-header">
          <div className="driver-logo">
            <span className="driver-logo-text">MICHELIN</span>
          </div>
          <div className="driver-header-actions">
            <span className="welcome-text">Witaj, {userName || loggedUser}!</span>
            <button className="driver-menu-btn" onClick={toggleMenu}>☰</button>
          </div>
        </header>

        <div className={`driver-side-menu ${isMenuOpen ? 'open' : ''}`}>
          <button className="close-menu-btn" onClick={toggleMenu}>✕ Zamknij</button>
          <div className="driver-menu-header">👤 Profil Kierowcy</div>
          <div className="driver-menu-bottom">
            <button className="driver-menu-item logout-text" onClick={handleLogout}>Wyloguj się</button>
          </div>
        </div>

        <div className="driver-selection-container">
          <div className="driver-selection-card">
            <h2>🚗 Wybór pojazdu</h2>
            <p>Nie masz przypisanego pojazdu. Wybierz dostępny:</p>
            
            {availableVehicles.length === 0 ? (
              <p className="no-vehicles">Brak dostępnych pojazdów. Skontaktuj się z administratorem.</p>
            ) : (
              <div className="driver-vehicles-list">
                {availableVehicles.map(vehicle => (
                  <div key={vehicle.id} className="driver-vehicle-item">
                    <div className="driver-vehicle-info">
                      <strong>{vehicle.brand} {vehicle.model}</strong>
                      <span>Rejestracja: {vehicle.registration}</span>
                      <span>Miejsca: {vehicle.passengerCapacity}</span>
                    </div>
                    <button 
                      className="driver-select-btn"
                      onClick={() => handleSelectVehicle(vehicle.id)}
                    >
                      Wybierz
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Jeśli MA przypisany pojazd – pokaż główny widok z zleceniami
  return (
    <div className="driver-page-wrapper">
      
      <header className="driver-header">
        <div className="driver-logo">
          <span className="driver-logo-text">MICHELIN</span>
        </div>
        <div className="driver-header-actions">
          <span className="welcome-text">Witaj, {userName || loggedUser}!</span>
          <button className="driver-menu-btn" onClick={toggleMenu}>☰</button>
        </div>
      </header>

      <div className={`driver-side-menu ${isMenuOpen ? 'open' : ''}`}>
        <button className="close-menu-btn" onClick={toggleMenu}>✕ Zamknij</button>
        
        <div className="driver-menu-header">👤 Profil Kierowcy</div>
        
        {/* Pokaż aktualny pojazd w menu */}
        {assignedVehicle && (
          <div className="driver-current-vehicle">
            <div className="vehicle-label">Twój pojazd:</div>
            <div className="vehicle-name">{assignedVehicle.brand} {assignedVehicle.model}</div>
            <div className="vehicle-plate">{assignedVehicle.registration}</div>
            <button className="driver-release-btn" onClick={handleReleaseVehicle}>
              Zakończ pracę
            </button>
          </div>
        )}
        
        <button className={`driver-menu-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => { setActiveTab('tasks'); setIsMenuOpen(false); }}>
          Lista zleceń
        </button>
        <button className="driver-menu-item">Pauza (Przerwa)</button>
        
        <div className="driver-menu-bottom">
          <button className={`driver-menu-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setIsMenuOpen(false); }}>
            Historia kursów
          </button>
          <button className="driver-menu-item logout-text" onClick={handleLogout}>Wyloguj się</button>
        </div>
      </div>

      <div className="driver-main-content">
        
        {activeTab === 'tasks' && (
          <>
            <aside className="driver-sidebar">
              <div className="task-panel-card">
                <h2 className="panel-title">Dostępne zlecenia</h2>
                
                <div className="tasks-container">
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