import {NavLink} from 'react-router-dom';

const Navbar = () => {
    const linkStyle = "text-2xl transition-all duration-300 pb-1";

    const navList = [
        {to: "/", label: "Dashboard"},
        {to: "/graphiques", label: "Graphiques"},
        {to: "/historique", label: "Historique"},
        {to: "/rapports", label: "Rapports"},
    ]

    const getActiveClass = ({isActive}: { isActive: boolean }) =>
        isActive
            ? `${linkStyle} text-black font-semibold border-b-2 border-black`
            : `${linkStyle} text-gray-500 hover:text-gray-900 border-b-2 border-transparent`;

    return (
        <div className="w-full py-10 bg-transparent flex flex-col items-center justify-center z-50 relative">
            <nav className="flex gap-12">
                {navList.map((navItem) => (
                    <NavLink
                        key={navItem.to}
                        to={navItem.to}
                        className={getActiveClass}
                    >
                        {navItem.label}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default Navbar;