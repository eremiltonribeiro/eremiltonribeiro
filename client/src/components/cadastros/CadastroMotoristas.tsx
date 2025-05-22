/**
 * Componente para gerenciamento de motoristas
 * 
 * Este componente permite cadastrar, editar, visualizar e excluir motoristas,
 * com suporte a operações offline através do armazenamento local.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserCircle, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Driver } from "@shared/schema";
import { offlineStorage } from "@/services/offlineStorage";

export function CadastroMotoristas() {
  const { toast } = useToast();
  // Estado para controlar se estamos criando ou editando um motorista
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  // Estado para armazenar o motorista atual sendo editado
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  // Estado para os dados do formulário
  const [formData, setFormData] = useState({
    name: "",
    license: "",
    phone: "",
    imageUrl: ""
  });

  /**
   * Consulta para buscar motoristas com suporte a operações offline
   * Tenta buscar do servidor primeiro, se estiver online
   * Caso contrário, ou em caso de erro, busca do armazenamento local
   */
  const { data: drivers = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/drivers");
          if (res.ok) {
            const data = await res.json();
            // Salva os dados no armazenamento local para acesso offline
            await offlineStorage.saveDrivers(data);
            return data;
          }
        }
        // Fallback para dados offline
        return await offlineStorage.getDrivers();
      } catch (error) {
        console.error("Erro ao buscar motoristas:", error);
        // Em caso de erro, usa dados do armazenamento local
        return await offlineStorage.getDrivers();
      }
    }
  });

  /**
   * Manipula mudanças nos campos do formulário
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Reseta o formulário para o estado inicial
   */
  const resetForm = () => {
    setFormData({
      name: "",
      license: "",
      phone: "",
      imageUrl: ""
    });
    setFormMode("create");
    setCurrentDriver(null);
  };

  /**
   * Prepara o formulário para edição de um motorista existente
   */
  const handleEdit = (driver: Driver) => {
    setCurrentDriver(driver);
    setFormData({
      name: driver.name,
      license: driver.license || "",
      phone: driver.phone || "",
      imageUrl: driver.imageUrl || ""
    });
    setFormMode("edit");
    // Rola a página para o topo para mostrar o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Exclui um motorista após confirmação do usuário
   */
  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este motorista?")) return;

    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: "Sucesso!",
          description: "Motorista excluído com sucesso.",
          variant: "success"
        });
        // Atualiza a lista após exclusão
        refetch();
      } else {
        throw new Error("Erro ao excluir motorista");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao excluir o motorista.",
        variant: "destructive",
      });
    }
  };

  /**
   * Processa o envio do formulário para criar ou atualizar um motorista
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Define URL e método com base no modo do formulário
      let url = '/api/drivers';
      let method = 'POST';
      
      if (formMode === "edit" && currentDriver) {
        url = `/api/drivers/${currentDriver.id}`;
        method = 'PUT';
      }

      // Envia a requisição
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar motorista");
      }

      // Notifica o usuário sobre o sucesso
      toast({
        title: "Sucesso!",
        description: formMode === "create" 
          ? "Motorista cadastrado com sucesso." 
          : "Motorista atualizado com sucesso.",
        variant: "success"
      });

      // Limpa o formulário e atualiza a lista
      resetForm();
      refetch();
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao salvar o motorista.",
        variant: "destructive",
      });
    }
  };

  // Exibe um indicador de carregamento enquanto os dados estão sendo buscados
  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Formulário de cadastro/edição */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {formMode === "create" ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
            {formMode === "create" ? "Novo Motorista" : "Editar Motorista"}
          </CardTitle>
          <CardDescription>
            {formMode === "create" 
              ? "Cadastre um novo motorista no sistema" 
              : "Altere os dados do motorista selecionado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Motorista*</Label>
                <Input 
                  id="name"
                  name="name"
                  placeholder="Ex: João Silva"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  aria-required="true"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="license">CNH</Label>
                <Input 
                  id="license"
                  name="license"
                  placeholder="Ex: 12345678901"
                  value={formData.license}
                  onChange={handleInputChange}
                  maxLength={11}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone"
                  name="phone"
                  placeholder="Ex: (11) 99999-9999"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <Input 
                  id="imageUrl"
                  name="imageUrl"
                  placeholder="URL da foto do motorista"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              {formMode === "edit" && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
              )}
              
              <Button 
                type="submit"
                variant={formMode === "create" ? "default" : "success"}
                className="flex items-center gap-1"
              >
                {formMode === "create" ? "Cadastrar Motorista" : "Atualizar Motorista"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Lista de motoristas cadastrados */}
      <Card>
        <CardHeader>
          <CardTitle>Motoristas Cadastrados</CardTitle>
          <CardDescription>
            {drivers.length} motorista(s) registrado(s) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {drivers.length === 0 ? (
            // Mensagem quando não há motoristas cadastrados
            <div className="text-center py-6 text-muted-foreground">
              <UserCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum motorista cadastrado.</p>
              <p className="text-sm mt-1">Use o formulário acima para adicionar um novo motorista.</p>
            </div>
          ) : (
            // Tabela de motoristas cadastrados
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNH</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <UserCircle className="h-4 w-4 mr-2" />
                          {driver.name}
                        </div>
                      </TableCell>
                      <TableCell>{driver.license}</TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(driver)}
                            aria-label={`Editar ${driver.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:text-error/90"
                            onClick={() => handleDelete(driver.id)}
                            aria-label={`Excluir ${driver.name}`}
                          >
                            <Trash className="h-4 w-4" />
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
    </div>
  );
}
