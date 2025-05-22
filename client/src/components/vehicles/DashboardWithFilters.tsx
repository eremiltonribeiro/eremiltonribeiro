import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  Cell,
  LineChart,
  Line,
} from "recharts";
import { 
  Fuel, 
  Wrench, 
  MapPin, 
  Calendar, 
  Search, 
  FilterX, 
  User, 
  Car, 
  CalendarRange,
  ChevronDown
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { offlineStorage } from "@/services/offlineStorage";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { pt } from "date-fns/locale";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function DashboardWithFilters() {
  // Estado para filtros
  const [timeFilter, setTimeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("resumo");
  const [vehicleData, setVehicleData] = useState<any[]>([]);
  
  // Filtros avançados
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
  const [selectedDriverIds, setSelectedDriverIds] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);

  // Buscar registros com suporte offline
  const { data: registrations = [], isLoading: loadingRegistrations } = useQuery({
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
        
        // Fallback para dados offline
        return await offlineStorage.getRegistrations();
      } catch (error) {
        console.error("Erro ao buscar registros:", error);
        return await offlineStorage.getRegistrations();
      }
    }
  });

  // Buscar veículos
  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
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
  
  // Buscar motoristas
  const { data: drivers = [], isLoading: loadingDrivers } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/drivers");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveDrivers(data);
            return data;
          }
        }
        
        return await offlineStorage.getDrivers();
      } catch (error) {
        console.error("Erro ao buscar motoristas:", error);
        return await offlineStorage.getDrivers();
      }
    }
  });

  // Limpar filtros
  const resetFilters = () => {
    setSelectedVehicleIds([]);
    setSelectedDriverIds([]);
    setTimeFilter("all");
    setDateRange({ from: undefined, to: undefined });
    setUseCustomDateRange(false);
  };

  // Verificar se um veículo está selecionado
  const isVehicleSelected = (id: number) => {
    return selectedVehicleIds.length === 0 || selectedVehicleIds.includes(id);
  };

  // Verificar se um motorista está selecionado
  const isDriverSelected = (id: number) => {
    return selectedDriverIds.length === 0 || selectedDriverIds.includes(id);
  };

  // Alternar seleção de veículo
  const toggleVehicleSelection = (id: number) => {
    if (selectedVehicleIds.includes(id)) {
      setSelectedVehicleIds(selectedVehicleIds.filter(vehicleId => vehicleId !== id));
    } else {
      setSelectedVehicleIds([...selectedVehicleIds, id]);
    }
  };

  // Alternar seleção de motorista
  const toggleDriverSelection = (id: number) => {
    if (selectedDriverIds.includes(id)) {
      setSelectedDriverIds(selectedDriverIds.filter(driverId => driverId !== id));
    } else {
      setSelectedDriverIds([...selectedDriverIds, id]);
    }
  };

  // Obter texto informativo do período selecionado
  const getTimeFilterText = () => {
    if (useCustomDateRange) {
      const fromDate = dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : '';
      const toDate = dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'hoje';
      return `${fromDate} até ${toDate}`;
    }
    
    switch (timeFilter) {
      case "month": return "Último mês";
      case "3months": return "Últimos 3 meses";
      case "6months": return "Últimos 6 meses";
      case "year": return "Último ano";
      default: return "Todo o período";
    }
  };

  // Filtrar registros por período, veículo e motorista
  const filterRegistrations = (regs: any[]) => {
    // Filtrar por veículo
    let filteredRegs = regs;
    
    if (selectedVehicleIds.length > 0) {
      filteredRegs = filteredRegs.filter((reg: any) => 
        selectedVehicleIds.includes(reg.vehicleId)
      );
    }
    
    // Filtrar por motorista
    if (selectedDriverIds.length > 0) {
      filteredRegs = filteredRegs.filter((reg: any) => 
        selectedDriverIds.includes(reg.driverId)
      );
    }
    
    // Filtrar por período de data
    if (useCustomDateRange && dateRange.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      filteredRegs = filteredRegs.filter((reg: any) => {
        const regDate = new Date(reg.date);
        return regDate >= fromDate;
      });
      
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        
        filteredRegs = filteredRegs.filter((reg: any) => {
          const regDate = new Date(reg.date);
          return regDate <= toDate;
        });
      }
    } else if (timeFilter !== "all") {
      const today = new Date();
      const periodStart = new Date();
      
      switch (timeFilter) {
        case "month":
          periodStart.setMonth(today.getMonth() - 1);
          break;
        case "3months":
          periodStart.setMonth(today.getMonth() - 3);
          break;
        case "6months":
          periodStart.setMonth(today.getMonth() - 6);
          break;
        case "year":
          periodStart.setFullYear(today.getFullYear() - 1);
          break;
      }
      
      filteredRegs = filteredRegs.filter((reg: any) => new Date(reg.date) >= periodStart);
    }
    
    return filteredRegs;
  };
  
  // Atualizar dados por veículo quando os registros ou filtros mudarem
  useEffect(() => {
    if (registrations.length && vehicles.length) {
      const filteredRegistrations = filterRegistrations(registrations);
      
      // Preparar dados por veículo
      const vehicleStats = vehicles.map((vehicle: any) => {
        // Filtrar registros para este veículo
        const vehicleRegs = filteredRegistrations.filter((reg: any) => reg.vehicleId === vehicle.id);
        const fuelRegs = vehicleRegs.filter((reg: any) => reg.type === "fuel");
        const maintenanceRegs = vehicleRegs.filter((reg: any) => reg.type === "maintenance");
        const tripRegs = vehicleRegs.filter((reg: any) => reg.type === "trip");
        
        // Calcular estatísticas
        const totalFuelCost = fuelRegs.reduce((sum: number, reg: any) => sum + (reg.fuelCost || 0), 0);
        const totalMaintenanceCost = maintenanceRegs.reduce((sum: number, reg: any) => sum + (reg.maintenanceCost || 0), 0);
        const totalFuel = fuelRegs.reduce((sum: number, reg: any) => sum + (reg.fuelQuantity || 0), 0);
        
        // Calcular quilometragem total (das viagens)
        const totalKm = tripRegs.reduce((sum: number, reg: any) => sum + ((reg.finalKm || 0) - (reg.initialKm || 0)), 0);
        
        // Calcular consumo médio (L/100km)
        let avgConsumption = 0;
        if (totalKm > 0 && totalFuel > 0) {
          avgConsumption = (totalFuel / totalKm) * 100;
        }
        
        return {
          id: vehicle.id,
          name: vehicle.name,
          plate: vehicle.plate,
          model: vehicle.model,
          totalFuelCost,
          totalMaintenanceCost,
          totalCost: totalFuelCost + totalMaintenanceCost,
          avgConsumption,
          totalKm
        };
      });
      
      setVehicleData(vehicleStats);
    }
  }, [registrations, vehicles, timeFilter, selectedVehicleIds, selectedDriverIds, dateRange, useCustomDateRange]);

  const isLoading = loadingRegistrations || loadingVehicles || loadingDrivers;

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

  // Filtrar registros pelos critérios selecionados
  const filteredRegistrations = filterRegistrations(registrations);
  
  // Preparar dados para gráficos
  const fuelRegistrations = filteredRegistrations.filter((reg: any) => reg.type === "fuel");
  const maintenanceRegistrations = filteredRegistrations.filter((reg: any) => reg.type === "maintenance");
  const tripRegistrations = filteredRegistrations.filter((reg: any) => reg.type === "trip");

  // Dados para distribuição de tipos de registros
  const registrationTypeData = [
    { name: "Abastecimentos", value: fuelRegistrations.length, color: "#f59e0b" },
    { name: "Manutenções", value: maintenanceRegistrations.length, color: "#10b981" },
    { name: "Viagens", value: tripRegistrations.length, color: "#3b82f6" },
  ];

  // Calcular totais
  const totalFuelCost = fuelRegistrations.reduce((sum: number, reg: any) => sum + (reg.fuelCost || 0), 0);
  const totalMaintenanceCost = maintenanceRegistrations.reduce((sum: number, reg: any) => sum + (reg.maintenanceCost || 0), 0);
  const totalKm = tripRegistrations.reduce((sum: number, reg: any) => sum + ((reg.finalKm || 0) - (reg.initialKm || 0)), 0);

  // Preparar dados para gráfico de linha (gastos por mês)
  const getMonthlyExpenseData = () => {
    // Criar um objeto para armazenar gastos por mês
    const monthlyExpenses: Record<string, {
      month: string, 
      combustivel: number, 
      manutencao: number,
      total: number
    }> = {};
    
    // Definir período dos últimos 12 meses
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 11); // 12 meses incluindo o atual
    
    // Inicializar o objeto com zeros para todos os meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);
      
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      monthlyExpenses[monthKey] = {
        month: monthName,
        combustivel: 0,
        manutencao: 0,
        total: 0
      };
    }
    
    // Preencher com dados reais
    filteredRegistrations.forEach((reg: any) => {
      const regDate = new Date(reg.date);
      const monthKey = `${regDate.getFullYear()}-${(regDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Verificar se o mês está no período analisado
      if (monthlyExpenses[monthKey]) {
        if (reg.type === 'fuel' && reg.fuelCost) {
          monthlyExpenses[monthKey].combustivel += reg.fuelCost || 0;
          monthlyExpenses[monthKey].total += reg.fuelCost || 0;
        } else if (reg.type === 'maintenance' && reg.maintenanceCost) {
          monthlyExpenses[monthKey].manutencao += reg.maintenanceCost || 0;
          monthlyExpenses[monthKey].total += reg.maintenanceCost || 0;
        }
      }
    });
    
    // Converter o objeto para um array ordenado por mês
    return Object.values(monthlyExpenses).sort((a, b) => {
      const monthA = Object.keys(monthlyExpenses).find(key => monthlyExpenses[key] === a);
      const monthB = Object.keys(monthlyExpenses).find(key => monthlyExpenses[key] === b);
      return monthA && monthB ? monthA.localeCompare(monthB) : 0;
    });
  };
  
  const monthlyExpenseData = getMonthlyExpenseData();

  // Preparar dados para consumo por veículo
  const vehicleConsumptionData = vehicleData
    .filter(v => v.avgConsumption > 0)
    .sort((a, b) => a.avgConsumption - b.avgConsumption)
    .map(v => ({
      name: v.name,
      consumo: parseFloat(v.avgConsumption.toFixed(2))
    }));

  // Componente de filtros avançados
  const AdvancedFilters = () => (
    <Collapsible 
      open={showFilters} 
      onOpenChange={setShowFilters}
      className="mt-2"
    >
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4" />
          <span>Filtros avançados</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-6 border p-4 rounded-md bg-slate-50 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Filtro de data */}
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Período</span>
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <Checkbox 
                id="custom-date" 
                checked={useCustomDateRange}
                onCheckedChange={(checked) => setUseCustomDateRange(checked === true)}
              />
              <Label htmlFor="custom-date">Seleção personalizada</Label>
            </div>
            {useCustomDateRange ? (
              <div className="flex flex-col gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-left font-normal w-full"
                    >
                      <CalendarRange className="h-4 w-4 mr-2" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                            {format(dateRange.to, "dd/MM/yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy")
                        )
                      ) : (
                        "Selecione um período"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      locale={pt}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="period-all" 
                    checked={timeFilter === 'all'}
                    onCheckedChange={() => setTimeFilter('all')}
                  />
                  <Label htmlFor="period-all">Todo o período</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="period-month" 
                    checked={timeFilter === 'month'}
                    onCheckedChange={() => setTimeFilter('month')}
                  />
                  <Label htmlFor="period-month">Último mês</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="period-3months" 
                    checked={timeFilter === '3months'}
                    onCheckedChange={() => setTimeFilter('3months')}
                  />
                  <Label htmlFor="period-3months">Últimos 3 meses</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="period-6months" 
                    checked={timeFilter === '6months'}
                    onCheckedChange={() => setTimeFilter('6months')}
                  />
                  <Label htmlFor="period-6months">Últimos 6 meses</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="period-year" 
                    checked={timeFilter === 'year'}
                    onCheckedChange={() => setTimeFilter('year')}
                  />
                  <Label htmlFor="period-year">Último ano</Label>
                </div>
              </div>
            )}
          </div>

          {/* Filtro de veículos */}
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-1">
              <Car className="h-4 w-4" />
              <span>Veículos</span>
            </h3>
            <div className="h-48 overflow-y-auto border rounded-md p-2">
              {vehicles.map((vehicle: any) => (
                <div key={vehicle.id} className="flex items-center gap-2 mb-1">
                  <Checkbox 
                    id={`vehicle-${vehicle.id}`} 
                    checked={isVehicleSelected(vehicle.id)}
                    onCheckedChange={() => toggleVehicleSelection(vehicle.id)}
                  />
                  <Label htmlFor={`vehicle-${vehicle.id}`} className="text-sm">
                    {vehicle.name} ({vehicle.plate})
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Filtro de motoristas */}
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Motoristas</span>
            </h3>
            <div className="h-48 overflow-y-auto border rounded-md p-2">
              {drivers.map((driver: any) => (
                <div key={driver.id} className="flex items-center gap-2 mb-1">
                  <Checkbox 
                    id={`driver-${driver.id}`} 
                    checked={isDriverSelected(driver.id)}
                    onCheckedChange={() => toggleDriverSelection(driver.id)}
                  />
                  <Label htmlFor={`driver-${driver.id}`} className="text-sm">
                    {driver.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={resetFilters}
            className="flex items-center gap-1"
          >
            <FilterX className="h-4 w-4" />
            Limpar filtros
          </Button>
          <Button
            size="sm"
            onClick={() => setShowFilters(false)}
          >
            Aplicar filtros
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
        <div className="text-xl font-semibold text-blue-900 mb-2 sm:mb-0">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-700" />
            <span>Painel de Controle</span>
          </div>
        </div>
        <div className="text-sm text-gray-600 flex items-center gap-1 mb-2 sm:mb-0">
          <Calendar className="h-4 w-4" />
          <span>Dados para: {getTimeFilterText()}</span>
        </div>
      </div>

      {/* Filtros avançados */}
      <AdvancedFilters />

      {/* Cartões de resumo */}
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

      {/* Tabs para visualizações diferentes */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="gastos">Análise de Gastos</TabsTrigger>
          <TabsTrigger value="veiculos">Comparativo de Veículos</TabsTrigger>
        </TabsList>
        
        {/* Tab de Resumo */}
        <TabsContent value="resumo" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <CardTitle>Gastos por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyExpenseData}>
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip 
                        formatter={(value: any) => [formatCurrency(value), 'Valor']}
                        labelFormatter={(label) => `Mês: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="combustivel" 
                        name="Combustível"
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="manutencao" 
                        name="Manutenção" 
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tab de Análise de Gastos */}
        <TabsContent value="gastos" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Gastos por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyExpenseData}>
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), 'Valor']}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="combustivel" 
                      name="Combustível" 
                      stackId="a"
                      fill="#f59e0b" 
                    />
                    <Bar 
                      dataKey="manutencao" 
                      name="Manutenção" 
                      stackId="a"
                      fill="#10b981" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Custos por Veículo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={vehicleData.map(v => ({
                      name: v.name,
                      combustivel: v.totalFuelCost,
                      manutencao: v.totalMaintenanceCost,
                    }))}
                  >
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), 'Valor']}
                    />
                    <Legend />
                    <Bar 
                      dataKey="combustivel" 
                      name="Combustível" 
                      stackId="a"
                      fill="#f59e0b" 
                    />
                    <Bar 
                      dataKey="manutencao" 
                      name="Manutenção" 
                      stackId="a"
                      fill="#10b981" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Comparativo de Veículos */}
        <TabsContent value="veiculos" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Consumo Médio (L/100km)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vehicleConsumptionData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip 
                      formatter={(value: any) => [`${value} L/100km`, 'Consumo']}
                    />
                    <Legend />
                    <Bar 
                      dataKey="consumo" 
                      name="Consumo (L/100km)" 
                      fill="#3b82f6" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Custo por Quilômetro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={vehicleData
                      .filter(v => v.totalKm > 0)
                      .map(v => ({
                        name: v.name,
                        custo: parseFloat((v.totalCost / Math.max(1, v.totalKm)).toFixed(2))
                      }))
                      .sort((a, b) => a.custo - b.custo)
                    }
                    layout="vertical"
                  >
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), 'Custo/km']}
                    />
                    <Bar 
                      dataKey="custo" 
                      name="Custo por km" 
                      fill="#ea580c" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Dados do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium mb-2">Registros</h3>
              <p>Total: {filteredRegistrations.length}</p>
              <p>Abastecimentos: {fuelRegistrations.length}</p>
              <p>Manutenções: {maintenanceRegistrations.length}</p>
              <p>Viagens: {tripRegistrations.length}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Custos</h3>
              <p>Combustível: {formatCurrency(totalFuelCost)}</p>
              <p>Manutenção: {formatCurrency(totalMaintenanceCost)}</p>
              <p>Total: {formatCurrency(totalFuelCost + totalMaintenanceCost)}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Veículos</h3>
              <p>Quilometragem: {totalKm.toLocaleString('pt-BR')} km</p>
              <p>Custo médio: {formatCurrency((totalFuelCost + totalMaintenanceCost) / Math.max(1, totalKm))} por km</p>
              <p>Consumo médio: {vehicleData.reduce((sum, v) => sum + v.avgConsumption, 0) / Math.max(1, vehicleData.filter(v => v.avgConsumption > 0).length).toFixed(2)} L/100km</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}