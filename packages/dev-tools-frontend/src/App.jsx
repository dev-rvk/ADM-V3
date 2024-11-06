import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Decompiler from './pages/Decompiler';
import JadxGUI from './pages/JadxGUI';
import Shellcode from './pages/Shellcode';
import MainNavbar from './components/MainNavbar';
import MainSidebar from './components/MainSidebar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <MainNavbar />
        <div className="main-content">
          <MainSidebar />
          <div className="content">
            <Routes>
              <Route path="/decompiler" element={<Decompiler />} />
              <Route path="/jadxgui" element={<JadxGUI />} />
              <Route path="/shellcode" element={<Shellcode />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
