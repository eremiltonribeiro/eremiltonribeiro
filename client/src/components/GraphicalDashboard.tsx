import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Interface based on shared/schema.ts
interface Vehicle {
  id: number;
  name: string;
  plate: string;
}

interface FuelRegistration {
  id: number;
  vehicleId: number;
  date: string; // Assuming date is a string in ISO format
  liters: number | null; // Nullable based on schema
  fuelCost: number | null; // Nullable based on schema, in cents
  vehicle?: Vehicle; // Optional, to be populated after fetching vehicles
}

// Interface for the processed chart data
interface ChartData {
  name: string; // Vehicle name or plate
  consumption: number; // Total liters or cost
}

const GraphicalDashboard: React.FC = () => {
  const [fuelRegistrationsData, setFuelRegistrationsData] = useState<FuelRegistration[]>([]);
  const [vehiclesData, setVehiclesData] = useState<Vehicle[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setChartData([]); // Reset chart data on new fetch
      try {
        // Fetch fuel registrations
        const registrationsResponse = await fetch('/api/registrations?type=fuel');
        if (!registrationsResponse.ok) {
          throw new Error(`HTTP error! status: ${registrationsResponse.status} for fuel registrations`);
        }
        const registrations = await registrationsResponse.json();
        
        // Fetch vehicles
        const vehiclesResponse = await fetch('/api/vehicles');
        if (!vehiclesResponse.ok) {
          throw new Error(`HTTP error! status: ${vehiclesResponse.status} for vehicles`);
        }
        const vehicles = await vehiclesResponse.json();
        
        // Combine data: Add vehicle info to registrations
        const populatedRegistrations = registrations.map((reg: FuelRegistration) => ({
          ...reg,
          vehicle: vehicles.find((v: Vehicle) => v.id === reg.vehicleId)
        }));

        setFuelRegistrationsData(populatedRegistrations);
        setVehiclesData(vehicles);

      } catch (e) {
        if (e instanceof Error) {
          console.error("Failed to fetch data:", e.message);
          setError(e.message);
        } else {
          console.error("Failed to fetch data:", e);
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this effect runs once on mount

  useEffect(() => {
    const processChartData = (
      registrations: FuelRegistration[],
      vehicles: Vehicle[]
    ): ChartData[] => {
      if (!registrations.length || !vehicles.length) {
        return [];
      }

      const consumptionByVehicle: { [key: number]: number } = {};

      registrations.forEach(reg => {
        if (reg.vehicleId && reg.liters !== null && reg.liters !== undefined) {
          consumptionByVehicle[reg.vehicleId] = (consumptionByVehicle[reg.vehicleId] || 0) + reg.liters;
        }
      });

      const formattedChartData: ChartData[] = [];
      for (const vehicleId in consumptionByVehicle) {
        const vehicle = vehicles.find(v => v.id === parseInt(vehicleId));
        if (vehicle) {
          formattedChartData.push({
            name: vehicle.name || vehicle.plate, // Use name, fallback to plate
            consumption: consumptionByVehicle[vehicleId],
          });
        }
      }
      return formattedChartData;
    };

    if (!loading && !error && fuelRegistrationsData.length > 0 && vehiclesData.length > 0) {
      const processedData = processChartData(fuelRegistrationsData, vehiclesData);
      setChartData(processedData);
    }
  }, [fuelRegistrationsData, vehiclesData, loading, error]); // Re-run when data changes or loading/error states resolve

  if (loading) {
    return <div>Data is being fetched...</div>;
  }

  if (error) {
    return <div>Error fetching data: {error}</div>;
  }

  if (chartData.length === 0) {
    // This could be because there's no data, or it's still processing,
    // or processing resulted in empty chartData (e.g. no fuel registrations)
    return <div>No data available for chart or still processing...</div>;
  }

  return (
    <div>
      <h2>Fuel Consumption by Vehicle</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="consumption" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Raw data for debugging can be kept or removed as needed */}
      {/* 
      <h2>Raw Fuel Registrations (for debugging):</h2>
      <pre>{JSON.stringify(fuelRegistrationsData, null, 2)}</pre>
      <h2>Raw Vehicles (for debugging):</h2>
      <pre>{JSON.stringify(vehiclesData, null, 2)}</pre>
      */}
    </div>
  );
};

export default GraphicalDashboard;
