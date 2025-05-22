import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { 
  UserPlus, 
  Trash2, 
  Edit, 
  Shield, 
  KeyRound, 
  User,
  ScrollText,
  CheckSquare,
  GanttChart,
  FileText,
  Settings,
  Users,
  Car
} from "lucide-react";

// Tipos
interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

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

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("users");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [newRole, setNewRole] = useState<UserRole>({
    id: "",
    name: "",
    description: "",
    permissions: {
      dashboard: false,
      registrations: false,
      history: false,
      reports: false,
      checklists: false,
      settings: false,
      userManagement: false,
      vehicleManagement: false,
      driverManagement: false
    }
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Verificar se o usuário é administrador
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    if (userData.role !== "admin") {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive",
      });
      setLocation("/");
    } else {
      // Carregar lista de usuários e perfis
      loadUsers();
      loadRoles();
    }
  }, [setLocation, toast]);
  
  // Simulação de carregamento de usuários
  const loadUsers = () => {
    setIsLoading(true);
    
    // Carregar do localStorage se disponível
    const storedUsers = JSON.parse(localStorage.getItem("appUsers") || "{}");
    if (Object.keys(storedUsers).length > 0) {
      const usersList = Object.entries(storedUsers).map(([username, data]: [string, any]) => ({
        id: data.id,
        username: username,
        name: data.name,
        role: data.role
      }));
      setUsers(usersList);
    } else {
      // Lista de usuários simulada para first-run
      const mockUsers: User[] = [
        { id: "1", username: "admin", name: "Administrador", role: "admin" },
        { id: "2", username: "motorista1", name: "João Motorista", role: "driver" },
        { id: "3", username: "gerente1", name: "Carlos Gerente", role: "manager" },
      ];
      
      // Salvar no localStorage
      const usersObj: {[key: string]: any} = {};
      mockUsers.forEach(user => {
        usersObj[user.username] = {
          id: user.id,
          name: user.name,
          role: user.role,
          password: user.username === "admin" ? "admin123" : "senha123"
        };
      });
      localStorage.setItem("appUsers", JSON.stringify(usersObj));
      
      setUsers(mockUsers);
    }
    
    setIsLoading(false);
  };
  
  // Carregar perfis de usuário
  const loadRoles = () => {
    // Carregar do localStorage se disponível
    const storedRoles = JSON.parse(localStorage.getItem("userRoles") || "[]");
    if (storedRoles.length > 0) {
      setUserRoles(storedRoles);
    } else {
      // Perfis padrão
      const defaultRoles: UserRole[] = [
        {
          id: "1",
          name: "Administrador",
          description: "Acesso completo ao sistema",
          permissions: {
            dashboard: true,
            registrations: true,
            history: true,
            reports: true,
            checklists: true,
            settings: true,
            userManagement: true,
            vehicleManagement: true,
            driverManagement: true
          }
        },
        {
          id: "2",
          name: "Gerente",
          description: "Acesso à maioria das funcionalidades, exceto gerenciamento de usuários",
          permissions: {
            dashboard: true,
            registrations: true,
            history: true,
            reports: true,
            checklists: true,
            settings: true,
            userManagement: false,
            vehicleManagement: true,
            driverManagement: true
          }
        },
        {
          id: "3",
          name: "Motorista",
          description: "Acesso limitado para registro de atividades",
          permissions: {
            dashboard: false,
            registrations: true,
            history: true,
            reports: false,
            checklists: true,
            settings: false,
            userManagement: false,
            vehicleManagement: false,
            driverManagement: false
          }
        }
      ];
      
      localStorage.setItem("userRoles", JSON.stringify(defaultRoles));
      setUserRoles(defaultRoles);
    }
  };
  
  // Validar formulário de usuário
  const validateUserForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!username.trim()) errors.username = "Nome de usuário é obrigatório";
    if (!name.trim()) errors.name = "Nome completo é obrigatório";
    
    if (currentUser === null) {
      if (!password) errors.password = "Senha é obrigatória";
      if (password.length < 6) errors.password = "A senha deve ter pelo menos 6 caracteres";
      if (password !== confirmPassword) errors.confirmPassword = "As senhas não coincidem";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Validar formulário de alteração de senha
  const validatePasswordForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!currentPassword) errors.currentPassword = "Senha atual é obrigatória";
    if (!newPassword) errors.newPassword = "Nova senha é obrigatória";
    if (newPassword.length < 6) errors.newPassword = "A nova senha deve ter pelo menos 6 caracteres";
    if (newPassword !== confirmNewPassword) errors.confirmNewPassword = "As senhas não coincidem";
    
    // Verificar senha atual
    if (currentUser) {
      const storedUsers = JSON.parse(localStorage.getItem("appUsers") || "{}");
      const userData = storedUsers[currentUser.username];
      if (userData && userData.password !== currentPassword) {
        errors.currentPassword = "Senha atual incorreta";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Validar formulário de perfil
  const validateRoleForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!newRole.name.trim()) errors.name = "Nome do perfil é obrigatório";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Abrir diálogo para novo usuário
  const handleAddUser = () => {
    setCurrentUser(null);
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setRole("user");
    setFormErrors({});
    setDialogOpen(true);
  };
  
  // Abrir diálogo para editar usuário
  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setUsername(user.username);
    setName(user.name);
    setRole(user.role);
    setFormErrors({});
    setDialogOpen(true);
  };
  
  // Abrir diálogo para alteração de senha
  const handleChangePassword = (user: User) => {
    setCurrentUser(user);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setFormErrors({});
    setPasswordDialogOpen(true);
  };
  
  // Abrir diálogo para adicionar novo perfil
  const handleAddRole = () => {
    setCurrentRole(null);
    setNewRole({
      id: "",
      name: "",
      description: "",
      permissions: {
        dashboard: false,
        registrations: false,
        history: false,
        reports: false,
        checklists: false,
        settings: false,
        userManagement: false,
        vehicleManagement: false,
        driverManagement: false
      }
    });
    setFormErrors({});
    setRoleDialogOpen(true);
  };
  
  // Abrir diálogo para editar perfil
  const handleEditRole = (role: UserRole) => {
    setCurrentRole(role);
    setNewRole({...role});
    setFormErrors({});
    setEditRoleDialogOpen(true);
  };
  
  // Salvar usuário (novo ou edição)
  const handleSaveUser = () => {
    if (!validateUserForm()) return;
    
    const storedUsers = JSON.parse(localStorage.getItem("appUsers") || "{}");
    
    if (currentUser === null) {
      // Novo usuário
      // Verificar se o nome de usuário já existe
      if (storedUsers[username]) {
        setFormErrors({username: "Este nome de usuário já está em uso"});
        return;
      }
      
      const newUser: User = {
        id: Date.now().toString(),
        username,
        name,
        role,
      };
      
      // Armazenar as credenciais do usuário
      storedUsers[username] = {
        id: newUser.id,
        password: password,
        name: name,
        role: role
      };
      localStorage.setItem("appUsers", JSON.stringify(storedUsers));
      setUsers([...users, newUser]);
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso",
      });
    } else {
      // Edição de usuário existente
      // Se o nome de usuário foi alterado, verificar se o novo já existe
      if (username !== currentUser.username && storedUsers[username]) {
        setFormErrors({username: "Este nome de usuário já está em uso"});
        return;
      }
      
      // Atualizar no localStorage
      if (username !== currentUser.username) {
        // Se mudou o username, precisamos mover os dados para o novo username
        const userData = storedUsers[currentUser.username];
        delete storedUsers[currentUser.username];
        storedUsers[username] = {
          ...userData,
          name: name,
          role: role
        };
      } else {
        // Apenas atualizar os dados existentes
        storedUsers[username] = {
          ...storedUsers[username],
          name: name,
          role: role
        };
      }
      localStorage.setItem("appUsers", JSON.stringify(storedUsers));
      
      // Atualizar na lista de usuários
      const updatedUsers = users.map(u => 
        u.id === currentUser.id ? { ...u, username, name, role } : u
      );
      setUsers(updatedUsers);
      
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });
    }
    
    setDialogOpen(false);
  };
  
  // Salvar alteração de senha
  const handleSavePassword = () => {
    if (!validatePasswordForm() || !currentUser) return;
    
    const storedUsers = JSON.parse(localStorage.getItem("appUsers") || "{}");
    
    // Atualizar senha
    storedUsers[currentUser.username] = {
      ...storedUsers[currentUser.username],
      password: newPassword
    };
    localStorage.setItem("appUsers", JSON.stringify(storedUsers));
    
    toast({
      title: "Sucesso",
      description: "Senha alterada com sucesso",
    });
    
    setPasswordDialogOpen(false);
  };
  
  // Salvar novo perfil
  const handleSaveRole = () => {
    if (!validateRoleForm()) return;
    
    // Novo perfil
    const roleToSave: UserRole = {
      ...newRole,
      id: Date.now().toString()
    };
    
    const updatedRoles = [...userRoles, roleToSave];
    setUserRoles(updatedRoles);
    localStorage.setItem("userRoles", JSON.stringify(updatedRoles));
    
    toast({
      title: "Sucesso",
      description: "Perfil criado com sucesso",
    });
    
    setRoleDialogOpen(false);
  };
  
  // Salvar edição de perfil
  const handleUpdateRole = () => {
    if (!validateRoleForm() || !currentRole) return;
    
    const updatedRoles = userRoles.map(r => 
      r.id === currentRole.id ? newRole : r
    );
    
    setUserRoles(updatedRoles);
    localStorage.setItem("userRoles", JSON.stringify(updatedRoles));
    
    toast({
      title: "Sucesso",
      description: "Perfil atualizado com sucesso",
    });
    
    setEditRoleDialogOpen(false);
  };
  
  // Deletar usuário
  const handleDeleteUser = (userId: string) => {
    if (userId === "1") {
      toast({
        title: "Operação não permitida",
        description: "O usuário administrador principal não pode ser removido",
        variant: "destructive",
      });
      return;
    }
    
    // Confirmação de exclusão
    if (!window.confirm("Tem certeza que deseja excluir este usuário?")) {
      return;
    }
    
    // Encontrar o username pelo id
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    
    // Remover do localStorage
    const storedUsers = JSON.parse(localStorage.getItem("appUsers") || "{}");
    delete storedUsers[userToDelete.username];
    localStorage.setItem("appUsers", JSON.stringify(storedUsers));
    
    // Remover da lista de usuários
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    
    toast({
      title: "Sucesso",
      description: "Usuário removido com sucesso",
    });
  };
  
  // Deletar perfil
  const handleDeleteRole = (roleId: string) => {
    // Verificar se há usuários usando este perfil
    const roleName = userRoles.find(r => r.id === roleId)?.name.toLowerCase();
    const usersWithRole = users.some(u => u.role.toLowerCase() === roleName);
    
    if (usersWithRole) {
      toast({
        title: "Operação não permitida",
        description: "Existem usuários associados a este perfil",
        variant: "destructive",
      });
      return;
    }
    
    // Confirmação de exclusão
    if (!window.confirm("Tem certeza que deseja excluir este perfil?")) {
      return;
    }
    
    // Remover da lista de perfis e do localStorage
    const updatedRoles = userRoles.filter(r => r.id !== roleId);
    setUserRoles(updatedRoles);
    localStorage.setItem("userRoles", JSON.stringify(updatedRoles));
    
    toast({
      title: "Sucesso",
      description: "Perfil removido com sucesso",
    });
  };
  
  // Obter nome do perfil
  const getRoleName = (roleKey: string) => {
    const foundRole = userRoles.find(r => r.name.toLowerCase() === roleKey.toLowerCase());
    return foundRole ? foundRole.name : roleKey;
  };
  
  // Listar permissões de um perfil
  const getPermissionsList = (permissions: UserRole['permissions']) => {
    const permissionLabels: {[key: string]: string} = {
      dashboard: "Dashboard",
      registrations: "Registros",
      history: "Histórico",
      reports: "Relatórios",
      checklists: "Checklists",
      settings: "Configurações",
      userManagement: "Gerenciamento de Usuários",
      vehicleManagement: "Gerenciamento de Veículos",
      driverManagement: "Gerenciamento de Motoristas"
    };
    
    return Object.entries(permissions)
      .filter(([_, value]) => value)
      .map(([key]) => permissionLabels[key])
      .join(", ");
  };
  
  // Verificar se é o próprio usuário
  const isSelfUser = (userId: string) => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    return userData.id === userId;
  };
  
  // Permissão de alteração baseada no perfil
  const canEditUser = (userId: string) => {
    // O usuário admin principal não pode ser editado exceto por si mesmo
    if (userId === "1") {
      return isSelfUser(userId);
    }
    return true;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-blue-900">Gerenciamento de Usuários</h2>
        <div className="flex gap-2">
          <Button onClick={handleAddUser} className="bg-blue-800 hover:bg-blue-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
          <Button onClick={handleAddRole} className="bg-blue-800 hover:bg-blue-700">
            <Shield className="h-4 w-4 mr-2" />
            Novo Perfil
          </Button>
        </div>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Perfis de Acesso</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Aba de Usuários */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Carregando usuários...</div>
              ) : (
                <div className="overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Nome de Usuário</TableHead>
                        <TableHead>Nome Completo</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{getRoleName(user.role)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleChangePassword(user)}
                                className="h-8 w-8 text-amber-600"
                                disabled={!canEditUser(user.id)}
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleEditUser(user)}
                                className="h-8 w-8 text-blue-700"
                                disabled={!canEditUser(user.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleDeleteUser(user.id)}
                                className="h-8 w-8 text-red-700"
                                disabled={user.id === "1"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba de Perfis */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Perfis de Acesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Permissões</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles.map(role => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {getPermissionsList(role.permissions) || "Nenhuma permissão"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleEditRole(role)}
                              className="h-8 w-8 text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleDeleteRole(role.id)}
                              className="h-8 w-8 text-red-700"
                              disabled={role.id === "1"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Modal de criação/edição de usuário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentUser ? "Editar Usuário" : "Criar Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              {currentUser 
                ? "Atualize as informações do usuário abaixo." 
                : "Preencha os campos para criar um novo usuário."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input 
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite o nome de usuário"
              />
              {formErrors.username && (
                <p className="text-sm text-red-500 mt-1">{formErrors.username}</p>
              )}
            </div>
            
            {currentUser === null && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha"
                  />
                  {formErrors.password && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.password}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input 
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a senha"
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input 
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome completo"
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Perfil</Label>
              <Select
                value={role}
                onValueChange={setRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  {userRoles.map(r => (
                    <SelectItem key={r.id} value={r.name.toLowerCase()}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveUser}
              className="bg-blue-800 hover:bg-blue-700"
            >
              {currentUser ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de alteração de senha */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              {isSelfUser(currentUser?.id || "") 
                ? "Atualize sua senha." 
                : `Alterar senha do usuário ${currentUser?.name}.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {isSelfUser(currentUser?.id || "") && (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input 
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                />
                {formErrors.currentPassword && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.currentPassword}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input 
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
              {formErrors.newPassword && (
                <p className="text-sm text-red-500 mt-1">{formErrors.newPassword}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
              <Input 
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirme a nova senha"
              />
              {formErrors.confirmNewPassword && (
                <p className="text-sm text-red-500 mt-1">{formErrors.confirmNewPassword}</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPasswordDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSavePassword}
              className="bg-blue-800 hover:bg-blue-700"
            >
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de criação de perfil */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Perfil</DialogTitle>
            <DialogDescription>
              Configure as informações e permissões do novo perfil.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Nome do Perfil</Label>
                <Input 
                  id="roleName"
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                  placeholder="Nome do perfil"
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roleDescription">Descrição</Label>
                <Input 
                  id="roleDescription"
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  placeholder="Descrição do perfil"
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Permissões</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-500">Páginas e Funcionalidades</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GanttChart className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="perm-dashboard">Dashboard</Label>
                    </div>
                    <Switch 
                      id="perm-dashboard"
                      checked={newRole.permissions.dashboard}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, dashboard: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="perm-registrations">Registros</Label>
                    </div>
                    <Switch 
                      id="perm-registrations"
                      checked={newRole.permissions.registrations}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, registrations: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ScrollText className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="perm-history">Histórico</Label>
                    </div>
                    <Switch 
                      id="perm-history"
                      checked={newRole.permissions.history}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, history: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="perm-reports">Relatórios</Label>
                    </div>
                    <Switch 
                      id="perm-reports"
                      checked={newRole.permissions.reports}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, reports: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="perm-checklists">Checklists</Label>
                    </div>
                    <Switch 
                      id="perm-checklists"
                      checked={newRole.permissions.checklists}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, checklists: checked}
                        })
                      }
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-500">Administração</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="perm-settings">Configurações</Label>
                    </div>
                    <Switch 
                      id="perm-settings"
                      checked={newRole.permissions.settings}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, settings: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="perm-user-management">Gerenciamento de Usuários</Label>
                    </div>
                    <Switch 
                      id="perm-user-management"
                      checked={newRole.permissions.userManagement}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, userManagement: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="perm-vehicle-management">Gerenciamento de Veículos</Label>
                    </div>
                    <Switch 
                      id="perm-vehicle-management"
                      checked={newRole.permissions.vehicleManagement}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, vehicleManagement: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="perm-driver-management">Gerenciamento de Motoristas</Label>
                    </div>
                    <Switch 
                      id="perm-driver-management"
                      checked={newRole.permissions.driverManagement}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, driverManagement: checked}
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRoleDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveRole}
              className="bg-blue-800 hover:bg-blue-700"
            >
              Criar Perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de edição de perfil */}
      <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Atualize as informações e permissões do perfil.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-roleName">Nome do Perfil</Label>
                <Input 
                  id="edit-roleName"
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                  placeholder="Nome do perfil"
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-roleDescription">Descrição</Label>
                <Input 
                  id="edit-roleDescription"
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  placeholder="Descrição do perfil"
                />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Permissões</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-500">Páginas e Funcionalidades</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GanttChart className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="edit-perm-dashboard">Dashboard</Label>
                    </div>
                    <Switch 
                      id="edit-perm-dashboard"
                      checked={newRole.permissions.dashboard}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, dashboard: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="edit-perm-registrations">Registros</Label>
                    </div>
                    <Switch 
                      id="edit-perm-registrations"
                      checked={newRole.permissions.registrations}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, registrations: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ScrollText className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="edit-perm-history">Histórico</Label>
                    </div>
                    <Switch 
                      id="edit-perm-history"
                      checked={newRole.permissions.history}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, history: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="edit-perm-reports">Relatórios</Label>
                    </div>
                    <Switch 
                      id="edit-perm-reports"
                      checked={newRole.permissions.reports}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, reports: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="edit-perm-checklists">Checklists</Label>
                    </div>
                    <Switch 
                      id="edit-perm-checklists"
                      checked={newRole.permissions.checklists}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, checklists: checked}
                        })
                      }
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-500">Administração</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="edit-perm-settings">Configurações</Label>
                    </div>
                    <Switch 
                      id="edit-perm-settings"
                      checked={newRole.permissions.settings}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, settings: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="edit-perm-user-management">Gerenciamento de Usuários</Label>
                    </div>
                    <Switch 
                      id="edit-perm-user-management"
                      checked={newRole.permissions.userManagement}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, userManagement: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="edit-perm-vehicle-management">Gerenciamento de Veículos</Label>
                    </div>
                    <Switch 
                      id="edit-perm-vehicle-management"
                      checked={newRole.permissions.vehicleManagement}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, vehicleManagement: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="edit-perm-driver-management">Gerenciamento de Motoristas</Label>
                    </div>
                    <Switch 
                      id="edit-perm-driver-management"
                      checked={newRole.permissions.driverManagement}
                      onCheckedChange={(checked) => 
                        setNewRole({
                          ...newRole, 
                          permissions: {...newRole.permissions, driverManagement: checked}
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditRoleDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateRole}
              className="bg-blue-800 hover:bg-blue-700"
            >
              Atualizar Perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}