import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Activity } from 'lucide-react';

const Graphique = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const maxPoints = 50;

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectRef = useRef<number>(0);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const mountedRef = useRef(true);

    const formatItem = (item: any) => {
        // prefer interpolated temperature if available
        const temp = item.temperature_interp ?? item.temperature_2m ?? item.temperature;
        const humi = item.relative_humidity_2m ?? item.humi ?? item["relative_humidity_2m (%)"] ?? 0;
        const wind = item.wind_speed_10m_kmh ?? item.wind_speed_10m ?? item["wind_speed_10m (km/h)"] ?? 0;
        const clouds = item.cloud_cover ?? item["cloud_cover (%)"] ?? 0;
        const timeLabel = item.display_time ?? (item.time ? (typeof item.time === 'string' ? item.time.split('T')[1] : '') : '--:--');

        return {
            ...item,
            temp,
            humi,
            wind,
            clouds,
            timeLabel,
        };
    };

    useEffect(() => {
        mountedRef.current = true;

        const connect = () => {
            if (!mountedRef.current) return;
            // open websocket
            const ws = new WebSocket('ws://localhost:8000/ws/weather');
            wsRef.current = ws;

            ws.onopen = () => {
                console.info('WS connected');
                // reset reconnect attempt counter
                reconnectRef.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const parsed = JSON.parse(event.data);
                    const formatted = formatItem(parsed);
                    setData(prev => {
                        const next = [...prev, formatted].slice(-maxPoints);
                        return next;
                    });
                    if (loading) setLoading(false);
                } catch (err) {
                    console.warn('WS parse error', err);
                }
            };

            ws.onerror = (err) => {
                console.error('WS error', err);
            };

            ws.onclose = (ev) => {
                console.warn('WS closed', ev);
                // try reconnect with backoff
                if (!mountedRef.current) return;
                reconnectRef.current += 1;
                const attempt = reconnectRef.current;
                // exponential/backoff with cap
                const delay = Math.min(30000, 500 * Math.pow(2, Math.max(0, attempt - 1)));
                if (reconnectTimeoutRef.current) {
                    window.clearTimeout(reconnectTimeoutRef.current);
                }
                reconnectTimeoutRef.current = window.setTimeout(() => {
                    connect();
                }, delay);
            };
        };

        connect();

        return () => {
            mountedRef.current = false;
            if (reconnectTimeoutRef.current) {
                window.clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
            }
            wsRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once

    const pieData = useMemo(() => {
        const sunny = data.filter(d => (d.clouds ?? 0) < 20).length;
        const cloudy = data.filter(d => (d.clouds ?? 0) >= 20 && (d.clouds ?? 0) < 70).length;
        const overcast = data.filter(d => (d.clouds ?? 0) >= 70).length;
        return [
            { name: 'Ciel Dégagé', value: sunny },
            { name: 'Partiellement Nuageux', value: cloudy },
            { name: 'Temps Couvert', value: overcast }
        ].filter(v => v.value > 0);
    }, [data]);

    const COLORS = ['#FFBB28', '#0088FE', '#64748b'];

    if (loading) return <div className="p-20 text-center font-bold animate-pulse">Synchronisation des flux live...</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 p-8 text-black font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex justify-between items-end border-b pb-6">
                    <div
                        className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full font-bold text-sm border border-red-100 animate-pulse">
                        <Activity size={16} /> FLUX TEMPS RÉEL ACTIF
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Évolution Thermique</h2>
                                <p className="text-xs text-gray-400">Mesure de la température de l'air à 2 mètres du sol</p>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="timeLabel" fontSize={10} tickLine={false} axisLine={false} interval={5} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} unit="°C" />
                                    <Tooltip isAnimationActive={false} contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                    }} />
                                    <Legend verticalAlign="top" align="right" />
                                    <Area name="Température (°C)" type="monotone" dataKey="temp" stroke="#3b82f6"
                                          strokeWidth={3} fill="url(#colorTemp)" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-600 leading-relaxed">
                                <span className="font-bold text-blue-600">Analyse :</span> Ce graphique illustre la tendance de réchauffement ou de refroidissement.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                            <h2 className="text-xl font-bold text-gray-800">État du Ciel</h2>
                        </div>
                        <div className="flex-1 min-h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={60} outerRadius={85} paddingAngle={8}
                                         dataKey="value" isAnimationActive={false}>
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-4 bg-amber-50 p-3 rounded-lg border border-amber-100 text-center italic">
                            Répartition calculée sur la base du pourcentage de nébulosité des dernières mesures.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Dynamique du Vent</h2>
                        </div>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis hide dataKey="timeLabel" />
                                    <YAxis fontSize={10} axisLine={false} tickLine={false} unit=" km/h" />
                                    <Tooltip isAnimationActive={false} />
                                    <Legend verticalAlign="top" align="right" />
                                    <Line name="Vitesse du Vent" type="step" dataKey="wind" stroke="#ef4444"
                                          strokeWidth={3} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="mt-4 text-[13px] text-gray-500">
                            Affiche les changements brusques de vitesse. Le mode "Escalier" (Step) est utilisé pour mieux visualiser les rafales instantanées.
                        </p>
                    </div>

                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Hygrométrie Live</h2>
                        </div>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="timeLabel" fontSize={10} axisLine={false} tickLine={false} interval={10} />
                                    <YAxis fontSize={10} axisLine={false} tickLine={false} unit="%" />
                                    <Tooltip isAnimationActive={false} />
                                    <Legend verticalAlign="top" align="right" />
                                    <Area name="Humidité Relative" type="monotone" dataKey="humi" stroke="#10b981"
                                          fill="#ecfdf5" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="mt-4 text-[13px] text-gray-500 italic">
                            Plus le taux est élevé, plus l'air est chargé en humidité. Un taux supérieur à 80% est souvent précurseur de précipitations ou de brouillard.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Graphique;