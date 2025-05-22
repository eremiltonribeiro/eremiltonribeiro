import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fuel, Wrench, MapPin, Droplet, Car, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { offlineStorage } from "@/services/offlineStorage";
import { Statistics } from "./Statistics";
import { MaintenanceAlerts } from "./MaintenanceAlerts";
import { ConsumptionComparison } from "./ConsumptionComparison";
import { MonthlyExpenseHistory } from "./MonthlyExpenseHistory";
import { ExpensesForecast } from "./ExpensesForecast";

export function Dashboard() {
  const [dateRange, setDateRange] = useState("month");

  // Fetch all registrations with offline support
  const { data: registrations = [], isLoading } = useQuery({
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
        
        // Fallback to offline data
        return await offlineStorage.getRegistrations();
      } catch (error) {
        console.error("Erro ao buscar registros:", error);
        return await offlineStorage.getRegistrations();
      }
    }
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const fuelRegistrations = registrations.filter((reg: any) => reg.type === "fuel");
  const maintenanceRegistrations = registrations.filter((reg: any) => reg.type === "maintenance");
  const tripRegistrations = registrations.filter((reg: any) => reg.type === "trip");

  // Data for registration type distribution
  const registrationTypeData = [
    { name: "Abastecimentos", value: fuelRegistrations.length, color: "#f59e0b" },
    { name: "Manutenções", value: maintenanceRegistrations.length, color: "#10b981" },
    { name: "Viagens", value: tripRegistrations.length, color: "#3b82f6" },
  ];

  // Data for fuel consumption by vehicle
  const fuelByVehicle = fuelRegistrations.reduce((acc: any, reg: any) => {
    const vehicleName = reg.vehicle ? reg.vehicle.plate : "Desconhecido";
    if (!acc[vehicleName]) {
      acc[vehicleName] = {
        name: vehicleName,
        litros: 0,
        valor: 0,
      };
    }
    acc[vehicleName].litros += reg.liters || 0;
    acc[vehicleName].valor += reg.fuelCost || 0;
    return acc;
  }, {});

  const fuelByVehicleData = Object.values(fuelByVehicle);

  // Data for maintenance costs by type
  const maintenanceByType = maintenanceRegistrations.reduce((acc: any, reg: any) => {
    const typeName = reg.maintenanceType ? reg.maintenanceType.name : "Outro";
    if (!acc[typeName]) {
      acc[typeName] = {
        name: typeName,
        valor: 0,
      };
    }
    acc[typeName].valor += reg.maintenanceCost || 0;
    return acc;
  }, {});

  const maintenanceByTypeData = Object.values(maintenanceByType);

  // Data for trips by destination
  const tripsByDestination = tripRegistrations.reduce((acc: any, reg: any) => {
    const destination = reg.destination || "Desconhecido";
    if (!acc[destination]) {
      acc[destination] = {
        name: destination,
        count: 0,
        kmTotal: 0,
      };
    }
    acc[destination].count += 1;
    acc[destination].kmTotal += (reg.finalKm || 0) - (reg.initialKm || 0);
    return acc;
  }, {});

  const tripsByDestinationData = Object.values(tripsByDestination);

  // Monthly expenses
  const getMonth = (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const monthlyExpenses = registrations.reduce((acc: any, reg: any) => {
    const month = getMonth(reg.date);
    if (!acc[month]) {
      acc[month] = {
        name: month,
        abastecimento: 0,
        manutencao: 0,
      };
    }
    if (reg.type === "fuel") {
      acc[month].abastecimento += reg.fuelCost || 0;
    }
    if (reg.type === "maintenance") {
      acc[month].manutencao += reg.maintenanceCost || 0;
    }
    return acc;
  }, {});

  const monthlyExpensesData = Object.values(monthlyExpenses);

  // Calculate totals
  const totalFuelCost = fuelRegistrations.reduce((sum: number, reg: any) => sum + (reg.fuelCost || 0), 0);
  const totalMaintenanceCost = maintenanceRegistrations.reduce((sum: number, reg: any) => sum + (reg.maintenanceCost || 0), 0);
  const totalKm = tripRegistrations.reduce((sum: number, reg: any) => sum + ((reg.finalKm || 0) - (reg.initialKm || 0)), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard de Frota</CardTitle>
          <CardDescription>Visualização dos dados de movimentação de veículos</CardDescription>
        </CardHeader>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gastos com Combustível</p>
                <h3 className="text-2xl font-bold">{formatCurrency(totalFuelCost)}</h3>
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                <Fuel className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gastos com Manutenção</p>
                <h3 className="text-2xl font-bold">{formatCurrency(totalMaintenanceCost)}</h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Wrench className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quilometragem Total</p>
                <h3 className="text-2xl font-bold">{totalKm.toLocaleString('pt-BR')} km</h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <MapPin className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas rápidas */}
      <Statistics />
      
      {/* Alertas de manutenção */}
      <MaintenanceAlerts />
      
      {/* Charts */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="fuel">Abastecimentos</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenções</TabsTrigger>
          <TabsTrigger value="comparison">Comparações</TabsTrigger>
          <TabsTrigger value="forecast">Previsões</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Registros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={registrationTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                      label={(entry) => entry.name}
                    >
                      {registrationTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [value, 'Quantidade']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Despesas Mensais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyExpensesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `R$ ${(value/100).toFixed(0)}`} />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), 'Valor']}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="abastecimento" name="Abastecimento" fill="#f59e0b" />
                    <Bar dataKey="manutencao" name="Manutenção" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Fuel Tab */}
        <TabsContent value="fuel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consumo de Combustível por Veículo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fuelByVehicleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#f59e0b" />
                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                    <Tooltip 
                      formatter={(value: any, name: any) => [
                        name === 'litros' ? `${value.toFixed(2)} L` : formatCurrency(value),
                        name === 'litros' ? 'Litros' : 'Valor'
                      ]}
                      labelFormatter={(label) => `Veículo: ${label}`}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="litros" name="Litros" fill="#f59e0b" />
                    <Bar yAxisId="right" dataKey="valor" name="Valor" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custos de Manutenção por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={maintenanceByTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="valor"
                      nameKey="name"
                      label={(entry) => entry.name}
                      fill="#10b981"
                    />
                    <Tooltip formatter={(value: any) => [formatCurrency(value), 'Valor']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Comparison Tab - Novo */}
        <TabsContent value="comparison" className="space-y-4">
          <ConsumptionComparison />
          <MonthlyExpenseHistory />
        </TabsContent>
        
        {/* Forecast Tab - Novo */}
        <TabsContent value="forecast" className="space-y-4">
          <ExpensesForecast />
        </TabsContent>
      </Tabs>
    </div>
  );
}