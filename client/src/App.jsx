import { Routes, Route } from 'react-router-dom';
import SalesOrderPage from './pages/SalesOrderPage';
import Pallet3DPage from './pages/Pallet3DPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SalesOrderPage />} />
      <Route path="/pallet3d" element={<Pallet3DPage />} />
    </Routes>
  );
}

export default App;
