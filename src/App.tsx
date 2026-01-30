import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import Navbar from "./components/Navbar.tsx";
import AnimatedBackground from "./components/AnimatedBackground";
import Historique from "./pages/Historique.tsx";
import Stats from "./pages/Stats.tsx";
import Graphique from "./pages/graphique.tsx";
import TerrainMap from "./pages/TerrainMap.jsx";

function App() {
    return (
        <div className="relative min-h-screen">
            <AnimatedBackground/>
            <div className="relative z-10 backdrop-blur-[2px] bg-white/40 min-h-screen">
                <Router>
                    <Navbar/>
                    <Routes>
                        <Route path="/" element={<Home/>}/>
                        <Route path="/historique" element={<Historique/>}/>
                        <Route path="/rapports" element={<Stats/>}/>
                        <Route path="/graphiques" element={<Graphique/>}/>
                        <Route path="/map" element={<TerrainMap/>}/>
                    </Routes>
                </Router>
            </div>
        </div>
    );
}

export default App;