import {useState, useEffect} from 'react';
import {Input} from '../components/ui/input';
import {Button} from '../components/ui/button';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '../components/ui/table';

export default function HistoriqueMeteo() {
    const [data, setData] = useState<any[]>([]);
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchHistory = async () => {
        setLoading(true);
        try {
            let url = `http://localhost:8000/api/weather/history?limit=200`;
            if (dateDebut && dateFin) {
                url += `&start_date=${dateDebut}T00:00:00&end_date=${dateFin}T23:59:59`;
            }

            const response = await fetch(url);
            const result = await response.json();


            if (Array.isArray(result)) {
                setData(result);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Erreur Fetch:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Pagination
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const currentItems = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="min-h-screen p-8 bg-transparent">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Historique (Base 2025)</h1>

                <div className="flex gap-4 mb-8 items-end">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Du:</span>
                        <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
                               className="w-64"/>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Au:</span>
                        <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
                               className="w-64"/>
                    </div>
                    <Button onClick={fetchHistory} className="bg-black text-white px-8 h-10">
                        {loading ? 'Chargement...' : 'Filtrer'}
                    </Button>
                </div>

                <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead>Date / Heure</TableHead>
                                <TableHead>Temp. (°C)</TableHead>
                                <TableHead>Humidité (%)</TableHead>
                                <TableHead>Pression (hPa)</TableHead>
                                <TableHead>Vent (km/h)</TableHead>
                                <TableHead>Nuages (%)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentItems.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">
                                        {row.time.replace('T', ' ')}
                                    </TableCell>
                                    <TableCell className="font-bold">{row["temperature_2m (°C)"]}°</TableCell>
                                    <TableCell>{row["relative_humidity_2m (%)"]}%</TableCell>
                                    <TableCell>{row["pressure_msl (hPa)"]}</TableCell>
                                    <TableCell>{row["wind_speed_10m (km/h)"]}</TableCell>
                                    <TableCell>{row["cloud_cover (%)"]}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Simple */}
                <div className="flex justify-center gap-2 mt-8">
                    <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                    > Précédent </Button>
                    <span className="flex items-center px-4 font-bold">
                        Page {currentPage} sur {totalPages || 1}
                    </span>
                    <Button
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                    > Suivant </Button>
                </div>
            </div>
        </div>
    );
}