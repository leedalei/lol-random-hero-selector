import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import OfflinePage from './pages/OfflinePage';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/offline" element={<OfflinePage />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;