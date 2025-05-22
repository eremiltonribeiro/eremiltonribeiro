import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, Wrench, Car, ArrowRightLeft, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { offlineStorage } from "@/services/offlineStorage";

export function Statistics() {
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
  
  // Calculate statistics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Filter registrations for current month
  const currentMonthRegistrations = registrations.filter((reg: any) => {
    const regDate = new Date(reg.date);
    return regDate.getMonth() === currentMonth && regDate.getFullYear() === currentYear;
  });
  
  // Calculate fuel costs for current month
  const fuelCostsThisMonth = currentMonthRegistrations
    .filter((reg: any) => reg.type === "fuel")
    .reduce((sum: number, reg: any) => sum + (reg.fuelCost || 0), 0);
  
  // Calculate maintenance costs for current month
  const maintenanceCostsThisMonth = currentMonthRegistrations
    .filter((reg: any) => reg.type === "maintenance")
    .reduce((sum: number, reg: any) => sum + (reg.maintenanceCost || 0), 0);
  
  // Calculate kilometers traveled this month
  const kmThisMonth = currentMonthRegistrations
    .filter((reg: any) => reg.type === "trip" && reg.finalKm && reg.initialKm)
    .reduce((sum: number, reg: any) => sum + (reg.finalKm - reg.initialKm), 0);
  
  // Calculate average fuel economy (liters per 100km)
  const totalLiters = registrations
    .filter((reg: any) => reg.type === "fuel")
    .reduce((sum: number, reg: any) => sum + (reg.liters || 0), 0);
  
  const totalKm = registrations
    .filter((reg: any) => reg.type === "trip" && reg.finalKm && reg.initialKm)
    .reduce((sum: number, reg: any) => sum + (reg.finalKm - reg.initialKm), 0);
  
  const fuelEconomy = totalKm > 0 ? (totalLiters / totalKm) * 100 : 0;
  
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Combustível (Mês)</CardTitle>
          <Fuel className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(fuelCostsThisMonth)}</div>
          <p className="text-xs text-muted-foreground">
            Gastos com combustível no mês atual
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Manutenção (Mês)</CardTitle>
          <Wrench className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(maintenanceCostsThisMonth)}</div>
          <p className="text-xs text-muted-foreground">
            Gastos com manutenção no mês atual
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Quilometragem (Mês)</CardTitle>
          <ArrowRightLeft className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kmThisMonth.toLocaleString('pt-BR')} km</div>
          <p className="text-xs text-muted-foreground">
            Distância percorrida no mês atual
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Consumo Médio</CardTitle>
          <Calendar className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{fuelEconomy.toFixed(1)} L/100km</div>
          <p className="text-xs text-muted-foreground">
            Consumo médio da frota
          </p>
        </CardContent>
      </Card>
    </div>
  );
}