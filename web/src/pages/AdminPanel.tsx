import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom' 
import { userService } from '../services/userService'
import type { User, NewUser } from '../types/user.types'
import '../styles/AdminPanel.css'

function AdminPanel() {
  const [activeSection, setActiveSection] = useState('users')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  const navigate = useNavigate()
  // POBIERAMY ROLĘ
  const role = localStorage.getItem('userRole');

  const [newUser, setNewUser] = useState<NewUser>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'employee'
  })

  // 🔥 TWARDA BLOKADA BEZPOŚREDNIO W WIDOKU
  if (role !== 'admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <h1 style={{ color: '#d32f2f' }}>⛔ Odmowa dostępu</h1>
        <p style={{ fontSize: '18px' }}>Ta strona jest przeznaczona wyłącznie dla Administratorów.</p>
        <button 
          onClick={() => navigate('/home')} 
          style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#0033a0', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Wróć na Stronę Główną
        </button>
      </div>
    );
  }
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
    <div className="admin-page-wrapper">

      {/* Główne okno aplikacji */}
      <div className="admin-main-container">
        
        {/* Granatowy pasek z logiem */}
        <header className="admin-blue-header">
          <div className="logo-placeholder">
            <span className="logo-text">MICHELIN</span>
          </div>
        </header>

        {/* Szary pasek z zakładkami */}
        <nav className="admin-grey-nav">
          <button 
            className={activeSection === 'users' ? 'active' : ''} 
            onClick={() => setActiveSection('users')}
          >
            Zarządzanie użytkownikami
          </button>
          <button 
            className={activeSection === 'fleet' ? 'active' : ''} 
            onClick={() => setActiveSection('fleet')}
          >
            Zarządzanie flotą
          </button>
          <button 
            className={activeSection === 'reports' ? 'active' : ''} 
            onClick={() => setActiveSection('reports')}
          >
            Raporty
          </button>
          <button 
            className={activeSection === 'blocks' ? 'active' : ''} 
            onClick={() => setActiveSection('blocks')}
          >
            Blokady pojazdów
          </button>
          <button 
            className={activeSection === 'stats' ? 'active' : ''} 
            onClick={() => setActiveSection('stats')}
          >
            Statystyki
          </button>
        </nav>

        {/* Białe pole na zawartość */}
        <main className="admin-content-area">
          
          {activeSection === 'users' && (
            <div className="users-section">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Zarządzanie użytkownikami</h2>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                  {showForm ? '✕ Anuluj' : 'Dodaj użytkownika'}
                </button>
              </div>

              {showForm && (
                <form className="user-form" onSubmit={addUser} style={{ marginBottom: '30px', padding: '20px', background: '#f5f5f5', border: '1px solid #ccc' }}>
                  <h3>Nowy użytkownik</h3>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input type="text" placeholder="Username *" required value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} />
                    <input type="email" placeholder="Email *" required value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
                    <input type="password" placeholder="Hasło *" required value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                    <input type="text" placeholder="Imię *" required value={newUser.firstName} onChange={(e) => setNewUser({...newUser, firstName: e.target.value})} />
                    <input type="text" placeholder="Nazwisko *" required value={newUser.lastName} onChange={(e) => setNewUser({...newUser, lastName: e.target.value})} />
                    <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}>
                      <option value="employee">Pracownik</option>
                      <option value="driver">Kierowca</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <button type="submit" style={{ marginRight: '10px' }}>Zapisz</button>
                    <button type="button" onClick={() => setShowForm(false)}>Anuluj</button>
                  </div>
                </form>
              )}

              {loading ? (
                <p>Ładowanie...</p>
              ) : (
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#eee', textAlign: 'left' }}>
                      <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>ID</th>
                      <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Username</th>
                      <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Email</th>
                      <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Rola</th>
                      <th style={{ padding: '10px', borderBottom: '2px solid #ccc' }}>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>{user.id}</td>
                        <td style={{ padding: '10px' }}>{user.username}</td>
                        <td style={{ padding: '10px' }}>{user.email}</td>
                        <td style={{ padding: '10px' }}>{user.role}</td>
                        <td style={{ padding: '10px' }}>
                          <button onClick={() => deleteUser(user.id)}>Usuń</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeSection === 'fleet' && <div>Sekcja Zarządzanie flotą w budowie...</div>}
          {activeSection === 'reports' && <div>Sekcja Raporty w budowie...</div>}
          {activeSection === 'blocks' && <div>Sekcja Blokady pojazdów w budowie...</div>}
          {activeSection === 'stats' && <div>Sekcja Statystyki w budowie...</div>}

        </main>
      </div>
    </div>
  )
}

export default AdminPanel