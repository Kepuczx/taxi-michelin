import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { vehicleService } from '../services/vehicleService';
import { vehicleLogService } from '../services/vehicleLogService';
import type { User, NewUser } from '../types/user.types';
import type { Vehicle, NewVehicle } from '../types/vehicle.types';
import type { VehicleLog } from '../types/vehicleLog.types';
import '../styles/HomePageAdmin.css';

import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { API_URL, GOOGLE_MAPS_API_KEY } from '../config';

const HomePageAdmin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [message, setMessage] = useState('Laczenie z backendem...');
  const [loggedUser, setLoggedUser] = useState<string | null>(() => localStorage.getItem('loggedUser'));
  const role = localStorage.getItem('userRole');
  
  const itemsPerPage = 5;
  const adminEmail = localStorage.getItem("userEmail") || 'system'
  const adminName = localStorage.getItem('userName') || 'Admin'
  const firstNameAdmin = adminName.split(' ')[0];

  // ==================== STAN: UŻYTKOWNICY ====================
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false); 
  const [searchTermUsers, setSearchTermUsers] = useState('');
  const [currentPageUsers, setCurrentPageUsers] = useState(1);
  const [newUser, setNewUser] = useState<NewUser>({
    username: '', email: '', password: '', firstName: '', lastName: '', phone: '', role: 'employee'
  });
  const [showEditUserForm, setShowEditUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserData, setEditUserData] = useState({
    username: '', email: '', password: '', firstName: '', lastName: '', phone: '', role: 'employee' as any
  });

  // ==================== STAN: FLOTA ====================
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [searchTermVehicles, setSearchTermVehicles] = useState('');
  const [currentPageVehicles, setCurrentPageVehicles] = useState(1);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showEditVehicleForm, setShowEditVehicleForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState<NewVehicle>({
    registration: '', brand: '', model: '', passengerCapacity: 4, status: 'dostępny', isBreakdown: false, notes: ''
  });

  // ==================== STAN: RAPORTY (LOGI) ====================
  const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [currentPageReports, setCurrentPageReports] = useState(1);

  // ==================== STAN: MAPA ====================
  const [drivers, setDrivers] = useState<User[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [mapCenter] = useState({ lat: 53.7784, lng: 20.4801 });

  // ==================== FUNKCJE POMOCNICZE ====================
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    if (window.confirm('Czy na pewno chcesz się wylogować?')) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      localStorage.removeItem('loggedUser');
      setLoggedUser(null);
      navigate('/');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL');
  };

  const getEventTypeLabel = (eventType: string) => {
    switch(eventType) {
      case 'rozpoczęcie_pracy': return 'Rozpoczęcie';
      case 'zakończenie_pracy': return 'Zakończenie';
      case 'przejazd': return 'Przejazd';
      case 'awaria': return 'Awaria';
      default: return 'Uwagi';
    }
  };

  // ==================== LOGIKA: UŻYTKOWNICY ====================
  const fetchUsers = async () => {
    setLoading(true);
    try { const data = await userService.getAll(); setUsers(data); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userService.create(newUser);
      setShowForm(false);
      setNewUser({ username: '', email: '', password: '', firstName: '', lastName: '', phone: '', role: 'employee' });
      fetchUsers();
    } catch (error) { console.error(error); }
  };

  const deleteUser = async (id: number) => {
    if (window.confirm('Czy na pewno usunąć użytkownika?')) {
      try {
        await userService.delete(id);
        fetchUsers();
      } catch (error) { console.error('Błąd usuwania użytkownika:', error); }
    }
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserData({
      username: user.username || '', email: user.email || '', password: '',
      firstName: user.firstName || '', lastName: user.lastName || '',
      phone: user.phone || '', role: user.role || 'employee'
    });
    setShowEditUserForm(true);
    setShowForm(false);
  };

  const updateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload: any = { ...editUserData };
      if (!payload.password.trim()) delete payload.password;
      await userService.update(editingUser.id, payload);
      setShowEditUserForm(false);
      fetchUsers();
    } catch (error) { alert('Błąd aktualizacji użytkownika'); }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTermUsers.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTermUsers.toLowerCase())
  );
  const totalPagesUsers = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice((currentPageUsers - 1) * itemsPerPage, currentPageUsers * itemsPerPage);

  // ==================== LOGIKA: FLOTA ====================
  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try { const data = await vehicleService.getAll(); setVehicles(data); }
    catch (error) { console.error(error); }
    finally { setLoadingVehicles(false); }
  };

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vehicleService.create(newVehicle, adminEmail);
      setShowVehicleForm(false);
      setNewVehicle({ registration: '', brand: '', model: '', passengerCapacity: 4, status: 'dostępny', isBreakdown: false, notes: '' });
      fetchVehicles();
    } catch (error) { alert('Błąd dodawania pojazdu'); }
  };

  const deleteVehicle = async (id: number) => {
    if (window.confirm('Na pewno usunąć pojazd?')) {
      try {
        await vehicleService.delete(id, adminEmail)
        fetchVehicles()
      } catch (error) {
        console.error('Błąd usuwania pojazdu:', error)
        alert('Błąd usuwania pojazdu')
      }
    }
  }

  const startEditVehicle = (v: Vehicle) => {
    setEditingVehicle({...v}); // Kopia obiektu
    setShowEditVehicleForm(true);
    setShowVehicleForm(false);
  };

  const updateVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    try {
      await vehicleService.update(editingVehicle.id, { ...editingVehicle }, adminEmail);
      setShowEditVehicleForm(false);
      setEditingVehicle(null);
      fetchVehicles();
    } catch (error) { alert('Błąd aktualizacji pojazdu'); }
  };

  const toggleBreakdown = async (id: number, currentStatus: boolean, name: string) => {
    if (window.confirm(`Zmienić status awarii dla ${name}?`)) {
      try {
        await vehicleService.update(id, { isBreakdown: !currentStatus }, adminEmail);
        fetchVehicles();
      } catch (error) { alert('Błąd zmiany statusu awarii'); }
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.registration.toLowerCase().includes(searchTermVehicles.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchTermVehicles.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTermVehicles.toLowerCase())
  );
  const totalPagesVehicles = Math.ceil(filteredVehicles.length / itemsPerPage);
  const currentVehicles = filteredVehicles.slice((currentPageVehicles - 1) * itemsPerPage, currentPageVehicles * itemsPerPage);

  // ==================== LOGIKA: RAPORTY (LOGI) ====================
  const fetchLogsForVehicle = async (vehicleId: number) => {
    setLoadingLogs(true);
    try {
      const data = await vehicleLogService.getByVehicleId(vehicleId);
      setVehicleLogs(data);
    } catch (error) { console.error('Błąd pobierania logów:', error); }
    finally { setLoadingLogs(false); }
  };

  const handleVehicleSelect = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
    setCurrentPageReports(1);
    if (vehicleId) fetchLogsForVehicle(vehicleId);
    else setVehicleLogs([]);
  };

  const totalPagesReports = Math.ceil(vehicleLogs.length / itemsPerPage);
  const currentReports = vehicleLogs.slice((currentPageReports - 1) * itemsPerPage, currentPageReports * itemsPerPage);

// ==================== LOGIKA: MAPA ====================
  const fetchDrivers = async () => {
    try {
      const allUsers = await userService.getAll();
      const driverList = allUsers.filter(u => u.role === 'driver');
      setDrivers(driverList);
    } catch (error) { console.error('Błąd pobierania kierowców:', error); }
  };

  // Sortujemy kopię tablicy drivers, aby online byli na górze
  const sortedDrivers = [...drivers].sort((a, b) => {
    const aOnline = (a as any).isOnline ? 1 : 0;
    const bOnline = (b as any).isOnline ? 1 : 0;
    return bOnline - aOnline; 
  });


  // ==================== EFFECTY ====================
  useEffect(() => {
    //Zmienna do przechowywania intervalu
    let intervalId: NodeJS.Timeout;

    if (activeTab === 'dashboard'){
      fetchDrivers();
      intervalId = setInterval(() => {
        fetchDrivers();
      }, 10000); // Odświeżaj co 10 sekund
    }
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'fleet') fetchVehicles();
    else if (activeTab === 'reports') fetchVehicles(); 

    //Sprzątanie - czyszczenie intervalu przy zmianie zakładki
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab]);

  useEffect(() => {
    const user = localStorage.getItem('loggedUser');
    if (!user || role !== 'admin') navigate('/');
    fetch('http://localhost:3000').then(res => res.text())
      .then(data => setMessage(`Połączono z backendem: ${data}`))
      .catch(() => setMessage('Brak połączenia z serwerem'));
  }, [navigate, role]);

  const translateRole = (role: string) => {
    const roles: any = { admin: 'Administrator', driver: 'Kierowca', employee: 'Pracownik' };
    return roles[role] || role;
  };

  return (
    <div className="admin-page-wrapper">
      <header className="admin-header">
        <div className="admin-logo"><span className="admin-logo-text">MICHELIN</span></div>
        <div className="admin-header-actions">
          <span className="welcome-text">Witaj, {firstNameAdmin}!</span>
          <button className="admin-menu-btn" onClick={toggleMenu}>☰</button>
        </div>
      </header>

      <div className={`admin-side-menu ${isMenuOpen ? 'open' : ''}`}>
        <button className="close-menu-btn" onClick={toggleMenu}>Zamknij</button> 
        <div className="admin-menu-header">Panel Administratora</div>
        <button className={`admin-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => {setActiveTab('dashboard'); setIsMenuOpen(false);}}>Kursy</button>
        <button className={`admin-menu-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => {setActiveTab('users'); setIsMenuOpen(false);}}>Użytkownicy</button>
        <button className={`admin-menu-item ${activeTab === 'fleet' ? 'active' : ''}`} onClick={() => {setActiveTab('fleet'); setIsMenuOpen(false);}}>Flota</button>
        <button className={`admin-menu-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => {setActiveTab('reports'); setIsMenuOpen(false);}}>Raporty</button>
        <div className="admin-menu-bottom">
          <button className="admin-menu-item logout-text" onClick={handleLogout}>Wyloguj się</button>
        </div>
      </div>

      <div className="admin-main-content">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="map-dashboard-layout">
            <div className={`admin-status-banner ${message.includes('Połączono') ? 'banner-ok' : 'banner-error'}`}>
              {message}
            </div>

            <div className="dashboard-container" style={{ display: 'flex', height: 'calc(100vh - 150px)', width: '100%' }}>

              {/* LEWY PANEL - POSORTOWANA LISTA KIEROWCÓW */}
              <aside className="admin-drivers-sidebar" style={{ width: '300px', backgroundColor: '#f8f9fa', borderRight: '1px solid #ddd', padding: '15px', overflowY: 'auto' }}>
                <h3 style={{ color: '#0a1d56', borderBottom: '2px solid #FFD700', paddingBottom: '10px', fontSize: '18px' }}>
                  Operacyjni ({drivers.filter(d => (d as any).isOnline).length}/{drivers.length})
                </h3>

                <div className="drivers-list">
                  {sortedDrivers.map(driver => (
                    <div 
                      key={driver.id} 
                      style={{ 
                        padding: '12px', 
                        background: selectedDriver?.id === driver.id ? '#eef2ff' : 'white', // Podświetlenie wybranego
                        borderRadius: '8px', 
                        marginBottom: '10px', 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', 
                        cursor: 'pointer',
                        border: selectedDriver?.id === driver.id ? '1px solid #0a1d56' : '1px solid transparent'
                      }} 
                      onClick={() => setSelectedDriver(driver)} // 🔥 Kliknięcie na liście otwiera dymek na mapie
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#333' }}>{driver.firstName} {driver.lastName}</span>
                        <span style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: (driver as any).isOnline ? '#28a745' : '#ccc' 
                        }}></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                        <span style={{ fontSize: '11px', color: (driver as any).isOnline ? '#28a745' : '#999', fontWeight: 'bold' }}>
                          {(driver as any).isOnline ? 'DOSTĘPNY' : 'OFFLINE'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#666' }}>{driver.phone || 'Brak tel.'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
                
              {/* PRAWY PANEL - MAPA Z POPRAWIONYMI DYMKAMI */}
              <main className="admin-map-area" style={{ flex: 1, position: 'relative' }}>
                <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mapCenter}
                    zoom={13}
                    options={{ disableDefaultUI: false, zoomControl: true }}
                  >
                    {/* Renderowanie markerów dla wszystkich kierowców, którzy mają koordynaty */}
                    {drivers.map(driver => {
                      const lat = Number((driver as any).currentLat);
                      const lng = Number((driver as any).currentLng);

                      // Nie rysuj markera, jeśli nie ma żadnych danych GPS
                      if (!lat || !lng) return null;
                    
                      return (
                        <Marker
                          key={driver.id}
                          position={{ lat, lng }}
                          icon={{
                            // Ikona auta dla online, szara kropka dla offline
                            url: (driver as any).isOnline 
                              ? "https://cdn-icons-png.flaticon.com/512/744/744465.png" 
                              : "https://maps.google.com/mapfiles/ms/icons/grey-dot.png",
                            scaledSize: new window.google.maps.Size(30, 30)
                          }}
                          onClick={() => setSelectedDriver(driver)} // 🔥 Kliknięcie w auto otwiera dymek
                        />
                      );
                    })}

                    {/* 🔥 POPRAWIONY DYMEK (InfoWindow) */}
                    {selectedDriver && (
                      <InfoWindow
                        position={{ 
                          lat: Number((selectedDriver as any).currentLat), 
                          lng: Number((selectedDriver as any).currentLng) 
                        }}
                        onCloseClick={() => setSelectedDriver(null)}
                      >
                        <div style={{ padding: '10px', minWidth: '180px', fontFamily: 'Arial' }}>
                          <h4 style={{ margin: '0 0 5px 0', color: '#0a1d56', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                            {selectedDriver.firstName} {selectedDriver.lastName}
                          </h4>
                          <p style={{ margin: '8px 0', fontSize: '13px' }}>
                            Status: <strong style={{ color: (selectedDriver as any).isOnline ? '#28a745' : '#dc3545' }}>
                              {(selectedDriver as any).isOnline ? '🟢 Online' : '⚪ Offline'}
                            </strong>
                          </p>
                          <p style={{ margin: '3px 0', fontSize: '12px', color: '#666' }}>
                            📞 Tel: {selectedDriver.phone || 'Nie podano'}
                          </p>
                          <p style={{ margin: '3px 0', fontSize: '12px', color: '#666' }}>
                            📧 Email: {selectedDriver.email}
                          </p>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </LoadScript>
              </main>
                  
            </div>
          </div>
        )}

        {/* UŻYTKOWNICY */}
        {activeTab === 'users' && (
          <div className="admin-content-card">
            <div className="card-header">
              <h2 className="card-title">Zarządzanie użytkownikami</h2>
              <button className="btn-add" onClick={() => {setShowForm(!showForm); setShowEditUserForm(false);}}>
                {showForm ? 'Anuluj' : 'Dodaj użytkownika'}
              </button>
            </div>

            <div className="search-bar-container">
              <input type="text" className="search-input" placeholder="Wyszukaj użytkownika..." value={searchTermUsers} onChange={(e) => {setSearchTermUsers(e.target.value); setCurrentPageUsers(1);}} />
              <span className="results-count">Znaleziono: {filteredUsers.length}</span>
            </div>

            {showForm && (
              <form className="admin-form" onSubmit={addUser}>
                <div className="form-grid">
                  <input type="text" placeholder="Username *" required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                  <input type="email" placeholder="Email *" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                  <input type="password" placeholder="Haslo *" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                  <input type="text" placeholder="Imie *" required value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} />
                  <input type="text" placeholder="Nazwisko *" required value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} />
                  <input type="text" placeholder="Telefon" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} />
                  <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}>
                    <option value="employee">Pracownik</option>
                    <option value="driver">Kierowca</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <button type="submit" className="btn-save">Zapisz</button>
              </form>
            )}

            {showEditUserForm && editingUser && (
              <form className="admin-form edit-form" onSubmit={updateUserSubmit}>
                <div className="form-grid">
                  <input type="text" placeholder="Username *" value={editUserData.username} onChange={e => setEditUserData({...editUserData, username: e.target.value})} />
                  <input type="email" placeholder="Email *" value={editUserData.email} onChange={e => setEditUserData({...editUserData, email: e.target.value})} />
                  <input type="text" placeholder="Nowe Hasło" value={editUserData.password} onChange={e => setEditUserData({...editUserData, password: e.target.value})} />
                  <input type="text" placeholder="Imie *" value={editUserData.firstName} onChange={e => setEditUserData({...editUserData, firstName: e.target.value})} />
                  <input type="text" placeholder="Nazwisko *" value={editUserData.lastName} onChange={e => setEditUserData({...editUserData, lastName: e.target.value})} />
                  <input type="text" placeholder="Telefon *" value={editUserData.phone} onChange={e => setEditUserData({...editUserData, phone: e.target.value})} />
                  <select value={editUserData.role} onChange={e => setEditUserData({...editUserData, role: e.target.value as any})}>
                    <option value="employee">Pracownik</option>
                    <option value="driver">Kierowca</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save">Zapisz zmiany</button>
                  <button type="button" onClick={() => setShowEditUserForm(false)} className="btn-cancel">Anuluj</button>
                </div>
              </form>
            )}

            <div className="table-container">
              <table className="modern-table">
                <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Rola</th><th>Akcje</th></tr></thead>
                <tbody>
                  {currentUsers.map(u => (
                    <tr key={u.id}>
                      <td>{String(u.id).substring(0,5)}</td>
                      <td>{u.username}</td><td>{u.email}</td>
                      <td><span className={`role-badge ${u.role}`}>{translateRole(u.role)}</span></td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-edit" onClick={() => startEditUser(u)}>Edytuj</button>
                          <button className="btn-delete" onClick={() => deleteUser(u.id)}>Usuń</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPagesUsers > 1 && (
              <div className="pagination-container">
                <button className="pagination-btn" disabled={currentPageUsers === 1} onClick={() => setCurrentPageUsers(v => v - 1)}>Poprzednia</button>
                <span className="pagination-info">Strona {currentPageUsers} z {totalPagesUsers}</span>
                <button className="pagination-btn" disabled={currentPageUsers === totalPagesUsers} onClick={() => setCurrentPageUsers(v => v + 1)}>Następna</button>
              </div>
            )}
          </div>
        )}

        {/* FLOTA */}
        {activeTab === 'fleet' && (
          <div className="admin-content-card">
            <div className="card-header">
              <h2 className="card-title">Zarządzanie flotą</h2>
              <button className="btn-add" onClick={() => {setShowVehicleForm(!showVehicleForm); setShowEditVehicleForm(false);}}>
                {showVehicleForm ? 'Anuluj' : 'Dodaj pojazd'}
              </button>
            </div>

            <div className="search-bar-container">
              <input type="text" className="search-input" placeholder="Wyszukaj pojazd..." value={searchTermVehicles} onChange={(e) => {setSearchTermVehicles(e.target.value); setCurrentPageVehicles(1);}} />
              <span className="results-count">Znaleziono: {filteredVehicles.length}</span>
            </div>

            {showVehicleForm && (
              <form className="admin-form" onSubmit={addVehicle}>
                <div className="form-grid">
                  <input type="text" placeholder="Rejestracja *" required value={newVehicle.registration} onChange={e => setNewVehicle({...newVehicle, registration: e.target.value})} />
                  <input type="text" placeholder="Marka *" required value={newVehicle.brand} onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})} />
                  <input type="text" placeholder="Model *" required value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} />
                </div>
                <button type="submit" className="btn-save">Zapisz</button>
              </form>
            )}

            {showEditVehicleForm && editingVehicle && (
              <form className="admin-form edit-form" onSubmit={updateVehicleSubmit}>
                <div className="form-grid">
                  <input type="text" value={editingVehicle.registration} onChange={e => setEditingVehicle({...editingVehicle, registration: e.target.value})} />
                  <select value={editingVehicle.status} onChange={e => setEditingVehicle({...editingVehicle, status: e.target.value as any})}>
                    <option value="dostępny">Dostępny</option>
                    <option value="w użyciu">W użyciu</option>
                    <option value="niedostępny">Niedostępny</option>
                  </select>
                  <select value={editingVehicle.isBreakdown ? 'true' : 'false'} onChange={e => setEditingVehicle({...editingVehicle, isBreakdown: e.target.value === 'true'})} >
                    <option value="false">Sprawny</option>
                    <option value="true">Awaria</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save">Zapisz zmiany</button>
                  <button type="button" onClick={() => {setShowEditVehicleForm(false); setEditingVehicle(null);}} className="btn-cancel">Anuluj</button>
                </div>
              </form>
            )}

            <div className="table-container">
              <table className="modern-table">
                <thead><tr><th>Rejestracja</th><th>Pojazd</th><th>Status</th><th>Stan</th><th>Akcje</th></tr></thead>
                <tbody>
                  {currentVehicles.map(v => (
                    <tr key={v.id}>
                      <td>{v.registration}</td><td>{v.brand} {v.model}</td>
                      <td><span className={`status-badge status-${v.status === 'dostępny' ? 'available' : 'in-use'}`}>{v.status}</span></td>
                      <td><button className={`breakdown-btn ${v.isBreakdown ? 'breakdown-active' : ''}`} onClick={() => toggleBreakdown(v.id, v.isBreakdown, v.registration)}>{v.isBreakdown ? 'Awaria' : 'Sprawny'}</button></td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-edit" onClick={() => startEditVehicle(v)}>Edytuj</button>
                          <button className="btn-delete" onClick={() => deleteVehicle(v.id)}>Usuń</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPagesVehicles > 1 && (
              <div className="pagination-container">
                <button className="pagination-btn" disabled={currentPageVehicles === 1} onClick={() => setCurrentPageVehicles(v => v - 1)}>Poprzednia</button>
                <span className="pagination-info">Strona {currentPageVehicles} z {totalPagesVehicles}</span>
                <button className="pagination-btn" disabled={currentPageVehicles === totalPagesVehicles} onClick={() => setCurrentPageVehicles(v => v + 1)}>Następna</button>
              </div>
            )}
          </div>
        )}

        {/* RAPORTY */}
        {activeTab === 'reports' && (
          <div className="admin-content-card">
            <div className="card-header"><h2 className="card-title">Raporty - Historia pojazdów</h2></div>
            <div className="search-bar-container">
              <label className="results-count" style={{marginRight: '10px'}}>Wybierz pojazd:</label>
              <select className="search-input" style={{maxWidth: '400px'}} value={selectedVehicleId || ''} onChange={(e) => handleVehicleSelect(Number(e.target.value))}>
                <option value="">-- Wybierz z listy --</option>
                {vehicles.map(v => (<option key={v.id} value={v.id}>{v.brand} {v.model} ({v.registration})</option>))}
              </select>
            </div>

            {selectedVehicleId ? (
              loadingLogs ? <p>Ładowanie historii...</p> : (
                <>
                  <div className="table-container">
                    <table className="modern-table">
                      <thead><tr><th>Data</th><th>Zdarzenie</th><th>Opis</th><th>Kierowca</th><th>Zmienił</th></tr></thead>
                      <tbody>
                        {currentReports.map(log => (
                          <tr key={log.id}>
                            <td>{formatDate(log.eventTime)}</td>
                            <td><span className="role-badge">{getEventTypeLabel(log.eventType)}</span></td>
                            <td>{log.description || '-'}</td>
                            <td>{log.driver ? `${log.driver.firstName} ${log.driver.lastName}` : '-'}</td>
                            <td>{log.changedBy || 'System'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPagesReports > 1 && (
                    <div className="pagination-container">
                      <button className="pagination-btn" disabled={currentPageReports === 1} onClick={() => setCurrentPageReports(v => v - 1)}>Poprzednia</button>
                      <span className="pagination-info">Strona {currentPageReports} z {totalPagesReports}</span>
                      <button className="pagination-btn" disabled={currentPageReports === totalPagesReports} onClick={() => setCurrentPageReports(v => v + 1)}>Następna</button>
                    </div>
                  )}
                </>
              )
            ) : (<div style={{padding: '40px', textAlign: 'center', color: '#666'}}>Wybierz pojazd powyżej.</div>)}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePageAdmin;