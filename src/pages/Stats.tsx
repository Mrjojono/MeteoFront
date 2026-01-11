import {useState} from 'react';
import {Download, Calendar} from 'lucide-react';

const WeatherReports = () => {

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');


    const handleDownload = () => {
        if (!startDate || !endDate) {
            alert("Veuillez sélectionner une période d'abord !");
            return;
        }
        console.log(`Téléchargement du rapport du ${startDate} au ${endDate}`);
        alert(`Préparation du téléchargement du rapport...`);
    };

    return (
        <div className="min-h-screen  text-black font-sans p-8">


            <div className="max-w-4xl mx-auto">
                <h1 className="text-5xl font-extrabold text-center mb-16">Stats & Rapports Météo</h1>

                {/* Statistiques Journalières */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Statistiques Journalières</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                        {/* Température */}
                        <div>
                            <p className="text-gray-500 mb-1">Température:</p>
                            <p className="text-2xl font-bold">18.5°C | <span className="text-blue-600">24.2°C</span> |
                                21.3°C</p>
                        </div>
                        {/* Humidité */}
                        <div>
                            <p className="text-gray-500 mb-1">Humidité:</p>
                            <p className="text-2xl font-bold">55% | 72% | 63%</p>
                        </div>
                        {/* Vent */}
                        <div>
                            <p className="text-gray-500 mb-1">Vent:</p>
                            <p className="text-2xl font-bold leading-tight">
                                5.0 km/h | 22.1 km/h |<br/>14.8 km/h
                            </p>
                        </div>
                        {/* Précipitation */}
                        <div>
                            <p className="text-gray-500 mb-1">Précipitation:</p>
                            <p className="text-2xl font-bold">0.0 mm | 1.2 mm | 2.5 mm</p>
                        </div>
                    </div>
                </section>

                {/* Section Rapports et Sélection de Date */}
                <section className="border-t pt-8">
                    <h2 className="text-2xl font-bold mb-6">Rapports</h2>

                    <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                        <span className="font-medium">Période:</span>

                        <div
                            className="flex items-center bg-gray-100 rounded-lg p-2 gap-2 border focus-within:border-black transition-all">
                            <Calendar size={18} className="text-gray-400"/>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent outline-none cursor-pointer"
                            />
                        </div>

                        <span className="text-gray-400">→</span>

                        <div
                            className="flex items-center bg-gray-100 rounded-lg p-2 gap-2 border focus-within:border-black transition-all">
                            <Calendar size={18} className="text-gray-400"/>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent outline-none cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            className="bg-black text-white px-8 py-3 rounded-md font-bold hover:bg-gray-800 transition-all active:scale-95">
                            Détails
                        </button>

                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 border-2 border-black px-8 py-3 rounded-md font-bold hover:bg-black hover:text-white transition-all active:scale-95"
                        >
                            <Download size={20}/>
                            Télécharger
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default WeatherReports;