import {useState, useEffect} from 'react';
import {ArrowUp, ArrowDown, ArrowRight, MapPin} from 'lucide-react';

const Home = () => {

    const [weather, setWeather] = useState<any>(null);
    const [prevWeather, setPrevWeather] = useState<any>(null);

    useEffect(() => {

        const socket = new WebSocket("ws://localhost:8000/ws/weather");

        socket.onmessage = (event) => {
            const newData = JSON.parse(event.data);
            setWeather((current: any) => {
                setPrevWeather(current);
                return newData;
            });
        };

        return () => socket.close();
    }, []);


    const getTrend = (currentVal: number, prevVal: number) => {
        if (!prevVal || currentVal === prevVal) return {
            icon: <ArrowRight size={16}/>,
            color: "bg-gray-100 text-gray-700",
            diff: "0"
        };
        if (currentVal > prevVal) return {
            icon: <ArrowUp size={16}/>,
            color: "bg-green-100 text-green-700",
            diff: (currentVal - prevVal).toFixed(1)
        };
        return {
            icon: <ArrowDown size={16}/>,
            color: "bg-red-100 text-red-700",
            diff: (prevVal - currentVal).toFixed(1)
        };
    };

    if (!weather) {
        return <div className="flex items-center justify-center h-screen font-bold text-2xl">Connexion au flux
            météo...</div>;
    }

    return (
        <div>
            <div className="text-start flex flex-row items-center justify-between px-28 pt-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2 text-black pt-8">Tableau de Bord Météo</h1>
                    <p className="text-gray-600 mb-6">Données simulées en temps réel</p>
                </div>

                <div className="flex flex-row">
                    <div className="flex flex-row items-center">
                        <MapPin size={20} className="text-black mr-2"/>
                        <span className="text-xl font-medium text-black">Paris, France</span>
                    </div>
                </div>
            </div>

            <div className="min-h-screen flex flex-col px-28 justify-center p-8">
                <div className="flex flex-row justify-between w-full mb-12 items-center">
                    <h2 className="text-2xl font-medium text-black">Données en Temps Réel</h2>
                    <span>EN DIRECT : {weather.display_time}</span>
                </div>

                <div className="grid grid-cols-3 gap-y-16 mb-20">
                    {/* Température */}
                    <DataCard
                        label="Température"
                        value={`${weather["temperature_2m (°C)"]}°C`}
                        trend={getTrend(weather["temperature_2m (°C)"], prevWeather?.["temperature_2m (°C)"])}
                    />

                    {/* Humidité */}
                    <DataCard
                        label="Humidité"
                        value={`${weather["relative_humidity_2m (%)"]}%`}
                        trend={getTrend(weather["relative_humidity_2m (%)"], prevWeather?.["relative_humidity_2m (%)"])}
                    />

                    {/* Vent */}
                    <DataCard
                        label="Vent"
                        value={`${weather["wind_speed_10m (km/h)"]} km/h`}
                        trend={getTrend(weather["wind_speed_10m (km/h)"], prevWeather?.["wind_speed_10m (km/h)"])}
                    />

                    {/* Pression */}
                    <DataCard
                        label="Pression"
                        value={`${weather["pressure_msl (hPa)"]} hPa`}
                        trend={getTrend(weather["pressure_msl (hPa)"], prevWeather?.["pressure_msl (hPa)"])}
                    />

                    {/* Précipitation */}
                    <DataCard
                        label="Précipitation"
                        value={`${weather["precipitation (mm)"]} mm`}
                        trend={getTrend(weather["precipitation (mm)"], prevWeather?.["precipitation (mm)"])}
                    />

                    {/* Indice Nuageux (au lieu de UV car tu as cloud_cover) */}
                    <DataCard
                        label="Nuages"
                        value={`${weather["cloud_cover (%)"]}%`}
                        trend={getTrend(weather["cloud_cover (%)"], prevWeather?.["cloud_cover (%)"])}
                    />
                </div>
            </div>
        </div>
    );
};


const DataCard = ({label, value, trend}: any) => (
    <div className="flex flex-col">
        <span className="text-2xl mb-4 text-black">{label}</span>
        <span className="text-6xl font-bold mb-3 text-black">{value}</span>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md w-fit ${trend.color}`}>
            {trend.icon}
            <span className="text-sm font-medium">{trend.diff}</span>
        </div>
    </div>
);

export default Home;