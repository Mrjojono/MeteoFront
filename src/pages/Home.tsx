import {ArrowUp, ArrowDown, ArrowRight, MapPin} from 'lucide-react';

const Home = () => {
    return (
        <div>
            <div className="text-start flex flex-row items-center justify-around">
                <div>
                    <h1 className="text-4xl font-bold mb-2 text-black pt-8">Tableau de Bord Météo</h1>
                    <p className="text-gray-600 mb-6">Surveillez les conditions météorologiques en temps réel</p>
                </div>

                <div className="flex flex-row">
                    <div className="flex flex-row items-center">
                        <MapPin size={20} className="text-black mr-2"/>
                        <span className="text-xl font-medium text-black">Paris, France</span>
                    </div>
                    <button
                        className="ml-6 px-4 py-2 cursor-pointer duration-300 border border-black text-black rounded-md hover:bg-black hover:text-white transition-colors">
                        Changer d'Emplacement
                    </button>
                </div>
            </div>

            <div className="min-h-screen flex flex-col px-28 justify-center p-8">
                <div className="flex flex-row justify-between w-full mb-12 items-center">
                    <h2 className="text-2xl font-medium text-black">
                        Données en Temps Réel
                    </h2>
                    <span className="text-xl text-gray-600 self-end">MISE A JOUR : IL Y A 14:35</span>
                </div>

                {/* Grille de données */}
                <div className="grid grid-cols-3 gap-y-16 mb-20">
                    {/* Température */}
                    <div className="flex flex-col">
                        <span className="text-2xl mb-4 text-black">Température</span>
                        <span className="text-6xl font-bold mb-3 text-black">22.5°C</span>
                        <div
                            className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-md w-fit">
                            <ArrowUp size={16}/>
                            <span className="text-sm font-medium">1.2°C</span>
                        </div>
                    </div>

                    {/* Humidité */}
                    <div className="flex flex-col">
                        <span className="text-2xl mb-4 text-black">Humidité</span>
                        <span className="text-6xl font-bold mb-3 text-black">64%</span>
                        <div
                            className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-md w-fit">
                            <ArrowUp size={16}/>
                            <span className="text-sm font-medium">5%</span>
                        </div>
                    </div>

                    {/* Vent */}
                    <div className="flex flex-col">
                        <span className="text-2xl mb-4 text-black">Vent</span>
                        <span className="text-6xl font-bold mb-3 text-black">15.2 km/h</span>
                        <div
                            className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-md w-fit">
                            <ArrowDown size={16}/>
                            <span className="text-sm font-medium">2.1 km/h</span>
                        </div>
                    </div>

                    {/* Pression */}
                    <div className="flex flex-col">
                        <span className="text-2xl mb-4 text-black">Pression</span>
                        <span className="text-6xl font-bold mb-3 text-black">1013 hPa</span>
                        <div
                            className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-md w-fit">
                            <ArrowUp size={16}/>
                            <span className="text-sm font-medium">2 hPa</span>
                        </div>
                    </div>

                    {/* Précipitation */}
                    <div className="flex flex-col">
                        <span className="text-2xl mb-4 text-black">Précipitation</span>
                        <span className="text-6xl font-bold mb-3 text-black">0.0 mm</span>
                        <div
                            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md w-fit">
                            <ArrowRight size={16}/>
                            <span className="text-sm font-medium">0.0 mm</span>
                        </div>
                    </div>

                    {/* UV Index */}
                    <div className="flex flex-col">
                        <span className="text-2xl mb-4 text-black">UV Index</span>
                        <span className="text-6xl font-bold mb-3 text-black">7 (Élevé)</span>
                        <div
                            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md w-fit">
                            <ArrowRight size={16}/>
                            <span className="text-sm font-medium">0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;