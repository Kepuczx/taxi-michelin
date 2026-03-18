import { useState, useEffect } from 'react'
import { userService } from '../services/userService'
import type { User, NewUser } from '../types/user.types'  // ← DODAJ "type"
import '../styles/AdminPanel.css'

function AdminPanel() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  const [newUser, setNewUser] = useState<NewUser>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'employee'
  })

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
    if (window.confirm('Na pewno usunąć?')) {
      try {
        await userService.delete(id)
        fetchUsers()
      } catch (error) {
        console.error('Błąd usuwania:', error)
      }
    }
  }

  useEffect(() => {
    if (activeSection === 'users') {
      fetchUsers()
    }
  }, [activeSection])

  return (
    <div className="admin-panel">
      {/* Górny pasek */}
      <header className="admin-header">
        <h1>🚖 PANEL ADMINISTRATORA</h1>
        <div>
          <span>Zalogowany: Admin</span>
          <button>Wyloguj</button>
        </div>
      </header>

      {/* Menu */}
      <nav className="admin-nav">
        <button onClick={() => setActiveSection('dashboard')}>📊 Dashboard</button>
        <button onClick={() => setActiveSection('users')}>👥 Użytkownicy</button>
        <button onClick={() => setActiveSection('drivers')}>👤 Kierowcy</button>
        <button onClick={() => setActiveSection('vehicles')}>🚗 Pojazdy</button>
        <button onClick={() => setActiveSection('reservations')}>📅 Rezerwacje</button>
        <button onClick={() => setActiveSection('reports')}>📈 Raporty</button>
      </nav>

      {/* Zawartość */}
      <main className="admin-content">
        {/* DASHBOARD */}
        {activeSection === 'dashboard' && (
          <div className="dashboard">
            <div className="stats-card">
              <h3>👥 Użytkownicy</h3>
              <p className="stat-number">{users.length}</p>
            </div>
            <div className="stats-card">
              <h3>🚗 Pojazdy</h3>
              <p className="stat-number">0</p>
            </div>
            <div className="stats-card">
              <h3>📅 Rezerwacje</h3>
              <p className="stat-number">0</p>
            </div>
          </div>
        )}

        {/* UŻYTKOWNICY */}
        {activeSection === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h2>👥 Zarządzanie użytkownikami</h2>
              <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                {showForm ? '✕ Anuluj' : '➕ Dodaj użytkownika'}
              </button>
            </div>

            {/* Formularz dodawania */}
            {showForm && (
              <form className="user-form" onSubmit={addUser}>
                <h3>Nowy użytkownik</h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      required
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Hasło *</label>
                    <input
                      type="password"
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Imię *</label>
                    <input
                      type="text"
                      required
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Nazwisko *</label>
                    <input
                      type="text"
                      required
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Telefon</label>
                    <input
                      type="text"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Rola</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                    >
                      <option value="employee">Pracownik</option>
                      <option value="driver">Kierowca</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">Zapisz</button>
                  <button type="button" onClick={() => setShowForm(false)}>Anuluj</button>
                </div>
              </form>
            )}

            {/* Lista użytkowników */}
            {loading ? (
              <p>Ładowanie...</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Imię</th>
                    <th>Nazwisko</th>
                    <th>Rola</th>
                    <th>Status</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.firstName}</td>
                      <td>{user.lastName}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === 'admin' ? '👑 Admin' : 
                           user.role === 'driver' ? '👤 Kierowca' : '👤 Pracownik'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? '✅ Aktywny' : '❌ Nieaktywny'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-icon" title="Edytuj">✏️</button>
                        <button className="btn-icon" title="Usuń" onClick={() => deleteUser(user.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Inne sekcje (na razie puste) */}
        {activeSection === 'drivers' && <div>Sekcja kierowców w budowie</div>}
        {activeSection === 'vehicles' && <div>Sekcja pojazdów w budowie</div>}
        {activeSection === 'reservations' && <div>Sekcja rezerwacji w budowie</div>}
        {activeSection === 'reports' && <div>Sekcja raportów w budowie</div>}
      </main>
    </div>
  )
}

export default AdminPanel