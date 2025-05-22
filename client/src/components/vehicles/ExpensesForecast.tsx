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
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Lightbulb } from "lucide-react";
import { offlineStorage } from "@/services/offlineStorage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

// Função para gerar o array de meses (passados e futuros)
function getMonthsRange(pastMonths: number, futureMonths: number) {
  const months = [];
  const today = new Date();
  
  // Adicionar meses passados
  for (let i = pastMonths - 1; i >= 0; i--) {
    const month = new Date();
    month.setMonth(today.getMonth() - i);
    
    // Formatar o nome do mês (abreviado)
    const monthName = month.toLocaleDateString('pt-BR', { month: 'short' });
    
    // Obter o ano
    const year = month.getFullYear();
    
    // Obter o primeiro e último dia do mês
    const firstDay = new Date(year, month.getMonth(), 1);
    const lastDay = new Date(year, month.getMonth() + 1, 0);
    
    months.push({
      name: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`,
      monthIndex: month.getMonth(),
      year,
      firstDay,
      lastDay,
      isPast: true
    });
  }
  
  // Adicionar meses futuros
  for (let i = 1; i <= futureMonths; i++) {
    const month = new Date();
    month.setMonth(today.getMonth() + i);
    
    // Formatar o nome do mês (abreviado)
    const monthName = month.toLocaleDateString('pt-BR', { month: 'short' });
    
    // Obter o ano
    const year = month.getFullYear();
    
    // Obter o primeiro e último dia do mês
    const firstDay = new Date(year, month.getMonth(), 1);
    const lastDay = new Date(year, month.getMonth() + 1, 0);
    
    months.push({
      name: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`,
      monthIndex: month.getMonth(),
      year,
      firstDay,
      lastDay,
      isPast: false
    });
  }
  
  return months;
}

// Função para calcular a regressão linear
function linearRegression(data: any[]) {
  const n = data.length;
  
  // Se não tivermos dados suficientes, retornamos uma função que prevê a média
  if (n < 2) {
    const mean = data.length > 0 ? data[0].y : 0;
    return (_: number) => mean;
  }
  
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += data[i].x;
    sumY += data[i].y;
    sumXY += data[i].x * data[i].y;
    sumXX += data[i].x * data[i].x;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Retornar a função de previsão
  return (x: number) => slope * x + intercept;
}

// Função para ajuste sazonal (considerando padrões mensais)
function adjustForSeasonality(monthIndex: number, values: number[]): number {
  // Criar um mapa de índices de mês para seus valores
  const monthValues: {[key: number]: number[]} = {};
  
  // Agrupar valores por mês
  for (let i = 0; i < values.length; i++) {
    const index = i % 12; // 0-11 para os meses
    if (!monthValues[index]) {
      monthValues[index] = [];
    }
    monthValues[index].push(values[i]);
  }
  
  // Calcular o fator sazonal para o mês em questão
  // Se não tivermos dados para este mês, retornamos 1 (sem ajuste)
  if (!monthValues[monthIndex] || monthValues[monthIndex].length === 0) {
    return 1;
  }
  
  // Calcular a média para este mês
  const monthAvg = monthValues[monthIndex].reduce((sum, v) => sum + v, 0) / monthValues[monthIndex].length;
  
  // Calcular a média geral
  const allValues = Object.values(monthValues).flat();
  const generalAvg = allValues.reduce((sum, v) => sum + v, 0) / allValues.length;
  
  // Retornar o fator sazonal (relação entre a média do mês e a média geral)
  // Normalizar para que não seja um fator extremo
  const factor = monthAvg / generalAvg;
  
  // Limitar o fator entre 0.7 e 1.3 para evitar previsões extremas
  return Math.max(0.7, Math.min(1.3, factor));
}

export function ExpensesForecast() {
  const [forecastMonths, setForecastMonths] = useState<number>(6);
  const [historyMonths, setHistoryMonths] = useState<number>(12);
  const [forecastType, setForecastType] = useState<"linear" | "seasonal">("seasonal");
  
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
  
  // Buscar veículos para previsões de manutenção
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
  
  // Gerar array de meses (passados e futuros)
  const months = getMonthsRange(historyMonths, forecastMonths);
  
  // Calcular gastos históricos por mês
  const historicalExpenses = months.filter(m => m.isPast).map((month, index) => {
    // Filtrar registros deste mês
    const monthRegistrations = registrations.filter((reg: any) => {
      const regDate = new Date(reg.date);
      return regDate >= month.firstDay && regDate <= month.lastDay;
    });
    
    // Calcular gastos com combustível
    const fuelExpenses = monthRegistrations
      .filter((reg: any) => reg.type === "fuel")
      .reduce((sum: number, reg: any) => sum + (reg.fuelCost || 0), 0);
    
    // Calcular gastos com manutenção
    const maintenanceExpenses = monthRegistrations
      .filter((reg: any) => reg.type === "maintenance")
      .reduce((sum: number, reg: any) => sum + (reg.maintenanceCost || 0), 0);
    
    // Calcular outros gastos
    const otherExpenses = monthRegistrations
      .filter((reg: any) => reg.type !== "fuel" && reg.type !== "maintenance" && reg.otherCosts)
      .reduce((sum: number, reg: any) => sum + (reg.otherCosts || 0), 0);
    
    // Calcular total
    const totalExpenses = fuelExpenses + maintenanceExpenses + otherExpenses;
    
    return {
      month: month.name,
      index: index,
      monthIndex: month.monthIndex,
      combustivel: fuelExpenses,
      manutencao: maintenanceExpenses,
      outros: otherExpenses,
      total: totalExpenses,
      realizado: true
    };
  });
  
  // Preparar dados para regressão linear
  const fuelData = historicalExpenses.map((data, index) => ({ x: index, y: data.combustivel }));
  const maintenanceData = historicalExpenses.map((data, index) => ({ x: index, y: data.manutencao }));
  const otherData = historicalExpenses.map((data, index) => ({ x: index, y: data.outros }));
  
  // Calcular funções de previsão
  const predictFuel = linearRegression(fuelData);
  const predictMaintenance = linearRegression(maintenanceData);
  const predictOther = linearRegression(otherData);
  
  // Obter valores históricos para análise sazonal
  const fuelValues = historicalExpenses.map(data => data.combustivel);
  const maintenanceValues = historicalExpenses.map(data => data.manutencao);
  const otherValues = historicalExpenses.map(data => data.outros);
  
  // Gerar previsões para meses futuros
  const futurePredictions = months.filter(m => !m.isPast).map((month, index) => {
    const historicalIndex = historicalExpenses.length - 1;
    const predictionIndex = historicalIndex + index + 1;
    
    // Previsão linear
    let fuelForecast = predictFuel(predictionIndex);
    let maintenanceForecast = predictMaintenance(predictionIndex);
    let otherForecast = predictOther(predictionIndex);
    
    // Ajustar por sazonalidade se esta opção estiver selecionada
    if (forecastType === "seasonal") {
      // Aplicar fatores sazonais
      const fuelFactor = adjustForSeasonality(month.monthIndex, fuelValues);
      const maintenanceFactor = adjustForSeasonality(month.monthIndex, maintenanceValues);
      const otherFactor = adjustForSeasonality(month.monthIndex, otherValues);
      
      fuelForecast *= fuelFactor;
      maintenanceForecast *= maintenanceFactor;
      otherForecast *= otherFactor;
    }
    
    // Garantir que as previsões não sejam negativas
    fuelForecast = Math.max(0, fuelForecast);
    maintenanceForecast = Math.max(0, maintenanceForecast);
    otherForecast = Math.max(0, otherForecast);
    
    // Calcular total
    const totalForecast = fuelForecast + maintenanceForecast + otherForecast;
    
    return {
      month: month.name,
      index: historicalExpenses.length + index,
      monthIndex: month.monthIndex,
      combustivel: fuelForecast,
      manutencao: maintenanceForecast,
      outros: otherForecast,
      total: totalForecast,
      realizado: false
    };
  });
  
  // Identificar possíveis manutenções programadas para os próximos meses
  const scheduledMaintenances = [];
  
  // Manutenções programadas e seus intervalos em km
  const maintenanceIntervals = [
    { type: "Troca de Óleo", km: 10000 },
    { type: "Troca de Filtros", km: 10000 },
    { type: "Alinhamento e Balanceamento", km: 10000 },
    { type: "Troca de Pastilhas de Freio", km: 30000 },
    { type: "Troca de Correia Dentada", km: 60000 },
    { type: "Revisão Completa", km: 20000 },
  ];
  
  // Estimar km média mensal para cada veículo
  vehicles.forEach((vehicle: any) => {
    // Filtrar registros deste veículo
    const vehicleRegistrations = registrations.filter((reg: any) => reg.vehicleId === vehicle.id);
    
    // Encontrar o registro mais recente para obter a quilometragem atual
    const latestRecord = vehicleRegistrations.sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })[0];
    
    const currentOdometer = latestRecord?.finalKm || latestRecord?.odometer || vehicle.initialKm || 0;
    
    // Calcular a média de km percorridos por mês
    const tripRegistrations = vehicleRegistrations.filter((reg: any) => reg.type === "trip");
    const totalKm = tripRegistrations.reduce((sum: number, reg: any) => {
      return sum + (reg.finalKm - reg.initialKm);
    }, 0);
    
    // Se temos dados de viagem, calcular a média mensal
    if (tripRegistrations.length > 0) {
      const firstTripDate = new Date(tripRegistrations.sort((a: any, b: any) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      })[0].date);
      
      const lastTripDate = new Date(tripRegistrations.sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })[0].date);
      
      // Calcular o número de meses entre a primeira e a última viagem
      const monthsDiff = (lastTripDate.getFullYear() - firstTripDate.getFullYear()) * 12 + 
                         (lastTripDate.getMonth() - firstTripDate.getMonth()) + 1; // +1 para incluir o mês atual
      
      const avgKmPerMonth = monthsDiff > 0 ? totalKm / monthsDiff : 0;
      
      // Encontrar a última vez que cada tipo de manutenção foi realizada
      maintenanceIntervals.forEach(maintenance => {
        // Filtrar registros deste veículo e deste tipo de manutenção
        const typeRecords = vehicleRegistrations.filter((rec: any) => 
          rec.type === "maintenance" && 
          rec.maintenanceType?.toLowerCase().includes(maintenance.type.toLowerCase())
        );
        
        // Ordenar por data (mais recente primeiro)
        const lastMaintenance = typeRecords.sort((a: any, b: any) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        })[0];
        
        const lastMaintenanceKm = lastMaintenance?.odometer || 0;
        const kmSinceLastMaintenance = currentOdometer - lastMaintenanceKm;
        const kmToNextMaintenance = maintenance.km - kmSinceLastMaintenance;
        
        // Se a manutenção estiver prevista para os próximos meses
        if (kmToNextMaintenance > 0 && avgKmPerMonth > 0) {
          const monthsToMaintenance = kmToNextMaintenance / avgKmPerMonth;
          
          // Se a manutenção está prevista para os próximos meses que estamos prevendo
          if (monthsToMaintenance <= forecastMonths) {
            // Estimar o custo da manutenção
            let estimatedCost = 0;
            
            // Calculamos o custo médio baseado em manutenções anteriores do mesmo tipo
            const similarMaintenances = vehicleRegistrations.filter((rec: any) => 
              rec.type === "maintenance" && 
              rec.maintenanceType?.toLowerCase().includes(maintenance.type.toLowerCase()) &&
              rec.maintenanceCost
            );
            
            if (similarMaintenances.length > 0) {
              estimatedCost = similarMaintenances.reduce((sum: number, m: any) => sum + m.maintenanceCost, 0) / similarMaintenances.length;
            } else {
              // Se não temos dados históricos, usamos valores médios estimados
              switch (maintenance.type) {
                case "Troca de Óleo":
                  estimatedCost = 300;
                  break;
                case "Troca de Filtros":
                  estimatedCost = 200;
                  break;
                case "Alinhamento e Balanceamento":
                  estimatedCost = 150;
                  break;
                case "Troca de Pastilhas de Freio":
                  estimatedCost = 400;
                  break;
                case "Troca de Correia Dentada":
                  estimatedCost = 800;
                  break;
                case "Revisão Completa":
                  estimatedCost = 1000;
                  break;
                default:
                  estimatedCost = 500;
              }
            }
            
            // Arredondar para o mês mais próximo
            const maintenanceMonth = Math.ceil(monthsToMaintenance);
            
            scheduledMaintenances.push({
              vehicle: vehicle.name,
              vehiclePlate: vehicle.plate,
              maintenanceType: maintenance.type,
              estimatedMonth: maintenanceMonth,
              estimatedCost: estimatedCost,
              estimatedKm: currentOdometer + (avgKmPerMonth * maintenanceMonth)
            });
          }
        }
      });
    }
  });
  
  // Combinar dados históricos e previsões
  const chartData = [...historicalExpenses, ...futurePredictions];
  
  // Adicionar manutenções programadas à previsão
  scheduledMaintenances.forEach(maintenance => {
    // O índice no array chartData para a manutenção programada
    const index = historicalExpenses.length + maintenance.estimatedMonth - 1;
    
    // Certificar que o índice é válido
    if (index >= 0 && index < chartData.length) {
      // Adicionar o custo estimado da manutenção à previsão
      chartData[index].manutencao += maintenance.estimatedCost;
      chartData[index].total += maintenance.estimatedCost;
    }
  });
  
  // Calcular o total geral previsto para o período
  const totalForecast = futurePredictions.reduce((sum, month) => sum + month.total, 0);
  
  // Calcular a média mensal prevista
  const avgMonthlyForecast = totalForecast / Math.max(1, futurePredictions.length);
  
  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-medium">Previsão de Gastos</CardTitle>
          <CardDescription>
            Projeção de despesas para os próximos meses
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <Select value={forecastMonths.toString()} onValueChange={(v) => setForecastMonths(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Meses à frente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={historyMonths.toString()} onValueChange={(v) => setHistoryMonths(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Histórico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
              <SelectItem value="24">24 meses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={forecastType} onValueChange={(v) => setForecastType(v as "linear" | "seasonal")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tipo de previsão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="seasonal">Sazonal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            Não há dados suficientes para fazer previsões.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <defs>
                  <linearGradient id="colorCombustivel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorManutencao" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOutros" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(value as number), 
                    name === "combustivel" 
                      ? "Combustível" 
                      : name === "manutencao" 
                        ? "Manutenção" 
                        : name === "outros" 
                          ? "Outros" 
                          : "Total"
                  ]} 
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="combustivel" 
                  name="Combustível" 
                  stroke="#38bdf8" 
                  fillOpacity={1} 
                  fill="url(#colorCombustivel)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="manutencao" 
                  name="Manutenção" 
                  stroke="#22c55e" 
                  fillOpacity={1} 
                  fill="url(#colorManutencao)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="outros" 
                  name="Outros" 
                  stroke="#a855f7" 
                  fillOpacity={1} 
                  fill="url(#colorOutros)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  name="Total" 
                  stroke="#f59e0b" 
                  fillOpacity={0}
                  fill="none"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="mt-6">
              <h3 className="font-medium text-lg mb-2">Resumo da Previsão</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">Gasto Total Previsto</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">{formatCurrency(totalForecast)}</div>
                    <p className="text-xs text-muted-foreground">
                      Para os próximos {forecastMonths} meses
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">Média Mensal Prevista</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">{formatCurrency(avgMonthlyForecast)}</div>
                    <p className="text-xs text-muted-foreground">
                      Por mês
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">Manutenções Programadas</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-2xl font-bold">{scheduledMaintenances.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Nos próximos {forecastMonths} meses
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {scheduledMaintenances.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-lg mb-2">Manutenções Programadas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Veículo</th>
                        <th className="py-2 text-left">Manutenção</th>
                        <th className="py-2 text-right">Quando</th>
                        <th className="py-2 text-right">Hodômetro Est.</th>
                        <th className="py-2 text-right">Custo Est.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduledMaintenances
                        .sort((a, b) => a.estimatedMonth - b.estimatedMonth)
                        .map((maintenance, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2">
                            {maintenance.vehicle}
                            <span className="text-xs text-muted-foreground block">
                              {maintenance.vehiclePlate}
                            </span>
                          </td>
                          <td className="py-2">{maintenance.maintenanceType}</td>
                          <td className="py-2 text-right">
                            {maintenance.estimatedMonth === 1 
                              ? "Próximo mês" 
                              : `Em ${maintenance.estimatedMonth} meses`}
                          </td>
                          <td className="py-2 text-right">
                            {maintenance.estimatedKm.toLocaleString('pt-BR')} km
                          </td>
                          <td className="py-2 text-right">
                            {formatCurrency(maintenance.estimatedCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}