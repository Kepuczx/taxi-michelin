import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../services/userService'
import { vehicleService } from '../services/vehicleService'
import { vehicleLogService } from '../services/vehicleLogService'
import type { User, NewUser } from '../types/user.types'
import type { Vehicle, NewVehicle } from '../types/vehicle.types'
import type { VehicleLog } from '../types/vehicleLog.types'
import '../styles/AdminPanel.css'

function AdminPanel() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('users')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Stan dla użytkowników
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  // Stan dla pojazdów
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [showEditVehicleForm, setShowEditVehicleForm] = useState(false)
  
  // Stan dla logów pojazdów
  const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)
  const [loadingLogs, setLoadingLogs] = useState(false)
  
  // Pobierz dane zalogowanego admina
  const adminEmail = localStorage.getItem('userEmail') || 'system'
  const adminName = localStorage.getItem('userName') || 'Admin'
  
  const [newUser, setNewUser] = useState<NewUser>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'employee'
  })

  const [newVehicle, setNewVehicle] = useState<NewVehicle>({
    registration: '',
    brand: '',
    model: '',
    passengerCapacity: 4,
    status: 'dostępny',
    isBreakdown: false,
    notes: ''
  })

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const handleLogout = () => {
    if (window.confirm('Czy na pewno chcesz się wylogować?')) {
      localStorage.removeItem('userToken')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userName')
      localStorage.removeItem('userId')
      navigate('/login')
    }
  }

  // ==================== UŻYTKOWNICY ====================
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await userService.getAll()
      setUsers(data)
    } catch (error) {
      console.error('Błąd pobierania użytkowników:', error)
    } finally {
      setLoading(false)
    }
  }

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await userService.create(newUser)
      setShowForm(false)
      setNewUser({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'employee'
      })
      fetchUsers()
    } catch (error) {
      console.error('Błąd dodawania użytkownika:', error)
    }
  }

  const deleteUser = async (id: number) => {
    if (window.confirm('Na pewno usunąć użytkownika?')) {
      try {
        await userService.delete(id)
        fetchUsers()
      } catch (error) {
        console.error('Błąd usuwania:', error)
      }
    }
  }

  // ==================== POJAZDY ====================
  const fetchVehicles = async () => {
    setLoadingVehicles(true)
    try {
      const data = await vehicleService.getAll()
      setVehicles(data)
    } catch (error) {
      console.error('Błąd pobierania pojazdów:', error)
    } finally {
      setLoadingVehicles(false)
    }
  }

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await vehicleService.create(newVehicle, adminEmail)
      setShowVehicleForm(false)
      setNewVehicle({
        registration: '',
        brand: '',
        model: '',
        passengerCapacity: 4,
        status: 'dostępny',
        isBreakdown: false,
        notes: ''
      })
      fetchVehicles()
    } catch (error) {
      console.error('Błąd dodawania pojazdu:', error)
      alert('Błąd dodawania pojazdu')
    }
  }

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

  const startEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setShowEditVehicleForm(true)
    setShowVehicleForm(false)
  }

  const updateVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVehicle) return
    try {
      await vehicleService.update(editingVehicle.id, {
        registration: editingVehicle.registration,
        brand: editingVehicle.brand,
        model: editingVehicle.model,
        passengerCapacity: editingVehicle.passengerCapacity,
        status: editingVehicle.status,
        notes: editingVehicle.notes
      }, adminEmail || 'System')
      setShowEditVehicleForm(false)
      setEditingVehicle(null)
      fetchVehicles()
    } catch (error) {
      console.error('Błąd aktualizacji pojazdu:', error)
      alert('Błąd aktualizacji pojazdu')
    }
  }

  const toggleBreakdown = async (id: number, currentStatus: boolean, vehicleName: string) => {
    const newStatus = !currentStatus;
    const actionText = newStatus ? 'zgłosić awarię' : 'usunąć awarię';
    const confirmMessage = `Czy na pewno chcesz ${actionText} dla pojazdu ${vehicleName}?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await vehicleService.update(id, { isBreakdown: newStatus }, adminEmail);
        await fetchVehicles();
      } catch (error) {
        console.error('Błąd zmiany statusu awarii:', error);
        alert('Błąd zmiany statusu awarii');
      }
    }
  };

  // ==================== LOGI POJAZDÓW ====================
  const fetchLogsForVehicle = async (vehicleId: number) => {
    setLoadingLogs(true);
    try {
      const data = await vehicleLogService.getByVehicleId(vehicleId);
      setVehicleLogs(data);
    } catch (error) {
      console.error('Błąd pobierania logów:', error);
      alert('Błąd pobierania historii pojazdu');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleVehicleSelect = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
    if (vehicleId) {
      fetchLogsForVehicle(vehicleId);
    } else {
      setVehicleLogs([]);
    }
  };

  // ==================== EVENTY ====================
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'fleet') {
      fetchVehicles()
    }
  }, [activeTab])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTypeLabel = (eventType: string) => {
    switch(eventType) {
      case 'rozpoczęcie_pracy': return { label: '🚗 Rozpoczęcie pracy', class: 'event-start' };
      case 'zakończenie_pracy': return { label: '🏁 Zakończenie pracy', class: 'event-end' };
      case 'przejazd': return { label: '🚖 Przejazd', class: 'event-ride' };
      case 'awaria': return { label: '⚠️ Awaria', class: 'event-breakdown' };
      default: return { label: '📝 Uwagi', class: 'event-note' };
    }
  };

  return (
    <div className="admin-page-wrapper">
      
      {/* NAGŁÓWEK */}
      <header className="admin-header">
        <div className="admin-logo">
          <span className="admin-logo-text">MICHELIN</span>
        </div>
        <div className="admin-header-actions">
          <span className="welcome-text">Witaj, {adminName}!</span>
          <button className="admin-menu-btn" onClick={toggleMenu}>☰</button>
        </div>
      </header>

      {/* WYSUWANE MENU Z PRAWEJ */}
      <div className={`admin-side-menu ${isMenuOpen ? 'open' : ''}`}>
        <button className="close-menu-btn" onClick={toggleMenu}>✕ Zamknij</button>
        
        <div className="admin-menu-header">👑 Panel Administratora</div>
        
        <button 
          className={`admin-menu-item ${activeTab === 'users' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('users'); setIsMenuOpen(false); }}
        >
          👥 Użytkownicy
        </button>
        <button 
          className={`admin-menu-item ${activeTab === 'fleet' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('fleet'); setIsMenuOpen(false); }}
        >
          🚗 Flota
        </button>
        <button 
          className={`admin-menu-item ${activeTab === 'reports' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('reports'); setIsMenuOpen(false); }}
        >
          📋 Raporty
        </button>
        <button 
          className="admin-menu-item" 
          onClick={() => { setActiveTab('blocks'); setIsMenuOpen(false); }}
        >
          🔒 Blokady pojazdów
        </button>
        <button 
          className="admin-menu-item" 
          onClick={() => { setActiveTab('stats'); setIsMenuOpen(false); }}
        >
          📊 Statystyki
        </button>
        
        <div className="admin-menu-bottom">
          <button className="admin-menu-item logout-text" onClick={handleLogout}>
            Wyloguj się
          </button>
        </div>
      </div>

      {/* GŁÓWNY OBSZAR ROBOCZY */}
      <div className="admin-main-content">
        
        {/* SEKCJA UŻYTKOWNICY */}
        {activeTab === 'users' && (
          <div className="admin-content-card">
            <div className="card-header">
              <h2 className="card-title">👥 Zarządzanie użytkownikami</h2>
              <button className="btn-add" onClick={() => setShowForm(!showForm)}>
                {showForm ? '✕ Anuluj' : '➕ Dodaj użytkownika'}
              </button>
            </div>

            {showForm && (
              <form className="admin-form" onSubmit={addUser}>
                <h3>Nowy użytkownik</h3>
                <div className="form-grid">
                  <input type="text" placeholder="Username *" required value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} />
                  <input type="email" placeholder="Email *" required value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
                  <input type="password" placeholder="Hasło *" required value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                  <input type="text" placeholder="Imię *" required value={newUser.firstName} onChange={(e) => setNewUser({...newUser, firstName: e.target.value})} />
                  <input type="text" placeholder="Nazwisko *" required value={newUser.lastName} onChange={(e) => setNewUser({...newUser, lastName: e.target.value})} />
                  <input type="text" placeholder="Telefon" value={newUser.phone} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} />
                  <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}>
                    <option value="employee">Pracownik</option>
                    <option value="driver">Kierowca</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save">Zapisz</button>
                  <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Anuluj</button>
                </div>
              </form>
            )}

            {loading ? (
              <p>Ładowanie...</p>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Rola</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                        <td>
                          <button className="btn-delete" onClick={() => deleteUser(user.id)}>🗑️ Usuń</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SEKCJA FLOTA */}
        {activeTab === 'fleet' && (
          <div className="admin-content-card">
            <div className="card-header">
              <h2 className="card-title">🚗 Zarządzanie flotą</h2>
              <button className="btn-add" onClick={() => {
                setShowVehicleForm(!showVehicleForm)
                setShowEditVehicleForm(false)
                setEditingVehicle(null)
              }}>
                {showVehicleForm ? '✕ Anuluj' : '➕ Dodaj pojazd'}
              </button>
            </div>

            {showVehicleForm && (
              <form className="admin-form" onSubmit={addVehicle}>
                <h3>Nowy pojazd</h3>
                <div className="form-grid">
                  <input type="text" placeholder="Rejestracja *" required value={newVehicle.registration} onChange={(e) => setNewVehicle({...newVehicle, registration: e.target.value})} />
                  <input type="text" placeholder="Marka *" required value={newVehicle.brand} onChange={(e) => setNewVehicle({...newVehicle, brand: e.target.value})} />
                  <input type="text" placeholder="Model *" required value={newVehicle.model} onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})} />
                  <input type="number" placeholder="Ilość miejsc" value={newVehicle.passengerCapacity} onChange={(e) => setNewVehicle({...newVehicle, passengerCapacity: parseInt(e.target.value)})} />
                  <select value={newVehicle.status} onChange={(e) => setNewVehicle({...newVehicle, status: e.target.value as any})}>
                    <option value="dostępny">✅ Dostępny</option>
                    <option value="w użyciu">🚗 W użyciu</option>
                    <option value="niedostępny">❌ Niedostępny</option>
                  </select>
                  <input type="text" placeholder="Notatki" value={newVehicle.notes || ''} onChange={(e) => setNewVehicle({...newVehicle, notes: e.target.value})} />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save">Zapisz</button>
                  <button type="button" className="btn-cancel" onClick={() => setShowVehicleForm(false)}>Anuluj</button>
                </div>
              </form>
            )}

            {showEditVehicleForm && editingVehicle && (
              <form className="admin-form edit-form" onSubmit={updateVehicle}>
                <h3>Edytuj pojazd</h3>
                <div className="form-grid">
                  <input type="text" placeholder="Rejestracja *" required value={editingVehicle.registration} onChange={(e) => setEditingVehicle({...editingVehicle, registration: e.target.value})} />
                  <input type="text" placeholder="Marka *" required value={editingVehicle.brand} onChange={(e) => setEditingVehicle({...editingVehicle, brand: e.target.value})} />
                  <input type="text" placeholder="Model *" required value={editingVehicle.model} onChange={(e) => setEditingVehicle({...editingVehicle, model: e.target.value})} />
                  <input type="number" placeholder="Ilość miejsc" value={editingVehicle.passengerCapacity} onChange={(e) => setEditingVehicle({...editingVehicle, passengerCapacity: parseInt(e.target.value)})} />
                  <select value={editingVehicle.status} onChange={(e) => setEditingVehicle({...editingVehicle, status: e.target.value as any})}>
                    <option value="dostępny">✅ Dostępny</option>
                    <option value="w użyciu">🚗 W użyciu</option>
                    <option value="niedostępny">❌ Niedostępny</option>
                  </select>
                  <input type="text" placeholder="Notatki" value={editingVehicle.notes || ''} onChange={(e) => setEditingVehicle({...editingVehicle, notes: e.target.value})} />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save">Zapisz zmiany</button>
                  <button type="button" className="btn-cancel" onClick={() => { setShowEditVehicleForm(false); setEditingVehicle(null); }}>Anuluj</button>
                </div>
              </form>
            )}

            {loadingVehicles ? (
              <p>Ładowanie...</p>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Rejestracja</th>
                      <th>Marka/Model</th>
                      <th>Miejsca</th>
                      <th>Status</th>
                      <th>Kierowca</th>
                      <th>Awaria</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map(vehicle => (
                      <tr key={vehicle.id}>
                        <td>{vehicle.id}</td>
                        <td>{vehicle.registration}</td>
                        <td>{vehicle.brand} {vehicle.model}</td>
                        <td>{vehicle.passengerCapacity}</td>
                        <td>
                          <span className={`status-badge ${vehicle.status === 'dostępny' ? 'status-available' : vehicle.status === 'w użyciu' ? 'status-in-use' : 'status-unavailable'}`}>
                            {vehicle.status === 'dostępny' ? '✅ Dostępny' : vehicle.status === 'w użyciu' ? '🚗 W użyciu' : '❌ Niedostępny'}
                          </span>
                        </td>
                        <td>{vehicle.currentDriver ? `${vehicle.currentDriver.firstName} ${vehicle.currentDriver.lastName}` : '—'}</td>
                        <td>
                          <button 
                            className={`breakdown-btn ${vehicle.isBreakdown ? 'breakdown-active' : ''}`}
                            onClick={() => toggleBreakdown(vehicle.id, vehicle.isBreakdown, `${vehicle.brand} ${vehicle.model} (${vehicle.registration})`)}
                          >
                            {vehicle.isBreakdown ? '🔴 Awaria' : '🟢 Sprawny'}
                          </button>
                        </td>
                        <td>
                          <button className="btn-edit" onClick={() => startEditVehicle(vehicle)}>✏️ Edytuj</button>
                          <button className="btn-delete" onClick={() => deleteVehicle(vehicle.id)}>🗑️ Usuń</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SEKCJA RAPORTY */}
        {activeTab === 'reports' && (
          <div className="admin-content-card">
            <h2 className="card-title">📋 Raporty - Historia pojazdów</h2>
            
            <div className="vehicle-selector">
              <label>Wybierz pojazd:</label>
              <select 
                value={selectedVehicleId || ''} 
                onChange={(e) => handleVehicleSelect(Number(e.target.value))}
              >
                <option value="">-- Wybierz pojazd --</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} ({vehicle.registration})
                  </option>
                ))}
              </select>
            </div>

            {selectedVehicleId ? (
              loadingLogs ? (
                <p>Ładowanie historii pojazdu...</p>
              ) : vehicleLogs.length === 0 ? (
                <div className="empty-state">
                  <p>Brak logów dla tego pojazdu.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Typ zdarzenia</th>
                        <th>Opis</th>
                        <th>Kierowca</th>
                        <th>Zmienił</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleLogs.map(log => {
                        const eventInfo = getEventTypeLabel(log.eventType);
                        return (
                          <tr key={log.id}>
                            <td>{formatDate(log.eventTime)}</td>
                            <td><span className={`event-badge ${eventInfo.class}`}>{eventInfo.label}</span></td>
                            <td>{log.description || '-'}</td>
                            <td>{log.driver ? `${log.driver.firstName} ${log.driver.lastName}` : '-'}</td>
                            <td>{log.changedBy || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="empty-state">
                <p>Wybierz pojazd z listy, aby zobaczyć jego historię.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'blocks' && (
          <div className="admin-content-card">
            <h2 className="card-title">🔒 Blokady pojazdów</h2>
            <p>Sekcja w budowie...</p>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="admin-content-card">
            <h2 className="card-title">📊 Statystyki</h2>
            <p>Sekcja w budowie...</p>
          </div>
        )}

      </div>
    </div>
  )
}

export default AdminPanel