import { Link, useLocation } from "wouter";
import { Plus, History, BarChart2, Wifi, WifiOff, Settings, FileText, Download, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { offlineStorage } from "@/services/offlineStorage";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/logo";
import { brandColors } from "@/lib/colors";
import { AuthStatus } from "@/components/ui/auth-status";
import { InstallPWAButton } from "@/components/ui/install-pwa-button";

export function Header() {
  const [location, setLocation] = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncs, setPendingSyncs] = useState(0);
  const { toast } = useToast();

  const isHistory = location.includes("history");
  const isDashboard = location.includes("dashboard");

  // Check for online status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Conectado",
        description: "Você está online novamente. Clique para sincronizar dados.",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={syncData}
          >
            Sincronizar
          </Button>
        ),
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Desconectado",
        description: "Você está offline. Os dados serão salvos localmente até que a conexão seja restaurada.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending syncs
    const checkPendingSyncs = async () => {
      const registrations = await offlineStorage.getRegistrations();
      const offlineRegs = registrations.filter(reg => reg.isOffline);
      setPendingSyncs(offlineRegs.length);
    };

    checkPendingSyncs();
    const interval = setInterval(checkPendingSyncs, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [toast]);

  const syncData = async () => {
    if (!isOnline) {
      toast({
        title: "Sem conexão",
        description: "Você está offline. Não é possível sincronizar os dados.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sincronizando",
      description: "Aguarde enquanto sincronizamos os dados...",
    });

    try {
      const success = await offlineStorage.syncWithServer();
      if (success) {
        setPendingSyncs(0);
        toast({
          title: "Sincronização concluída",
          description: "Todos os dados foram sincronizados com sucesso.",
        });
      } else {
        toast({
          title: "Erro de sincronização",
          description: "Alguns dados não puderam ser sincronizados. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de sincronização",
        description: "Ocorreu um erro ao sincronizar os dados.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-10 border-b-2 border-blue-900">
      <div className="container mx-auto px-2 sm:px-4 py-2 flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-2 py-1">
          <Logo showText={false} />
          <h1 className="text-base sm:text-xl font-bold text-blue-900 break-words">
            <span className="whitespace-normal break-all">Sistema de Gestão de Frota</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Connection Status */}
          <div className="mr-1 sm:mr-2 hidden sm:block">
            {isOnline ? (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 flex items-center">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
          
          {/* PWA Install Button */}
          <div className="mr-1 hidden sm:block">
            <InstallPWAButton />
          </div>
          
          {/* Authentication and Logout Button */}
          <div className="flex items-center gap-2">
            <AuthStatus />
            
            <Button 
              variant="ghost" 
              size="icon"
              className="text-red-700 hover:text-red-900 hover:bg-red-100"
              title="Sair"
              onClick={() => {
                // Remover dados de autenticação do localStorage
                localStorage.removeItem("authenticated");
                localStorage.removeItem("user");
                // Redirecionar para tela de login
                window.location.href = "/login";
              }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-1 sm:gap-2">
            {/* Dashboard Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/registros/dashboard")}
              className={`text-blue-900 hover:bg-blue-100 rounded-full ${isDashboard ? 'bg-blue-100' : ''}`}
              title="Dashboard"
            >
              <BarChart2 className="h-5 w-5" />
            </Button>

            {/* History/New Button */}
            {isHistory || isDashboard ? (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation("/registros")}
                className="text-blue-900 hover:bg-blue-100 rounded-full"
                title="Novo Registro"
              >
                <Plus className="h-5 w-5" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation("/registros/history")}
                className="text-blue-900 hover:bg-blue-100 rounded-full"
                title="Histórico"
              >
                <History className="h-5 w-5" />
              </Button>
            )}
            
            {/* Settings Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/configuracoes")}
              className="text-blue-900 hover:bg-blue-100 rounded-full"
              title="Configurações"
            >
              <Settings className="h-5 w-5" />
            </Button>

            {/* Reports Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/relatorios")}
              className="text-yellow-700 hover:bg-yellow-100 rounded-full"
              title="Relatórios"
            >
              <FileText className="h-5 w-5" />
            </Button>

            {/* Sync Button (shown only when there are pending syncs) */}
            {pendingSyncs > 0 && (
              <Button
                variant="outline" 
                size="sm"
                onClick={syncData}
                disabled={!isOnline}
                className="text-blue-900 border-blue-900 hover:bg-blue-100"
              >
                <span className="text-xs">Sincronizar ({pendingSyncs})</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
