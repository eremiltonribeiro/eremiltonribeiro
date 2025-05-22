import { Link, useLocation } from "wouter";
import { Home, BarChart2, History, Settings, Car, Plus, FileText, Users, CheckSquare, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/App";

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

export function SideNavigation() {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  
  const { user, logout } = useAuth();
  
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
    if (route === "/registros" && location === "/registros") return true;
    if (route === "/registros/history" && location.includes("/registros/history")) return true;
    if (route === "/registros/dashboard" && location.includes("/registros/dashboard")) return true;
    if (route === "/relatorios" && location.includes("/relatorios")) return true;
    if (route === "/configuracoes" && location.includes("/configuracoes")) return true;
    if (route === "/usuarios" && location.includes("/usuarios")) return true;
    if (route === "/checklists" && location.includes("/checklists")) return true;
    if (route === "/cadastros" && location.includes("/cadastros")) return true;
    return false;
  };
  
  // Função para fazer logout e redirecionar para login
  const handleLogout = () => {
    logout();
    setLocation("/login");
  };
  
  // Carregar configurações do app
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("appConfig");
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        
        // Atualizar nome da empresa se disponível
        if (config.companyName) {
          document.querySelectorAll('.company-name').forEach(el => {
            (el as HTMLElement).innerText = config.companyName;
          });
        }
        
        // Aplicar logo personalizado se disponível
        if (config.logoUrl) {
          document.querySelectorAll('.company-logo').forEach(el => {
            (el as HTMLImageElement).src = config.logoUrl;
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  }, []);

  return (
    <>
      {/* Header for mobile */}
      <div className="lg:hidden bg-primary text-white shadow-md w-full side-navigation">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/src/assets/granduvale-logo.svg" alt="Granduvale" className="w-10 h-10 mr-3 company-logo" />
            <h1 className="text-lg font-bold company-name">Sistema de Gestão de Frota</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-primary-light"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">{isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}</span>
          </Button>
        </div>
        
        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="bg-primary-dark text-white">
            <div className="container mx-auto px-4 py-2">
              <nav className="flex flex-col space-y-2">
                <Button
                  variant="ghost"
                  className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                    isActive("/") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
                  }`}
                  onClick={() => {
                    setLocation("/");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Home className="h-5 w-5" />
                  <span className="text-sm font-medium">Início</span>
                </Button>
                
                {userPermissions.registrations && (
                  <Button
                    variant="ghost"
                    className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                      isActive("/registros") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
                    }`}
                    onClick={() => {
                      setLocation("/registros");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-sm font-medium">Registros</span>
                  </Button>
                )}
                
                {userPermissions.history && (
                  <Button
                    variant="ghost"
                    className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                      isActive("/registros/history") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
                    }`}
                    onClick={() => {
                      setLocation("/registros/history");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <History className="h-5 w-5" />
                    <span className="text-sm font-medium">Histórico</span>
                  </Button>
                )}
                
                {userPermissions.dashboard && (
                  <Button
                    variant="ghost"
                    className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                      isActive("/registros/dashboard") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
                    }`}
                    onClick={() => {
                      setLocation("/registros/dashboard");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <BarChart2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Dashboard</span>
                  </Button>
                )}
                
                {userPermissions.checklists && (
                  <Button
                    variant="ghost"
                    className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                      isActive("/checklists") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
                    }`}
                    onClick={() => {
                      setLocation("/checklists");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <CheckSquare className="h-5 w-5" />
                    <span className="text-sm font-medium">Checklists</span>
                  </Button>
                )}
                
                {userPermissions.reports && (
                  <Button
                    variant="ghost"
                    className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                      isActive("/relatorios") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
                    }`}
                    onClick={() => {
                      setLocation("/relatorios");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="text-sm font-medium">Relatórios</span>
                  </Button>
                )}
                
                {userPermissions.settings && (
                  <>
                    <Button
                      variant="ghost"
                      className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                        isActive("/configuracoes") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
                      }`}
                      onClick={() => {
                        setLocation("/configuracoes");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Settings className="h-5 w-5" />
                      <span className="text-sm font-medium">Configurações</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                        isActive("/cadastros") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
                      }`}
                      onClick={() => {
                        setLocation("/cadastros");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Car className="h-5 w-5" />
                      <span className="text-sm font-medium">Cadastros</span>
                    </Button>
                  </>
                )}
                
                {userPermissions.userManagement && (
                  <Button
                    variant="ghost"
                    className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                      isActive("/usuarios") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
                    }`}
                    onClick={() => {
                      setLocation("/usuarios");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Users className="h-5 w-5" />
                    <span className="text-sm font-medium">Usuários</span>
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  className="flex items-center justify-start gap-3 rounded-md w-full p-3 text-white hover:bg-primary-light"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">Sair</span>
                </Button>
              </nav>
            </div>
          </div>
        )}
      </div>
      
      {/* Sidebar for desktop */}
      <div className="hidden lg:flex h-screen fixed left-0 top-0 bg-primary text-white w-64 shadow-lg flex-col side-navigation">
        <div className="p-4 flex items-center border-b border-primary-dark">
          <img src="/src/assets/granduvale-logo.svg" alt="Granduvale" className="w-10 h-10 mr-3 company-logo" />
          <h1 className="text-xl font-bold company-name">Sistema de Gestão de Frota</h1>
        </div>
        
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          <Button
            variant="ghost"
            className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
              isActive("/") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
            }`}
            onClick={() => setLocation("/")}
          >
            <Home className="h-5 w-5" />
            <span className="text-sm font-medium">Início</span>
          </Button>
          
          {userPermissions.registrations && (
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                isActive("/registros") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
              }`}
              onClick={() => setLocation("/registros")}
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">Registros</span>
            </Button>
          )}
          
          {userPermissions.history && (
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                isActive("/registros/history") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
              }`}
              onClick={() => setLocation("/registros/history")}
            >
              <History className="h-5 w-5" />
              <span className="text-sm font-medium">Histórico</span>
            </Button>
          )}
          
          {userPermissions.dashboard && (
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                isActive("/registros/dashboard") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
              }`}
              onClick={() => setLocation("/registros/dashboard")}
            >
              <BarChart2 className="h-5 w-5" />
              <span className="text-sm font-medium">Dashboard</span>
            </Button>
          )}
          
          {userPermissions.checklists && (
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                isActive("/checklists") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
              }`}
              onClick={() => setLocation("/checklists")}
            >
              <CheckSquare className="h-5 w-5" />
              <span className="text-sm font-medium">Checklists</span>
            </Button>
          )}
          
          {userPermissions.reports && (
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                isActive("/relatorios") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
              }`}
              onClick={() => setLocation("/relatorios")}
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium">Relatórios</span>
            </Button>
          )}
          
          {userPermissions.settings && (
            <>
              <Button
                variant="ghost"
                className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                  isActive("/configuracoes") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
                }`}
                onClick={() => setLocation("/configuracoes")}
              >
                <Settings className="h-5 w-5" />
                <span className="text-sm font-medium">Configurações</span>
              </Button>
              
              <Button
                variant="ghost"
                className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                  isActive("/cadastros") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
                }`}
                onClick={() => setLocation("/cadastros")}
              >
                <Car className="h-5 w-5" />
                <span className="text-sm font-medium">Cadastros</span>
              </Button>
            </>
          )}
          
          {userPermissions.userManagement && (
            <Button
              variant="ghost"
              className={`flex items-center justify-start gap-3 rounded-md w-full p-3 ${
                isActive("/usuarios") ? "bg-primary-light text-white" : "text-white hover:bg-primary-light"
              }`}
              onClick={() => setLocation("/usuarios")}
            >
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Usuários</span>
            </Button>
          )}
        </nav>
        
        <div className="p-3 border-t border-primary-dark">
          <Button
            variant="ghost"
            className="flex items-center justify-start gap-3 rounded-md w-full p-3 text-white hover:bg-primary-light"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Sair</span>
          </Button>
        </div>
      </div>
    </>
  );
}
