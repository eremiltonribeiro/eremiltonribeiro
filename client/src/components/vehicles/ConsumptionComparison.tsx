import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Droplet, TrendingDown } from "lucide-react";
import { offlineStorage } from "@/services/offlineStorage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ConsumptionComparison() {
  const [period, setPeriod] = useState("all"); // 'all', 'month', '3months', '6months', 'year'
  
  // Buscar veículos
  const { data: vehicles = [] } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: async () => {
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/vehicles");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveVehicles(data);
            return data;
          }
        }
        return await offlineStorage.getVehicles();
      } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        return await offlineStorage.getVehicles();
      }
    }
  });

  // Buscar registros
  const { data: registrations = [] } = useQuery({
    queryKey: ["/api/registrations"],
    queryFn: async () => {
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/registrations");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveRegistrations(data);
            return data;
          }
        }
        return await offlineStorage.getRegistrations();
      } catch (error) {
        console.error("Erro ao buscar registros:", error);
        return await offlineStorage.getRegistrations();
      }
    }
  });

  // Filtrar registros por período
  const filteredRegistrations = registrations.filter((reg: any) => {
    const regDate = new Date(reg.date);
    const today = new Date();
    
    switch (period) {
      case "month":
        // Último mês
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return regDate >= lastMonth;
      
      case "3months":
        // Últimos 3 meses
        const last3Months = new Date();
        last3Months.setMonth(last3Months.getMonth() - 3);
        return regDate >= last3Months;
      
      case "6months":
        // Últimos 6 meses
        const last6Months = new Date();
        last6Months.setMonth(last6Months.getMonth() - 6);
        return regDate >= last6Months;
      
      case "year":
        // Último ano
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        return regDate >= lastYear;
      
      default:
        // Todos os registros
        return true;
    }
  });

  // Calcular consumo médio por veículo
  const vehicleConsumption = vehicles.map((vehicle: any) => {
    // Filtrar registros de abastecimento para este veículo
    const fuelRegistrations = filteredRegistrations.filter(
      (reg: any) => reg.type === "fuel" && reg.vehicleId === vehicle.id
    );
    
    // Filtrar registros de viagem para este veículo
    const tripRegistrations = filteredRegistrations.filter(
      (reg: any) => reg.type === "trip" && reg.vehicleId === vehicle.id
    );
    
    // Calcular total de combustível
    const totalFuel = fuelRegistrations.reduce(
      (sum: number, reg: any) => sum + (reg.liters || 0), 
      0
    );
    
    // Calcular total de quilômetros
    const totalKm = tripRegistrations.reduce(
      (sum: number, reg: any) => sum + (reg.finalKm - reg.initialKm), 
      0
    );
    
    // Calcular consumo médio (L/100km)
    let avgConsumption = 0;
    if (totalKm > 0) {
      avgConsumption = (totalFuel / totalKm) * 100;
    }
    
    // Calcular total de despesas
    const totalExpenses = fuelRegistrations.reduce(
      (sum: number, reg: any) => sum + (reg.fuelCost || 0), 
      0
    );
    
    // Calcular custo por km
    let costPerKm = 0;
    if (totalKm > 0) {
      costPerKm = totalExpenses / totalKm;
    }
    
    return {
      id: vehicle.id,
      name: vehicle.name,
      plate: vehicle.plate,
      avgConsumption: avgConsumption.toFixed(2),
      totalFuel,
      totalKm,
      totalExpenses,
      costPerKm: costPerKm.toFixed(2),
    };
  }).filter((v: any) => parseFloat(v.avgConsumption) > 0);

  // Ordenar veículos por consumo (do menor para o maior)
  vehicleConsumption.sort((a: any, b: any) => 
    parseFloat(a.avgConsumption) - parseFloat(b.avgConsumption)
  );

  // Preparar dados para o gráfico de barras
  const chartData = vehicleConsumption.map((v: any) => ({
    name: v.name,
    consumo: parseFloat(v.avgConsumption),
    custo: parseFloat(v.costPerKm) * 100, // Converter para custo por 100km para melhor visualização
  }));

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-medium">Comparação de Consumo</CardTitle>
          <CardDescription>
            Consumo médio (L/100km) e custo por 100km (R$) por veículo
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <TrendingDown className="h-5 w-5 text-green-500" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o período</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            Não há dados suficientes para comparação.
          </div>
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" label={{ value: 'L/100km', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'R$/100km', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value: any) => [
                  parseFloat(value).toFixed(2), 
                  value <= 50 ? "L/100km" : "R$/100km"
                ]} />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="consumo" 
                  name="Consumo (L/100km)" 
                  fill="#38bdf8" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="custo" 
                  name="Custo (R$/100km)" 
                  fill="#a3e635" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Veículo</th>
                    <th className="py-2 text-right">Consumo Médio</th>
                    <th className="py-2 text-right">Custo por km</th>
                    <th className="py-2 text-right">Km Rodados</th>
                    <th className="py-2 text-right">Combustível</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleConsumption.map((vehicle: any) => (
                    <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">
                        {vehicle.name}
                        <span className="text-xs text-muted-foreground block">
                          {vehicle.plate}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Droplet className="h-3 w-3 text-blue-500" />
                          <span>{vehicle.avgConsumption} L/100km</span>
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        R$ {vehicle.costPerKm}
                      </td>
                      <td className="py-2 text-right">
                        {vehicle.totalKm.toLocaleString('pt-BR')} km
                      </td>
                      <td className="py-2 text-right">
                        {vehicle.totalFuel.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}