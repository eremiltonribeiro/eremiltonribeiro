import { Link, useLocation } from "wouter";
import { Home, BarChart2, History, Settings, Car, Plus, FileText, Users, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// Interface para perfis de usuário
interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: {
    dashboard: boolean;
    registrations: boolean;
    history: boolean;
    reports: boolean;
    checklists: boolean;
    settings: boolean;
    userManagement: boolean;
    vehicleManagement: boolean;
    driverManagement: boolean;
  };
}

export function Navigation() {
  const [location, setLocation] = useLocation();
  const [userPermissions, setUserPermissions] = useState<{[key: string]: boolean}>({
    dashboard: false,
    registrations: false,
    history: false,
    reports: false,
    checklists: false,
    settings: false,
    userManagement: false,
    vehicleManagement: false,
    driverManagement: false
  });
  
  // Carregar permissões do usuário
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userRole = userData.role;
    
    if (userRole) {
      // Buscar o perfil correspondente no localStorage
      const userRoles: UserRole[] = JSON.parse(localStorage.getItem("userRoles") || "[]");
      const currentRole = userRoles.find(role => role.name.toLowerCase() === userRole.toLowerCase());
      
      if (currentRole) {
        setUserPermissions(currentRole.permissions);
      } else {
        // Perfis padrão caso não encontre
        if (userRole === "admin") {
          setUserPermissions({
            dashboard: true,
            registrations: true,
            history: true,
            reports: true,
            checklists: true,
            settings: true,
            userManagement: true,
            vehicleManagement: true,
            driverManagement: true
          });
        } else if (userRole === "manager") {
          setUserPermissions({
            dashboard: true,
            registrations: true,
            history: true,
            reports: true,
            checklists: true,
            settings: true,
            userManagement: false,
            vehicleManagement: true,
            driverManagement: true
          });
        } else {
          // Usuário comum ou motorista
          setUserPermissions({
            dashboard: false,
            registrations: true,
            history: true,
            reports: false,
            checklists: true,
            settings: false,
            userManagement: false,
            vehicleManagement: false,
            driverManagement: false
          });
        }
      }
    }
  }, []);
  
  // Helper function to check if a route is active
  const isActive = (route: string) => {
    if (route === "/" && location === "/") return true;
    if (route === "/registros?view=dashboard" && location.includes("dashboard")) return true;
    if (route === "/registros?view=history" && location.includes("history")) return true;
    if (route === "/registros" && location === "/registros") return true;
    if (route === "/relatorios" && location.includes("relatorios")) return true;
    if (route === "/configuracoes" && location.includes("configuracoes")) return true;
    if (route === "/usuarios" && location.includes("usuarios")) return true;
    if (route === "/checklists" && location.includes("checklists")) return true;
    return false;
  };
  
  return (
    <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-md py-0 mb-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo e título */}
          <div className="flex items-center p-3">
            <img src="/src/assets/logo.png" alt="Logo" className="w-8 h-8 mr-3" />
            <h1 className="text-lg font-bold text-white">Sistema de Gestão de Frota</h1>
          </div>
          
          {/* Botão de menu mobile */}
          <div className="block sm:hidden mr-4">
            <button 
              className="flex items-center px-3 py-2 border rounded text-white border-white hover:border-transparent hover:bg-blue-700"
              onClick={() => {
                const menu = document.getElementById('mobile-menu');
                if (menu) {
                  menu.classList.toggle('hidden');
                }
              }}
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/>
              </svg>
            </button>
          </div>
          
          {/* Menu desktop */}
          <div className="hidden sm:flex space-x-1 p-1">
            <Button
              variant={isActive("/") ? "secondary" : "ghost"}
              className={`flex items-center gap-1 rounded-md h-10 ${isActive("/") ? "bg-blue-700 text-white hover:bg-blue-600" : "text-white hover:bg-blue-700"}`}
              onClick={() => setLocation("/")}
            >
              <Home className="h-4 w-4" />
              <span className="text-sm">Início</span>
            </Button>
            
            {userPermissions.registrations && (
              <Button
                variant={isActive("/registros") ? "secondary" : "ghost"}
                className={`flex items-center gap-1 rounded-md h-10 ${isActive("/registros") ? "bg-blue-700 text-white hover:bg-blue-600" : "text-white hover:bg-blue-700"}`}
                onClick={() => setLocation("/registros")}
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Registros</span>
              </Button>
            )}
            
            {userPermissions.history && (
              <Button
                variant={isActive("/registros?view=history") ? "secondary" : "ghost"}
                className={`flex items-center gap-1 rounded-md h-10 ${isActive("/registros?view=history") ? "bg-blue-700 text-white hover:bg-blue-600" : "text-white hover:bg-blue-700"}`}
                onClick={() => setLocation("/registros/history")}
              >
                <History className="h-4 w-4" />
                <span className="text-sm">Histórico</span>
              </Button>
            )}
            
            {userPermissions.dashboard && (
              <Button
                variant={isActive("/registros?view=dashboard") ? "secondary" : "ghost"}
                className={`flex items-center gap-1 rounded-md h-10 ${isActive("/registros?view=dashboard") ? "bg-blue-700 text-white hover:bg-blue-600" : "text-white hover:bg-blue-700"}`}
                onClick={() => setLocation("/registros/dashboard")}
              >
                <BarChart2 className="h-4 w-4" />
                <span className="text-sm">Dashboard</span>
              </Button>
            )}
            
            {userPermissions.checklists && (
              <Button
                variant={isActive("/checklists") ? "secondary" : "ghost"}
                className={`flex items-center gap-1 rounded-md h-10 ${isActive("/checklists") ? "bg-blue-700 text-white hover:bg-blue-600" : "text-white hover:bg-blue-700"}`}
                onClick={() => setLocation("/checklists")}
              >
                <CheckSquare className="h-4 w-4" />
                <span className="text-sm">Checklists</span>
              </Button>
            )}

            {userPermissions.reports && (
              <Button
                variant={isActive("/relatorios") ? "secondary" : "ghost"}
                className={`flex items-center gap-1 rounded-md h-10 ${isActive("/relatorios") ? "bg-blue-700 text-white hover:bg-blue-600" : "text-white hover:bg-blue-700"}`}
                onClick={() => setLocation("/relatorios")}
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm">Relatórios</span>
              </Button>
            )}
            
            {userPermissions.settings && (
              <Button
                variant={isActive("/configuracoes") ? "secondary" : "ghost"}
                className={`flex items-center gap-1 rounded-md h-10 ${isActive("/configuracoes") ? "bg-blue-700 text-white hover:bg-blue-600" : "text-white hover:bg-blue-700"}`}
                onClick={() => setLocation("/configuracoes")}
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm">Configurações</span>
              </Button>
            )}
            
            {userPermissions.userManagement && (
              <Button
                variant={isActive("/usuarios") ? "secondary" : "ghost"}
                className={`flex items-center gap-1 rounded-md h-10 ${isActive("/usuarios") ? "bg-blue-700 text-white hover:bg-blue-600" : "text-white hover:bg-blue-700"}`}
                onClick={() => setLocation("/usuarios")}
              >
                <Users className="h-4 w-4" />
                <span className="text-sm">Usuários</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Menu mobile */}
        <div id="mobile-menu" className="hidden sm:hidden pb-3 pt-1 px-2">
          <div className="flex flex-col space-y-2">
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-2 rounded-md w-full ${isActive("/") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"}`}
              onClick={() => {
                setLocation("/");
                document.getElementById('mobile-menu')?.classList.toggle('hidden');
              }}
            >
              <Home className="h-5 w-5" />
              <span>Início</span>
            </Button>
            
            {userPermissions.registrations && (
              <Button
                variant="ghost"
                className={`flex items-center justify-start gap-2 rounded-md w-full ${isActive("/registros") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"}`}
                onClick={() => {
                  setLocation("/registros");
                  document.getElementById('mobile-menu')?.classList.toggle('hidden');
                }}
              >
                <Plus className="h-5 w-5" />
                <span>Registros</span>
              </Button>
            )}
            
            {userPermissions.history && (
              <Button
                variant="ghost"
                className={`flex items-center justify-start gap-2 rounded-md w-full ${isActive("/registros?view=history") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"}`}
                onClick={() => {
                  setLocation("/registros/history");
                  document.getElementById('mobile-menu')?.classList.toggle('hidden');
                }}
              >
                <History className="h-5 w-5" />
                <span>Histórico</span>
              </Button>
            )}
            
            {userPermissions.dashboard && (
              <Button
                variant="ghost"
                className={`flex items-center justify-start gap-2 rounded-md w-full ${isActive("/registros?view=dashboard") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"}`}
                onClick={() => {
                  setLocation("/registros/dashboard");
                  document.getElementById('mobile-menu')?.classList.toggle('hidden');
                }}
              >
                <BarChart2 className="h-5 w-5" />
                <span>Dashboard</span>
              </Button>
            )}
            
            {userPermissions.checklists && (
              <Button
                variant="ghost"
                className={`flex items-center justify-start gap-2 rounded-md w-full ${isActive("/checklists") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"}`}
                onClick={() => {
                  setLocation("/checklists");
                  document.getElementById('mobile-menu')?.classList.toggle('hidden');
                }}
              >
                <CheckSquare className="h-5 w-5" />
                <span>Checklists</span>
              </Button>
            )}
            
            {userPermissions.reports && (
              <Button
                variant="ghost"
                className={`flex items-center justify-start gap-2 rounded-md w-full ${isActive("/relatorios") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"}`}
                onClick={() => {
                  setLocation("/relatorios");
                  document.getElementById('mobile-menu')?.classList.toggle('hidden');
                }}
              >
                <FileText className="h-5 w-5" />
                <span>Relatórios</span>
              </Button>
            )}
            
            {userPermissions.settings && (
              <Button
                variant="ghost"
                className={`flex items-center justify-start gap-2 rounded-md w-full ${isActive("/configuracoes") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"}`}
                onClick={() => {
                  setLocation("/configuracoes");
                  document.getElementById('mobile-menu')?.classList.toggle('hidden');
                }}
              >
                <Settings className="h-5 w-5" />
                <span>Configurações</span>
              </Button>
            )}
            
            {userPermissions.userManagement && (
              <Button
                variant="ghost"
                className={`flex items-center justify-start gap-2 rounded-md w-full ${isActive("/usuarios") ? "bg-blue-700 text-white" : "text-white hover:bg-blue-700"}`}
                onClick={() => {
                  setLocation("/usuarios");
                  document.getElementById('mobile-menu')?.classList.toggle('hidden');
                }}
              >
                <Users className="h-5 w-5" />
                <span>Usuários</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}