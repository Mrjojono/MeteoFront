import {NavLink} from 'react-router-dom';
import {BarChart3, History, LayoutDashboard, FileText, Clock} from 'lucide-react';
import {useState, useEffect} from 'react';

const Navbar = () => {
    // État pour l'horloge
    const [time, setTime] = useState(new Date());

    // Mise à jour de l'heure chaque seconde
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);


    const formattedTime = time.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const linkStyle = "text-xl transition-all duration-300 pb-1 flex items-center gap-2";

    const navList = [
        {to: "/", label: "Dashboard", icon: <LayoutDashboard size={20}/>},
        {to: "/graphiques", label: "Graphiques", icon: <BarChart3 size={20}/>},
        {to: "/historique", label: "Historique", icon: <History size={20}/>},
        {to: "/rapports", label: "Rapports", icon: <FileText size={20}/>},
    ];

    const getActiveClass = ({isActive}: { isActive: boolean }) =>
        isActive
            ? `${linkStyle} text-black font-semibold border-b-2 border-black`
            : `${linkStyle} text-gray-500 hover:text-gray-900 border-b-2 border-transparent`;

    return (
        <div
            className="w-full py-6 bg-white/80 backdrop-blur-md sticky top-0 flex flex-col items-center justify-center z-50 shadow-sm">

            <div
                className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full shadow-inner">
                <Clock size={18} className="text-black animate-pulse"/>
                <span className="font-mono font-bold text-lg tracking-widest text-gray-800">
                    {formattedTime}
                </span>
            </div>

            {/* Navigation principale */}
            <nav className="flex gap-10">
                {navList.map((navItem) => (
                    <NavLink
                        key={navItem.to}
                        to={navItem.to}
                        className={getActiveClass}
                    >
                        {navItem.icon}
                        <span>{navItem.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default Navbar;