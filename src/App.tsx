import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";
import AnimatedBackground from "./components/AnimatedBackground";
import Dashboard from "./pages/Dashboard.tsx";
import Home from "./pages/Home";
import Historique from "./pages/Historique.tsx";
import Stats from "./pages/Stats.tsx";
import Graphique from "./pages/graphique.tsx";
import TerrainMap from "./pages/TerrainMap.jsx";

function Shell() {
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  if (isDashboard) {
    return (
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    );
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen bg-white/40 backdrop-blur-[2px]">
        <Navbar />
        <Routes>
          <Route path="/live" element={<Home />} />
          <Route path="/historique" element={<Historique />} />
          <Route path="/rapports" element={<Stats />} />
          <Route path="/graphiques" element={<Graphique />} />
          <Route path="/map" element={<TerrainMap />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Shell />
    </Router>
  );
}

export default App;
