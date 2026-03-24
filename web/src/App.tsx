import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AdminPanel from './pages/AdminPanel';

import Login  from './pages/LoginPage';

import HomePage from './pages/HomePage'; // Importujemy nowy komponent



function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* Główna strona używa teraz komponentu HomePage */}

        <Route path="/" element={<HomePage />} />

       

        {/* Panel administratora */}

        <Route path="/admin" element={<AdminPanel />} />

       

        {/* Ścieżka do logowania - teraz całkowicie oddzielna */}

        <Route path="/login" element={<Login />} />

      </Routes>

    </BrowserRouter>

  );

}



export default App;