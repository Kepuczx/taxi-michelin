import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AdminPanel from './pages/AdminPanel'
import './App.css'

function App() {
  const [message, setMessage] = useState('Łączenie z backendem...')
  const [count, setCount] = useState(0)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    fetch('http://localhost:3000')
      .then(res => res.text())
      .then(data => setMessage(`✅ Połączono: ${data}`))
      .catch(err => setMessage('❌ Brak połączenia z backendem'))
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Główna strona - panel użytkownika */}
        <Route path="/" element={
          <div className="app">
            <header>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>🚖 SYSTEM ZARZĄDZANIA TRANSPORTEM</h1>
                <Link to="/admin">
                  <button style={{ background: '#2c3e50', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    👑 Panel Admina
                  </button>
                </Link>
              </div>
              <p className="status">{message}</p>
            </header>

            {/* Menu górne */}
            <div className="menu">
              <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</button>
              <button className={activeTab === 'vehicles' ? 'active' : ''} onClick={() => setActiveTab('vehicles')}>🚗 Pojazdy</button>
              <button className={activeTab === 'drivers' ? 'active' : ''} onClick={() => setActiveTab('drivers')}>👤 Kierowcy</button>
              <button className={activeTab === 'reservations' ? 'active' : ''} onClick={() => setActiveTab('reservations')}>📅 Rezerwacje</button>
              <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>📈 Raporty</button>
            </div>

            <main>
              {activeTab === 'dashboard' && (
                <div className="dashboard">
                  <div className="card">
                    <h3>📊 Licznik kliknięć</h3>
                    <p className="counter">{count}</p>
                    <button onClick={() => setCount(count + 1)}>Kliknij mnie</button>
                  </div>
                  <div className="card">
                    <h3>🚗 Szybkie akcje</h3>
                    <button>Nowa rezerwacja</button>
                    <button>Zamów taxi</button>
                  </div>
                  <div className="card">
                    <h3>📅 Dzisiaj</h3>
                    <p>Data: {new Date().toLocaleDateString('pl-PL')}</p>
                  </div>
                  <div className="card">
                    <h3>ℹ️ Status backendu</h3>
                    <p>{message}</p>
                  </div>
                </div>
              )}

              {activeTab === 'vehicles' && (
                <div className="dashboard">
                  <div className="card full-width">
                    <h3>🚗 Lista pojazdów</h3>
                    <p>Tutaj będzie lista pojazdów z backendu</p>
                    <button>➕ Dodaj pojazd</button>
                  </div>
                </div>
              )}

              {activeTab === 'drivers' && (
                <div className="dashboard">
                  <div className="card full-width">
                    <h3>👤 Lista kierowców</h3>
                    <p>Tutaj będzie lista kierowców z backendu</p>
                    <button>➕ Dodaj kierowcę</button>
                  </div>
                </div>
              )}

              {activeTab === 'reservations' && (
                <div className="dashboard">
                  <div className="card full-width">
                    <h3>📅 Rezerwacje</h3>
                    <p>Tutaj będą rezerwacje pojazdów</p>
                    <button>➕ Nowa rezerwacja</button>
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="dashboard">
                  <div className="card full-width">
                    <h3>📈 Raporty</h3>
                    <p>Tutaj będą raporty miesięczne</p>
                    <button>📊 Generuj raport</button>
                  </div>
                </div>
              )}
            </main>
          </div>
        } />
        
        {/* Panel administratora */}
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App