import  { useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';

// Données météo simulées
const weatherData = [
    {
        date: '12/10/2023',
        heure: '14:00',
        temperature: '15.5°C',
        humidite: '55%',
        pression: '1012 hPa',
        vent_vitesse: '10 km/h',
        vent_direction: 'NE'
    },
    {
        date: '12/10/2023',
        heure: '13:00',
        temperature: '15.2°C',
        humidite: '58%',
        pression: '1012 hPa',
        vent_vitesse: '12 km/h',
        vent_direction: 'NE'
    },
    {
        date: '12/10/2023',
        heure: '14:00',
        temperature: '15.5°C',
        humidite: '54%',
        pression: '1012 hPa',
        vent_vitesse: '12 km/h',
        vent_direction: 'NE'
    },
    {
        date: '12/10/2023',
        heure: '13:00',
        temperature: '14.8°C',
        humidite: '67%',
        pression: '1012 hPa',
        vent_vitesse: '10 km/h',
        vent_direction: 'NE'
    },
    {
        date: '12/10/2023',
        heure: '13:00',
        temperature: '14.8°C',
        humidite: '67%',
        pression: '1012 hPa',
        vent_vitesse: '12 km/h',
        vent_direction: 'NE'
    },
    {
        date: '12/10/2023',
        heure: '14:00',
        temperature: '14.3°C',
        humidite: '53%',
        pression: '1012 hPa',
        vent_vitesse: '12 km/h',
        vent_direction: 'NE'
    },
    {
        date: '12/10/2023',
        heure: '14:00',
        temperature: '14.3°C',
        humidite: '53%',
        pression: '1012 hPa',
        vent_vitesse: '12 km/h',
        vent_direction: 'NE'
    },
    {
        date: '12/10/2023',
        heure: '14:00',
        temperature: '14.5°C',
        humidite: '58%',
        pression: '1012 hPa',
        vent_vitesse: '12 km/h',
        vent_direction: 'NE'
    },
    {
        date: '11/10/2023',
        heure: '15:00',
        temperature: '16.2°C',
        humidite: '52%',
        pression: '1013 hPa',
        vent_vitesse: '8 km/h',
        vent_direction: 'E'
    },
    {
        date: '11/10/2023',
        heure: '16:00',
        temperature: '17.1°C',
        humidite: '48%',
        pression: '1013 hPa',
        vent_vitesse: '11 km/h',
        vent_direction: 'SE'
    }
];

export default function HistoriqueMeteo() {
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const handleFilter = () => {
        console.log('Filtrer avec:', { dateDebut, dateFin });
    };

    return (
        <div className="min-h-screen  p-8">
            <div className="max-w-7xl mx-auto">
                {/* En-tête */}
                <h1 className="text-3xl font-bold mb-8">Historique des Données</h1>

                {/* Filtres */}
                <div className="flex gap-4 mb-8">
                    <Input
                        type="text"
                        placeholder="Date Début"
                        value={dateDebut}
                        onChange={(e) => setDateDebut(e.target.value)}
                        className="w-64"
                    />
                    <Input
                        type="text"
                        placeholder="Date Fin"
                        value={dateFin}
                        onChange={(e) => setDateFin(e.target.value)}
                        className="w-64"
                    />
                    <Button onClick={handleFilter} className="bg-black hover:bg-gray-800">
                        Filtrer
                    </Button>
                </div>

                {/* Tableau */}
                <div className="bg-white/75  mx-auto px-20 rounded-lg shadow">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Heure</TableHead>
                                <TableHead>Temp.</TableHead>
                                <TableHead>Humidité</TableHead>
                                <TableHead>Pression</TableHead>
                                <TableHead>Vent (Vitesse)</TableHead>
                                <TableHead>Vent (Direction)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {weatherData.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{row.date}</TableCell>
                                    <TableCell>{row.heure}</TableCell>
                                    <TableCell>{row.temperature}</TableCell>
                                    <TableCell>{row.humidite}</TableCell>
                                    <TableCell>{row.pression}</TableCell>
                                    <TableCell>{row.vent_vitesse}</TableCell>
                                    <TableCell>{row.vent_direction}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex justify-center gap-2 mt-8">
                    <Button
                        variant={currentPage === 1 ? "default" : "outline"}
                        size="icon"
                        className={currentPage === 1 ? "bg-black hover:bg-gray-800" : ""}
                        onClick={() => setCurrentPage(1)}
                    >
                        1
                    </Button>
                    <Button
                        variant={currentPage === 2 ? "default" : "outline"}
                        size="icon"
                        className={currentPage === 2 ? "bg-black hover:bg-gray-800" : ""}
                        onClick={() => setCurrentPage(2)}
                    >
                        2
                    </Button>
                    <Button
                        variant={currentPage === 3 ? "default" : "outline"}
                        size="icon"
                        className={currentPage === 3 ? "bg-black hover:bg-gray-800" : ""}
                        onClick={() => setCurrentPage(3)}
                    >
                        3
                    </Button>
                    <span className="flex items-center px-2">...</span>
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage(10)}>
                        10
                    </Button>
                    <Button variant="outline" size="icon" disabled={currentPage === 1}>
                        &lt;
                    </Button>
                    <Button variant="outline" size="icon" disabled={currentPage === 10}>
                        &gt;
                    </Button>
                </div>
            </div>
        </div>
    );
}