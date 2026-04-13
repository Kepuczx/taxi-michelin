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
  const [userId, setUserId] = useState<number | null>(null);

  // Pobieranie i formatowanie imienia
  const [firstName, setFirstName] = useState<string>(() => {
    const fullName = localStorage.getItem('userName');
    return fullName ? fullName.split(' ')[0] : 'Kierowca';
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  // Stan dla pojazdów i przypisanego pojazdu
  const [vehicles, setVehicles] = useState<VehicleWithDriver[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<VehicleWithDriver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');

    if (role !== 'driver') {
      navigate('/');
      return;
    }

    if (id) setUserId(parseInt(id));
    fetchVehiclesAndCheckAssignment(id ? parseInt(id) : null);
  }, [navigate]);

  const fetchVehiclesAndCheckAssignment = async (currentUserId: number | null) => {
    setLoading(true);
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);

      const targetUserId = currentUserId || userId;
      if (targetUserId) {
        const myVehicle = data.find(v => v.currentDriverId === targetUserId);
        setAssignedVehicle(myVehicle || null);
      }
    } catch (error) {
      console.error('Błąd pobierania pojazdów:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = async (vehicleId: number) => {
    if (!userId) return;
    try {
      const updatedVehicle = await vehicleService.assignDriver(vehicleId, userId);
      setAssignedVehicle(updatedVehicle);
      await fetchVehiclesAndCheckAssignment(userId);
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
        await fetchVehiclesAndCheckAssignment(userId);
      } catch (error) {
        console.error('Błąd zwalniania pojazdu:', error);
        alert('Nie udało się zwolnić pojazdu.');
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Czy na pewno chcesz się wylogować?')) {
      localStorage.clear(); // Oczyszcza cały localStorage dla bezpieczeństwa
      navigate('/');
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleAcceptTask = (id: number) => {
    alert(`Przyjęto zlecenie #${id}! Rozpoczynanie nawigacji...`);
  };

  // --- RENDERING KOMPONENTÓW ---

  if (loading) {
    return (
      <div className="driver-page-wrapper">
        <header className="driver-header">
          <div className="driver-logo"><span className="driver-logo-text">MICHELIN</span></div>
          <div className="driver-header-actions">
            <span className="welcome-text">Ładowanie...</span>
          </div>
        </header>
        <div className="driver-main-content" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <p>Ładowanie danych floty...</p>
        </div>
      </div>
    );
  }

  const availableVehicles = vehicles.filter(v => v.status === 'dostępny' && !v.isBreakdown);

  // GŁÓWNY ZWRACANY WIDOK - Header i Menu są renderowane zawsze, zmienia się tylko zawartość.
  return (
    <div className="driver-page-wrapper">
      
      {/* 1. STAŁY NAGŁÓWEK */}
      <header className="driver-header">
        <div className="driver-logo">
          <span className="driver-logo-text">MICHELIN</span>
        </div>
        <div className="driver-header-actions">
          <span className="welcome-text">Witaj, {firstName}!</span>
          <button className="driver-menu-btn" onClick={toggleMenu}>☰</button>
        </div>
      </header>

      {/* 2. WSPÓLNE MENU BOCZNE */}
      <div className={`driver-side-menu ${isMenuOpen ? 'open' : ''}`}>
        <button className="close-menu-btn" onClick={toggleMenu}>✕ Zamknij</button>
        <div className="driver-menu-header">Profil Kierowcy</div>
        
        {/* Widoczne tylko gdy kierowca ma pojazd */}
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
          Zlecenia
        </button>
        <button className="driver-menu-item">Pauza (Przerwa)</button>
        
        <div className="driver-menu-bottom">
          <button className={`driver-menu-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setIsMenuOpen(false); }}>
            Historia kursów
          </button>
          <button className="driver-menu-item logout-text" onClick={handleLogout}>Wyloguj się</button>
        </div>
      </div>

      {/* 3. DYNAMICZNA ZAWARTOŚĆ (Zmienia się w zależności od assignedVehicle) */}
      <div className="driver-main-content">
        
        {/* Wariant A: BRAK POJAZDU (Wybór Auta) */}
        {!assignedVehicle ? (
          <div className="driver-selection-container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div className="driver-selection-card" style={{ maxWidth: '600px', width: '100%' }}>
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
        ) : (
          /* Wariant B: MA POJAZD (Główny Dashboard) */
          <>
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
                <div className="task-panel-card" style={{ width: '100%' }}>
                  <h2>Historia kursów</h2>
                  <p>Tutaj znajdzie się lista wykonanych przez Ciebie kursów.</p>
                </div>
              </main>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default HomePageDriver;