import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { offlineStorage } from "@/services/offlineStorage";

// Tipo para os registros de veículos
export interface VehicleRegistration {
  id: number;
  date: string;
  type: "fuel" | "maintenance" | "trip";
  vehicle?: {
    id: number;
    name: string;
  };
  driver?: {
    id: number;
    name: string;
  };
  // Campos específicos para abastecimento
  fuelStation?: string;
  fuelType?: string;
  liters?: number;
  fuelPrice?: number;
  fuelCost?: number;
  // Campos específicos para manutenção
  maintenanceType?: string;
  maintenanceDescription?: string;
  maintenanceCost?: number;
  // Campos específicos para viagem
  origin?: string;
  destination?: string;
  startOdometer?: number;
  endOdometer?: number;
  // Campos comuns
  odometer?: number;
  imageId?: string;
  notes?: string;
}

export function useVehicleRegistrations() {
  const [registrations, setRegistrations] = useState<VehicleRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPendingSyncs, setHasPendingSyncs] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);

  // Buscar dados do servidor quando estiver online
  const { data: onlineRegistrations, isLoading: isOnlineLoading } = useQuery({
    queryKey: ['/api/registrations'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: navigator.onLine,
    staleTime: 30000, // 30 segundos
    retry: 2,
    retryDelay: 1000
  });
  
  // Monitorar mudanças no status de conexão
  useEffect(() => {
    const handleOnlineStatus = () => {
      const isOnline = navigator.onLine;
      setIsOfflineMode(!isOnline);
      
      if (isOnline) {
        // Verificar se há registros para sincronizar quando voltar a ficar online
        checkPendingSyncs();
      }
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Verificar status inicial
    handleOnlineStatus();
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);
  
  // Verificar se há registros pendentes de sincronização
  const checkPendingSyncs = async () => {
    try {
      const pendingItems = await offlineStorage.getPendingRegistrations();
      setHasPendingSyncs(pendingItems.length > 0);
    } catch (error) {
      console.error("Erro ao verificar registros pendentes:", error);
    }
  };

  // Carregar registros
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      try {
        if (navigator.onLine && onlineRegistrations) {
          // Quando online, priorizar dados do servidor mas manter registros pendentes
          const pendingItems = await offlineStorage.getPendingRegistrations();
          
          // Combinar dados do servidor com registros offline pendentes
          // Os registros pendentes substituem os do servidor se tiverem o mesmo ID
          const mergedData = [...onlineRegistrations];
          
          // Adicionar registros pendentes que ainda não foram sincronizados
          for (const pendingItem of pendingItems) {
            const existingIndex = mergedData.findIndex(item => item.id === pendingItem.id);
            if (existingIndex >= 0) {
              // Substituir com a versão pendente
              mergedData[existingIndex] = pendingItem;
            } else {
              // Adicionar novo item pendente
              mergedData.push(pendingItem);
            }
          }
          
          setRegistrations(mergedData);
          setHasPendingSyncs(pendingItems.length > 0);
          
          // Armazenar todos os registros localmente
          await offlineStorage.saveRegistrations(mergedData);
        } else {
          // Quando offline, usar dados armazenados localmente
          const offlineData = await offlineStorage.getRegistrations();
          setRegistrations(offlineData);
          
          // Verificar se há registros pendentes
          const pendingItems = offlineData.filter(item => item.offlinePending);
          setHasPendingSyncs(pendingItems.length > 0);
        }
      } catch (error) {
        console.error("Erro ao carregar registros:", error);
        
        // Fallback para dados offline em caso de erro
        try {
          const offlineData = await offlineStorage.getRegistrations();
          setRegistrations(offlineData);
          
          // Verificar se há registros pendentes
          const pendingItems = offlineData.filter(item => item.offlinePending);
          setHasPendingSyncs(pendingItems.length > 0);
        } catch (innerError) {
          console.error("Erro ao carregar backup offline:", innerError);
          setRegistrations([]);
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [onlineRegistrations, isOfflineMode]);

  // Dados de exemplo para demonstração se não houver dados
  useEffect(() => {
    if (!isLoading && registrations.length === 0) {
      // Dados de exemplo apenas para demonstração inicial
      const demoData: VehicleRegistration[] = [
        {
          id: 1,
          date: "2023-05-15",
          type: "fuel",
          vehicle: { id: 1, name: "Caminhão MER-2344" },
          driver: { id: 1, name: "Carlos Silva" },
          fuelStation: "Posto Ipiranga",
          fuelType: "Diesel S10",
          liters: 150,
          fuelPrice: 4.89,
          fuelCost: 733.5,
          odometer: 45678
        },
        {
          id: 2,
          date: "2023-05-14",
          type: "maintenance",
          vehicle: { id: 2, name: "Carregadeira HD78" },
          driver: { id: 2, name: "Marcos Oliveira" },
          maintenanceType: "Troca de Óleo",
          maintenanceDescription: "Troca de óleo e filtros",
          maintenanceCost: 850,
          odometer: 12500
        },
        {
          id: 3,
          date: "2023-05-13",
          type: "trip",
          vehicle: { id: 1, name: "Caminhão MER-2344" },
          driver: { id: 3, name: "Pedro Santos" },
          origin: "Mina Principal",
          destination: "Porto de Santos",
          startOdometer: 45200,
          endOdometer: 45678
        }
      ];
      
      setRegistrations(demoData);
    }
  }, [isLoading, registrations.length]);

  // Adicionar um novo registro com suporte a modo offline
  const addRegistration = async (newRegistration: Omit<VehicleRegistration, 'id'>): Promise<{success: boolean, offline: boolean, id?: number}> => {
    try {
      // Se estiver online, tentar enviar ao servidor
      if (navigator.onLine) {
        try {
          // Enviar para o servidor
          const response = await fetch('/api/registrations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newRegistration)
          });
          
          if (response.ok) {
            const savedRegistration = await response.json();
            
            // Atualizar o armazenamento local com o novo registro confirmado
            const currentRegistrations = await offlineStorage.getRegistrations();
            await offlineStorage.saveRegistrations([...currentRegistrations, savedRegistration]);
            
            // Atualizar o estado local
            setRegistrations(prev => [...prev, savedRegistration]);
            
            return {
              success: true, 
              offline: false,
              id: savedRegistration.id
            };
          } else {
            // Erro ao salvar no servidor, cair no modo offline
            console.error("Erro ao salvar registro no servidor. Salvando offline.");
            return await saveOffline(newRegistration);
          }
        } catch (error) {
          // Erro de conexão, cair no modo offline
          console.error("Erro de conexão ao salvar registro. Salvando offline:", error);
          return await saveOffline(newRegistration);
        }
      } else {
        // Modo offline: salvar localmente
        return await saveOffline(newRegistration);
      }
    } catch (error) {
      console.error("Erro ao adicionar registro:", error);
      return { success: false, offline: !navigator.onLine };
    }
  };
  
  // Função auxiliar para salvar no modo offline
  const saveOffline = async (newRegistration: Omit<VehicleRegistration, 'id'>): Promise<{success: boolean, offline: boolean, id?: number}> => {
    // Gerar um ID temporário para o registro offline
    const offlineId = Date.now();
    
    const offlineRegistration = {
      ...newRegistration,
      id: offlineId,
      offlineCreated: true,
      offlinePending: true,
      offlineTimestamp: new Date().toISOString()
    };
    
    // Salvar no armazenamento local
    const result = await offlineStorage.saveRegistration(offlineRegistration);
    
    if (result.success) {
      // Atualizar o estado local se o salvamento foi bem-sucedido
      setRegistrations(prev => [...prev, offlineRegistration]);
      setHasPendingSyncs(true);
    }
    
    return result;
  };
  
  // Sincronizar registros offline
  const syncPendingRegistrations = async (): Promise<{success: boolean, count: number}> => {
    if (!navigator.onLine) {
      return { success: false, count: 0 };
    }
    
    try {
      const syncResult = await offlineStorage.syncWithServer();
      
      // Recarregar os dados após a sincronização
      if (syncResult.syncedCount > 0) {
        // Recarregar os dados
        const updatedOfflineData = await offlineStorage.getRegistrations();
        setRegistrations(updatedOfflineData);
        
        // Verificar se ainda há registros pendentes
        const remainingPending = updatedOfflineData.filter(item => item.offlinePending);
        setHasPendingSyncs(remainingPending.length > 0);
      }
      
      return {
        success: syncResult.success, 
        count: syncResult.syncedCount
      };
    } catch (error) {
      console.error("Erro ao sincronizar registros:", error);
      return { success: false, count: 0 };
    }
  };
  
  return {
    registrations,
    isLoading,
    isOnline: navigator.onLine,
    isOfflineMode,
    hasPendingSyncs,
    addRegistration,
    syncPendingRegistrations
  };
}