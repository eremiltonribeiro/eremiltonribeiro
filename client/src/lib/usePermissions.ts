import { useState, useEffect } from 'react';

// Interface para os perfis de usuário
export interface UserRole {
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

// Hook personalizado para verificar permissões
export function usePermissions() {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
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
  
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userRole = userData.role;
    
    if (userRole) {
      // Buscar o perfil correspondente no localStorage
      const userRoles: UserRole[] = JSON.parse(localStorage.getItem("userRoles") || "[]");
      const currentRole = userRoles.find(role => 
        role.name.toLowerCase() === userRole.toLowerCase()
      );
      
      if (currentRole && currentRole.permissions) {
        setPermissions(currentRole.permissions);
      } else {
        // Permissões padrão para perfis conhecidos
        if (userRole === "admin") {
          setPermissions({
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
          setPermissions({
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
          setPermissions({
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
  
  // Verificar se o usuário tem permissão para uma funcionalidade específica
  const hasPermission = (permission: string): boolean => {
    return permissions[permission] || false;
  };
  
  return {
    permissions,
    hasPermission
  };
}