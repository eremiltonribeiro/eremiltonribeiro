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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { offlineStorage } from "@/services/offlineStorage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

// Função para gerar o array de meses
function getLastMonths(numMonths: number) {
  const months = [];
  const today = new Date();
  
  for (let i = 0; i < numMonths; i++) {
    const month = new Date();
    month.setMonth(today.getMonth() - i);
    
    // Formatar o nome do mês (abreviado)
    const monthName = month.toLocaleDateString('pt-BR', { month: 'short' });
    
    // Obter o ano
    const year = month.getFullYear();
    
    // Obter o primeiro e último dia do mês
    const firstDay = new Date(year, month.getMonth(), 1);
    const lastDay = new Date(year, month.getMonth() + 1, 0);
    
    months.unshift({
      name: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`,
      monthIndex: month.getMonth(),
      year,
      firstDay,
      lastDay,
    });
  }
  
  return months;
}

export function MonthlyExpenseHistory() {
  const [chartType, setChartType] = useState<"stacked" | "separate">("stacked");
  const [timeRange, setTimeRange] = useState<number>(12); // 6, 12, 24 meses
  
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
  
  // Gerar array de meses
  const months = getLastMonths(timeRange);
  
  // Calcular gastos por mês
  const monthlyExpenses = months.map(month => {
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
      combustivel: fuelExpenses,
      manutencao: maintenanceExpenses,
      outros: otherExpenses,
      total: totalExpenses,
    };
  });
  
  // Calcular média móvel de 3 meses para previsão de tendência
  const movingAverages = [...monthlyExpenses];
  for (let i = 2; i < movingAverages.length; i++) {
    movingAverages[i].mediaMovel = (
      monthlyExpenses[i].total + 
      monthlyExpenses[i-1].total + 
      monthlyExpenses[i-2].total
    ) / 3;
  }
  
  // Calcular dados de totais para sumário
  const totalFuelExpenses = monthlyExpenses.reduce((sum, month) => sum + month.combustivel, 0);
  const totalMaintenanceExpenses = monthlyExpenses.reduce((sum, month) => sum + month.manutencao, 0);
  const totalOtherExpenses = monthlyExpenses.reduce((sum, month) => sum + month.outros, 0);
  const grandTotal = totalFuelExpenses + totalMaintenanceExpenses + totalOtherExpenses;
  
  // Calcular médias mensais
  const avgFuelExpense = totalFuelExpenses / Math.min(monthlyExpenses.length, timeRange);
  const avgMaintenanceExpense = totalMaintenanceExpenses / Math.min(monthlyExpenses.length, timeRange);
  const avgTotalExpense = grandTotal / Math.min(monthlyExpenses.length, timeRange);
  
  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-medium">Histórico de Gastos Mensais</CardTitle>
          <CardDescription>
            Acompanhamento de despesas ao longo do tempo
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-blue-500" />
          <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
              <SelectItem value="24">24 meses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chartType} onValueChange={(v) => setChartType(v as "stacked" | "separate")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tipo de gráfico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stacked">Empilhado</SelectItem>
              <SelectItem value="separate">Separado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {monthlyExpenses.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            Não há dados de despesas para exibir.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={400}>
              {chartType === "stacked" ? (
                <LineChart data={movingAverages} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
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
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="combustivel" 
                    name="Combustível" 
                    stroke="#38bdf8" 
                    strokeWidth={2} 
                    dot={{ r: 3 }} 
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="manutencao" 
                    name="Manutenção" 
                    stroke="#22c55e" 
                    strokeWidth={2} 
                    dot={{ r: 3 }} 
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="outros" 
                    name="Outros" 
                    stroke="#a855f7" 
                    strokeWidth={2} 
                    dot={{ r: 3 }} 
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mediaMovel" 
                    name="Média Móvel (3 meses)" 
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    dot={false}
                  />
                </LineChart>
              ) : (
                <LineChart data={movingAverages} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
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
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name="Total" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    dot={{ r: 3 }} 
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mediaMovel" 
                    name="Média Móvel (3 meses)" 
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Combustível</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold">{formatCurrency(totalFuelExpenses)}</div>
                  <p className="text-xs text-muted-foreground">
                    Média: {formatCurrency(avgFuelExpense)}/mês
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Manutenção</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold">{formatCurrency(totalMaintenanceExpenses)}</div>
                  <p className="text-xs text-muted-foreground">
                    Média: {formatCurrency(avgMaintenanceExpense)}/mês
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Outros</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold">{formatCurrency(totalOtherExpenses)}</div>
                  <p className="text-xs text-muted-foreground">
                    {(totalOtherExpenses / grandTotal * 100).toFixed(1)}% do total
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold">{formatCurrency(grandTotal)}</div>
                  <p className="text-xs text-muted-foreground">
                    Média: {formatCurrency(avgTotalExpense)}/mês
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}