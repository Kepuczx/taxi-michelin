import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AdminPanel from './pages/AdminPanel';

import Login  from './pages/LoginPage';


import HomePageAdmin from './pages/HomePageAdmin';
import HomePageUser from './pages/HomePageUser';
import HomePageDriver from './pages/HomePageDriver';
import ActiveTripPageUser from './pages/ActiveTripPageUser';
import ActiveTripPageDriver from './pages/ActiveTripPageDriver';



function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* Główna strona używa teraz komponentu HomePage */}
        <Route path="/" element={<Login />} />

        <Route path="/homeAdmin" element={<HomePageAdmin />} />
        <Route path="/homeUser" element={<HomePageUser />} />
        <Route path="/homeDriver" element={<HomePageDriver />} />
        <Route path="/active-trip" element={<ActiveTripPageUser />} />
        <Route path="/active-trip-driver" element={<ActiveTripPageDriver />} />
       

        {/* Panel administratora */}

        <Route path="/admin" element={<AdminPanel />} />

       

        {/* Ścieżka do logowania - teraz całkowicie oddzielna */}

        <Route path="/login" element={<Login />} />

      </Routes>

    </BrowserRouter>

  );

}



export default App;