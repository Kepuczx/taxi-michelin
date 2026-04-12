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

  // Stany dla edycji
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  
  const navigate = useNavigate()
  const role = localStorage.getItem('userRole');

  const [newUser, setNewUser] = useState<NewUser>({
    username: '', email: '', password: '', firstName: '', lastName: '', phone: '', role: 'employee'
  })

  // Blokada dla nie-adminów
  if (role !== 'admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <h1 style={{ color: '#d32f2f' }}>⛔ Odmowa dostępu</h1>
        <button onClick={() => navigate('/home')} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
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
      console.error('Błąd:', error)
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (activeSection === 'users') { fetchUsers() }
  }, [activeSection])

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await userService.create(newUser)
      setShowForm(false)
      setNewUser({ username: '', email: '', password: '', firstName: '', lastName: '', phone: '', role: 'employee' })
      fetchUsers()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert('Błąd dodawania')
    }
  }

  const deleteUser = async (id: number) => {
    if (window.confirm('Usunąć użytkownika?')) {
      try {
        await userService.delete(id)
        fetchUsers()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        alert('Błąd usuwania')
      }
    }
  }

  const openEditModal = (user: User) => {
    setUserToEdit(user)
    setEditEmail(user.email)
    setEditPassword('')
    setIsEditModalOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!userToEdit) return
    try {
      await userService.update(userToEdit.id, { email: editEmail, password: editPassword })
      alert('Zaktualizowano dane')
      setIsEditModalOpen(false)
      fetchUsers()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert('Błąd podczas aktualizacji')
    }
  }

  return (
    <div className="admin-page-wrapper">
      <div className="admin-main-container">
        <header className="admin-blue-header">
          <div className="logo-placeholder"><span className="logo-text">MICHELIN</span></div>
        </header>

        <nav className="admin-grey-nav">
          <button className={activeSection === 'users' ? 'active' : ''} onClick={() => setActiveSection('users')}>Użytkownicy</button>
          <button onClick={() => setActiveSection('fleet')}>Flota</button>
        </nav>

        <main className="admin-content-area">
          {activeSection === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Zarządzanie użytkownikami</h2>
                <button onClick={() => setShowForm(!showForm)}>{showForm ? '✕ Anuluj' : 'Dodaj użytkownika'}</button>
              </div>

              {showForm && (
                <form onSubmit={addUser} style={{ marginBottom: '20px', padding: '15px', background: '#f0f0f0', border: '1px solid #ccc' }}>
                  <input placeholder="Username" required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                  <input placeholder="Email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                  <input type="password" placeholder="Hasło" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                  <button type="submit">Zapisz</button>
                </form>
              )}

              {loading ? <p>Ładowanie...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#e6e6e6', textAlign: 'left' }}>
                      <th style={{ padding: '10px', textAlign: 'center' }}>ID</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Username</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Email</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>{user.id}</td>
                        <td style={{ padding: '10px' }}>{user.username}</td>
                        <td style={{ padding: '10px' }}>{user.email}</td>
                        <td style={{ padding: '10px' }}>
                          <button className="admin-btn-edit" onClick={() => openEditModal(user)}>Edytuj</button>
                          <button className="admin-btn-delete" onClick={() => deleteUser(user.id)}>Usuń</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </main>
      </div>

      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="admin-blue-header" style={{ height: '40px' }}>
              <span style={{ color: 'white', marginLeft: '15px', fontSize: '14px' }}>Edytuj: {userToEdit?.username}</span>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Email:</label>
                <input value={editEmail} onChange={e => setEditEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Nowe Hasło:</label>
                <input type="password" placeholder="Zostaw puste by nie zmieniać" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button className="btn-save" onClick={handleUpdateUser}>Zapisz</button>
                <button className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Anuluj</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel