import { useState } from 'react'
import '../styles/AdminPanel.css'

function AdminPanel() {
  const [activeSection, setActiveSection] = useState('dashboard')

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
        <button onClick={() => setActiveSection('drivers')}>👤 Kierowcy</button>
        <button onClick={() => setActiveSection('vehicles')}>🚗 Pojazdy</button>
        <button onClick={() => setActiveSection('reservations')}>📅 Rezerwacje</button>
        <button onClick={() => setActiveSection('reports')}>📈 Raporty</button>
      </nav>

      {/* Zawartość */}
      <main className="admin-content">
        {activeSection === 'dashboard' && (
          <div>
            <h2>Dashboard</h2>
            <p>Tu będą statystyki z bazy</p>
          </div>
        )}

        {activeSection === 'drivers' && (
          <div>
            <h2>Kierowcy</h2>
            <p>Tu będzie lista kierowców z bazy</p>
          </div>
        )}

        {activeSection === 'vehicles' && (
          <div>
            <h2>Pojazdy</h2>
            <p>Tu będzie lista pojazdów z bazy</p>
          </div>
        )}

        {activeSection === 'reservations' && (
          <div>
            <h2>Rezerwacje</h2>
            <p>Tu będą rezerwacje z bazy</p>
          </div>
        )}

        {activeSection === 'reports' && (
          <div>
            <h2>Raporty</h2>
            <p>Tu będą raporty z bazy</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminPanel