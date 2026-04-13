import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { vehicleService } from '../services/vehicleService';
import { vehicleLogService } from '../services/vehicleLogService';
import type { User, NewUser } from '../types/user.types';
import type { Vehicle, NewVehicle } from '../types/vehicle.types';
import type { VehicleLog } from '../types/vehicleLog.types';
import '../styles/HomePageAdmin.css';

const HomePageAdmin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [message, setMessage] = useState('Laczenie z backendem...');
  const [loggedUser, setLoggedUser] = useState<string | null>(() => localStorage.getItem('loggedUser'));
  const role = localStorage.getItem('userRole');
  
  const [firstName, setFirstName] = useState<string>(() => {
    const fullName = localStorage.getItem('userName');
    return fullName ? fullName.split(' ')[0] : 'Admin';
  });

  const itemsPerPage = 5;

  // --- LOGIKA UZYTKOWNIKOW ---
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

  // --- LOGIKA FLOTY ---
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

  const adminEmail = localStorage.getItem('loggedUser') || 'system';

  // ==================== FUNKCJE POMOCNICZE ====================
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    if (window.confirm('Czy na pewno chcesz sie wylogowac?')) {
      localStorage.clear();
      setLoggedUser(null);
      navigate('/');
    }
  };

  // ==================== LOGIKA: UZYTKOWNICY ====================
  const fetchUsers = async () => {
    setLoading(true);
    try { const data = await userService.getAll(); setUsers(data); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTermUsers.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTermUsers.toLowerCase())
  );

  const totalPagesUsers = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice((currentPageUsers - 1) * itemsPerPage, currentPageUsers * itemsPerPage);

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userService.create(newUser);
      setShowForm(false);
      setNewUser({ username: '', email: '', password: '', firstName: '', lastName: '', phone: '', role: 'employee' });
      fetchUsers();
    } catch (error) { console.error(error); }
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserData({
      username: user.username || '',
      email: user.email || '',
      password: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      role: user.role || 'employee'
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
    } catch (error) { alert('Blad aktualizacji'); }
  };

  // ==================== LOGIKA: FLOTA ====================
  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try { const data = await vehicleService.getAll(); setVehicles(data); }
    catch (error) { console.error(error); }
    finally { setLoadingVehicles(false); }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.registration.toLowerCase().includes(searchTermVehicles.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchTermVehicles.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTermVehicles.toLowerCase())
  );

  const totalPagesVehicles = Math.ceil(filteredVehicles.length / itemsPerPage);
  const currentVehicles = filteredVehicles.slice((currentPageVehicles - 1) * itemsPerPage, currentPageVehicles * itemsPerPage);

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vehicleService.create(newVehicle, adminEmail);
      setShowVehicleForm(false);
      setNewVehicle({ registration: '', brand: '', model: '', passengerCapacity: 4, status: 'dostępny', isBreakdown: false, notes: '' });
      fetchVehicles();
    } catch (error) { alert('Blad dodawania'); }
  };

  const startEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v);
    setShowEditVehicleForm(true);
    setShowVehicleForm(false);
  };

  const updateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    try {
      await vehicleService.update(editingVehicle.id, { ...editingVehicle }, adminEmail);
      setShowEditVehicleForm(false);
      fetchVehicles();
    } catch (error) { alert('Blad aktualizacji'); }
  };

  const toggleBreakdown = async (id: number, currentStatus: boolean, name: string) => {
    if (window.confirm(`Zmienic status awarii dla ${name}?`)) {
      try {
        await vehicleService.update(id, { isBreakdown: !currentStatus }, adminEmail);
        fetchVehicles();
      } catch (error) { alert('Blad'); }
    }
  };

  // ==================== EFFECTY ====================
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'fleet') fetchVehicles();
  }, [activeTab]);

  useEffect(() => {
    const user = localStorage.getItem('loggedUser');
    if (!user || role !== 'admin') navigate('/');
    fetch('http://localhost:3000').then(res => res.text())
      .then(data => setMessage(`Polaczono z backendem: ${data}`))
      .catch(() => setMessage('Brak polaczenia z serwerem'));
  }, [navigate, role]);

  const translateRole = (role: string) => {
    const roles: any = { admin: 'Administrator', driver: 'Kierowca', employee: 'Pracownik' };
    return roles[role] || role;
  };

  return (
    <div className="admin-page-wrapper"> {/* Główna strona - kursy */}
      <header className="admin-header">
        <div className="admin-logo"><span className="admin-logo-text">MICHELIN</span></div>
        <div className="admin-header-actions">
          <span className="welcome-text">Witaj, {firstName}!</span>
          <button className="admin-menu-btn" onClick={toggleMenu}>☰</button>
        </div>
      </header>

      <div className={`admin-side-menu ${isMenuOpen ? 'open' : ''}`}>
        <button className="close-menu-btn" onClick={toggleMenu}>Zamknij</button> 
        <div className="admin-menu-header">Panel Administratora</div> {/* boczne przyciski */}
        <button className={`admin-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => {setActiveTab('dashboard'); setIsMenuOpen(false);}}>Kursy</button>
        <button className={`admin-menu-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => {setActiveTab('users'); setIsMenuOpen(false);}}>Uzytkownicy</button>
        <button className={`admin-menu-item ${activeTab === 'fleet' ? 'active' : ''}`} onClick={() => {setActiveTab('fleet'); setIsMenuOpen(false);}}>Flota</button>
        <button className={`admin-menu-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => {setActiveTab('reports'); setIsMenuOpen(false);}}>Raporty</button>
        <div className="admin-menu-bottom">
          <button className="admin-menu-item logout-text" onClick={handleLogout}>Wyloguj sie</button>
        </div>
      </div>

      <div className="admin-main-content">
        {activeTab === 'dashboard' && (
          <div className="map-dashboard-layout">
            <div className={`admin-status-banner ${message.includes('Polaczono') ? 'banner-ok' : 'banner-error'}`}>{message}</div>
            <div className="admin-map-card"><span className="map-placeholder-text">Podgląd Mapy</span></div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-content-card">
            <div className="card-header">
              <h2 className="card-title">Zarządzanie uzytkownikami</h2>
              <button className="btn-add" onClick={() => {setShowForm(!showForm); setShowEditUserForm(false);}}>
                {showForm ? 'Anuluj' : 'Dodaj uzytkownika'}
              </button>
            </div>

            <div className="search-bar-container">
              <input type="text" className="search-input" placeholder="Wyszukaj uzytkownika po nazwie lub emailu" value={searchTermUsers} onChange={(e) => {setSearchTermUsers(e.target.value); setCurrentPageUsers(1);}} />
              <span className="results-count">Znaleziono: {filteredUsers.length}</span>
            </div>

            {showForm && (
              <form className="admin-form" onSubmit={addUser}> {/* Dodawanie użytkowników */}
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
              <form className="admin-form edit-form" onSubmit={updateUserSubmit}> {/* Edycja użytkowników */}
                <div className="form-grid">
                  <input type="text" placeholder="Username *" value={editUserData.username} onChange={e => setEditUserData({...editUserData, username: e.target.value})} />
                  <input type="email" placeholder="Email *" value={editUserData.email} onChange={e => setEditUserData({...editUserData, email: e.target.value})} />
                  <input type="text" placeholder="Hasło *" value={editUserData.password} onChange={e => setEditUserData({...editUserData, password: e.target.value})} />
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
                          <button className="btn-delete" onClick={() => {if(window.confirm('Usunac?')) userService.delete(u.id).then(fetchUsers)}}>Usun</button>
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
                <button className="pagination-btn" disabled={currentPageUsers === totalPagesUsers} onClick={() => setCurrentPageUsers(v => v + 1)}>Nastepna</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fleet' && (
          <div className="admin-content-card">
            <div className="card-header">
              <h2 className="card-title">Zarzadzanie flota</h2>
              <button className="btn-add" onClick={() => {setShowVehicleForm(!showVehicleForm); setShowEditVehicleForm(false);}}>
                {showVehicleForm ? 'Anuluj' : 'Dodaj pojazd'}
              </button>
            </div>

            <div className="search-bar-container">
              <input type="text" className="search-input" placeholder="Wyszukaj pojazd" value={searchTermVehicles} onChange={(e) => {setSearchTermVehicles(e.target.value); setCurrentPageVehicles(1);}} />
              <span className="results-count">Znaleziono: {filteredVehicles.length}</span>
            </div>

            {showVehicleForm && (
              <form className="admin-form" onSubmit={addVehicle}>
                <div className="form-grid">
                  <input type="text" placeholder="Rejestracja *" required onChange={e => setNewVehicle({...newVehicle, registration: e.target.value})} />
                  <input type="text" placeholder="Marka *" required onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})} />
                  <input type="text" placeholder="Model *" required onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} />
                </div>
                <button type="submit" className="btn-save">Zapisz</button>
              </form>
            )}

            {showEditVehicleForm && editingVehicle && (
              <form className="admin-form edit-form" onSubmit={updateVehicle}>
                <div className="form-grid">
                  <input type="text" value={editingVehicle.registration} onChange={e => setEditingVehicle({...editingVehicle, registration: e.target.value})} />
                  <select value={editingVehicle.status} onChange={e => setEditingVehicle({...editingVehicle, status: e.target.value as any})}>
                    <option value="dostępny">Dostepny</option>
                    <option value="w użyciu">W uzyciu</option>
                    <option value="niedostępny">Niedostepny</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save">Zapisz zmiany</button>
                  <button type="button" onClick={() => setShowEditVehicleForm(false)} className="btn-cancel">Anuluj</button>
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
                          <button className="btn-delete" onClick={() => {if(window.confirm('Usunac?')) vehicleService.delete(v.id, adminEmail).then(fetchVehicles)}}>Usun</button>
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
                <button className="pagination-btn" disabled={currentPageVehicles === totalPagesVehicles} onClick={() => setCurrentPageVehicles(v => v + 1)}>Nastepna</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePageAdmin;