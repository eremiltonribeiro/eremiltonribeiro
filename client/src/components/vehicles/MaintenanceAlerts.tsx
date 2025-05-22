import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Wrench, AlertTriangle } from "lucide-react";
import { offlineStorage } from "@/services/offlineStorage";

// Define manutenções programadas e seus intervalos em quilômetros
const MAINTENANCE_INTERVALS = [
  { type: "Troca de Óleo", km: 10000 },
  { type: "Troca de Filtros", km: 10000 },
  { type: "Alinhamento e Balanceamento", km: 10000 },
  { type: "Troca de Pastilhas de Freio", km: 30000 },
  { type: "Troca de Correia Dentada", km: 60000 },
  { type: "Revisão Completa", km: 20000 },
];

// Limites para alertas (em % do intervalo)
const ALERT_THRESHOLDS = {
  warning: 0.9, // 90% do intervalo
  danger: 1.0,  // 100% do intervalo (vencido)
};

export function MaintenanceAlerts() {
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

  // Buscar registros de manutenção
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

  // Filtrar apenas registros de manutenção
  const maintenanceRecords = registrations.filter((reg: any) => reg.type === "maintenance");

  // Organizar registros por veículo e tipo de manutenção
  const maintenanceByVehicle = new Map();
  
  vehicles.forEach((vehicle: any) => {
    // Encontrar a quilometragem mais recente do veículo
    const vehicleRecords = registrations.filter((reg: any) => reg.vehicleId === vehicle.id);
    const latestRecord = vehicleRecords.sort((a: any, b: any) => {
      // Ordenar por data (mais recente primeiro)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })[0];
    
    const currentOdometer = latestRecord?.finalKm || latestRecord?.odometer || vehicle.initialKm || 0;
    
    // Encontrar a última vez que cada tipo de manutenção foi realizada
    const maintenanceTypes = new Map();
    
    MAINTENANCE_INTERVALS.forEach(maintenance => {
      // Filtrar registros deste veículo e deste tipo de manutenção
      const typeRecords = maintenanceRecords.filter((rec: any) => 
        rec.vehicleId === vehicle.id && 
        (typeof rec.maintenanceType === 'string' 
          ? rec.maintenanceType.toLowerCase().includes(maintenance.type.toLowerCase())
          : rec.maintenanceType?.name?.toLowerCase().includes(maintenance.type.toLowerCase()))
      );
      
      // Ordenar por data (mais recente primeiro)
      const lastMaintenance = typeRecords.sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })[0];
      
      const lastMaintenanceKm = lastMaintenance?.odometer || 0;
      const kmSinceLastMaintenance = currentOdometer - lastMaintenanceKm;
      const nextMaintenanceKm = lastMaintenanceKm + maintenance.km;
      const percentCompleted = kmSinceLastMaintenance / maintenance.km;
      
      let status = "ok";
      if (percentCompleted >= ALERT_THRESHOLDS.danger) {
        status = "danger";
      } else if (percentCompleted >= ALERT_THRESHOLDS.warning) {
        status = "warning";
      }
      
      maintenanceTypes.set(maintenance.type, {
        lastMaintenanceKm,
        currentOdometer,
        kmSinceLastMaintenance,
        nextMaintenanceKm,
        percentCompleted,
        status,
        interval: maintenance.km
      });
    });
    
    maintenanceByVehicle.set(vehicle.id, {
      vehicle,
      maintenanceTypes,
      currentOdometer
    });
  });

  // Preparar alertas
  const alerts = [];
  maintenanceByVehicle.forEach((data: any) => {
    const { vehicle, maintenanceTypes } = data;
    
    maintenanceTypes.forEach((info: any, type: string) => {
      if (info.status === "warning" || info.status === "danger") {
        alerts.push({
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          vehiclePlate: vehicle.plate,
          maintenanceType: type,
          status: info.status,
          currentOdometer: info.currentOdometer,
          nextMaintenanceKm: info.nextMaintenanceKm,
          kmRemaining: info.nextMaintenanceKm - info.currentOdometer
        });
      }
    });
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Alertas de Manutenção</CardTitle>
        <Wrench className="h-5 w-5 text-red-500" />
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
            Nenhuma manutenção pendente.
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <Alert key={index} className={
                alert.status === "danger" 
                  ? "border-red-500 bg-red-50" 
                  : "border-amber-500 bg-amber-50"
              }>
                <AlertTriangle className={
                  alert.status === "danger" 
                    ? "h-4 w-4 text-red-600" 
                    : "h-4 w-4 text-amber-600"
                } />
                <AlertTitle className="flex flex-wrap items-center gap-2">
                  {alert.vehicleName} ({alert.vehiclePlate})
                  <Badge 
                    variant={alert.status === "danger" ? "destructive" : "outline"}
                    className={alert.status === "danger" ? "" : "border-amber-500 text-amber-700"}
                  >
                    {alert.status === "danger" ? "Vencido" : "Próximo"}
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-1">
                    {alert.maintenanceType} - 
                    {alert.kmRemaining <= 0 
                      ? ` Vencido há ${Math.abs(alert.kmRemaining).toLocaleString('pt-BR')} km` 
                      : ` Faltam ${alert.kmRemaining.toLocaleString('pt-BR')} km`
                    }
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Hodômetro atual: {alert.currentOdometer.toLocaleString('pt-BR')} km
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}