import {useState, use, Suspense, startTransition} from 'react';
import {Download, Calendar, Loader2, BarChart3} from 'lucide-react';

// 1. Fonction de fetch (URL et paramètres inchangés)
const fetchWeatherStats = async (startDate: string, endDate: string) => {
    let url = `http://localhost:8000/api/weather/stats`;
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Erreur réseau");
    return response.json();
};


const StatsDisplay = ({statsPromise}: { statsPromise: Promise<any> }) => {
    const stats = use(statsPromise);

    const fmt = (val: any) => (val !== undefined && val !== null) ? Number(val).toFixed(1) : "--";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 animate-in fade-in duration-500">

            <div>
                <p className="text-gray-500 mb-1">Température:</p>
                <p className="text-2xl font-bold">
                    {fmt(stats?.t_min)}°C | <span
                    className="text-blue-600">{fmt(stats?.t_max)}°C</span> | {fmt(stats?.t_avg)}°C
                </p>
            </div>

            <div>
                <p className="text-gray-500 mb-1">Humidité:</p>
                <p className="text-2xl font-bold">
                    {fmt(stats?.h_min)}% | {fmt(stats?.h_max)}% | {fmt(stats?.h_avg)}%
                </p>
            </div>

            <div>
                <p className="text-gray-500 mb-1">Vent:</p>
                <p className="text-2xl font-bold leading-tight">
                    {fmt(stats?.w_min)} km/h | {fmt(stats?.w_max)} km/h |<br/>{fmt(stats?.w_avg)} km/h
                </p>
            </div>

            <div>
                <p className="text-gray-500 mb-1">Précipitation:</p>
                <p className="text-2xl font-bold">
                    {fmt(stats?.r_total)} mm
                </p>
            </div>
        </div>
    );
};

const WeatherReports = () => {

    const [startDate, setStartDate] = useState('2025-12-01');
    const [endDate, setEndDate] = useState('2025-12-31');

    const [statsPromise, setStatsPromise] = useState(() =>
        fetchWeatherStats('2025-12-01', '2025-12-31')
    );

    const handleGenerateStats = () => {
        startTransition(() => {
            setStatsPromise(fetchWeatherStats(startDate, endDate));
        });
    };

    const handleDownload = () => {
        if (!startDate || !endDate) return alert("Sélectionnez une période");
        const url = `http://localhost:8000/api/weather/report/pdf?start_date=${startDate}&end_date=${endDate}`;
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen text-black font-sans p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-5xl font-extrabold text-center mb-16">Stats & Rapports Météo</h1>

                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Statistiques Journalières</h2>

                    <Suspense fallback={
                        <div
                            className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-gray-50">
                            <Loader2 className="animate-spin mb-4 text-gray-400" size={32}/>
                            <p className="text-gray-500 font-medium">Récupération des données...</p>
                        </div>
                    }>
                        <StatsDisplay statsPromise={statsPromise}/>
                    </Suspense>
                </section>

                <section className="border-t pt-8">
                    <h2 className="text-2xl font-bold mb-6">Configuration</h2>

                    <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                        <span className="font-medium">Période:</span>
                        <div
                            className="flex items-center bg-gray-100 rounded-lg p-2 gap-2 border focus-within:border-black transition-all">
                            <Calendar size={18} className="text-gray-400"/>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                   className="bg-transparent outline-none cursor-pointer"/>
                        </div>
                        <span className="text-gray-400">→</span>
                        <div
                            className="flex items-center bg-gray-100 rounded-lg p-2 gap-2 border focus-within:border-black transition-all">
                            <Calendar size={18} className="text-gray-400"/>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                   className="bg-transparent outline-none cursor-pointer"/>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={handleGenerateStats}
                                className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-md font-bold hover:bg-gray-800 transition-all active:scale-95">
                            <BarChart3 size={20}/>
                            Générer les statistiques
                        </button>

                        <button onClick={handleDownload}
                                className="flex items-center gap-2 border-2 border-black px-8 py-3 rounded-md font-bold hover:bg-black hover:text-white transition-all active:scale-95">
                            <Download size={20}/>
                            Télécharger le PDF
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default WeatherReports;