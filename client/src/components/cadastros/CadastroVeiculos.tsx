/**
 * Componente para gerenciamento de veículos
 * 
 * Este componente permite cadastrar, editar, visualizar e excluir veículos,
 * com suporte a operações offline através do armazenamento local.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Car, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Vehicle } from "@shared/schema";
import { offlineStorage } from "@/services/offlineStorage";

export function CadastroVeiculos() {
  const { toast } = useToast();
  // Estado para controlar se estamos criando ou editando um veículo
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  // Estado para armazenar o veículo atual sendo editado
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  // Estado para os dados do formulário
  const [formData, setFormData] = useState({
    name: "",
    plate: "",
    model: "",
    year: "",
    imageUrl: ""
  });

  /**
   * Consulta para buscar veículos com suporte a operações offline
   * Tenta buscar do servidor primeiro, se estiver online
   * Caso contrário, ou em caso de erro, busca do armazenamento local
   */
  const { data: vehicles = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: async () => {
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/vehicles");
          if (res.ok) {
            const data = await res.json();
            // Salva os dados no armazenamento local para acesso offline
            await offlineStorage.saveVehicles(data);
            return data;
          }
        }
        // Fallback para dados offline
        return await offlineStorage.getVehicles();
      } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        // Em caso de erro, usa dados do armazenamento local
        return await offlineStorage.getVehicles();
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
      plate: "",
      model: "",
      year: "",
      imageUrl: ""
    });
    setFormMode("create");
    setCurrentVehicle(null);
  };

  /**
   * Prepara o formulário para edição de um veículo existente
   */
  const handleEdit = (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      plate: vehicle.plate,
      model: vehicle.model || "",
      year: vehicle.year ? String(vehicle.year) : "",
      imageUrl: vehicle.imageUrl || ""
    });
    setFormMode("edit");
    // Rola a página para o topo para mostrar o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Exclui um veículo após confirmação do usuário
   */
  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este veículo?")) return;

    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: "Sucesso!",
          description: "Veículo excluído com sucesso.",
          variant: "success"
        });
        // Atualiza a lista após exclusão
        refetch();
      } else {
        throw new Error("Erro ao excluir veículo");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao excluir o veículo.",
        variant: "destructive",
      });
    }
  };

  /**
   * Processa o envio do formulário para criar ou atualizar um veículo
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Prepara os dados, convertendo o ano para número quando presente
      const vehicleData = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : undefined
      };

      // Define URL e método com base no modo do formulário
      let url = '/api/vehicles';
      let method = 'POST';
      
      if (formMode === "edit" && currentVehicle) {
        url = `/api/vehicles/${currentVehicle.id}`;
        method = 'PUT';
      }

      // Envia a requisição
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar veículo");
      }

      // Notifica o usuário sobre o sucesso
      toast({
        title: "Sucesso!",
        description: formMode === "create" 
          ? "Veículo cadastrado com sucesso." 
          : "Veículo atualizado com sucesso.",
        variant: "success"
      });

      // Limpa o formulário e atualiza a lista
      resetForm();
      refetch();
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao salvar o veículo.",
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
            {formMode === "create" ? "Novo Veículo" : "Editar Veículo"}
          </CardTitle>
          <CardDescription>
            {formMode === "create" 
              ? "Cadastre um novo veículo no sistema" 
              : "Altere os dados do veículo selecionado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Veículo*</Label>
                <Input 
                  id="name"
                  name="name"
                  placeholder="Ex: Ford Ranger"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  aria-required="true"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plate">Placa*</Label>
                <Input 
                  id="plate"
                  name="plate"
                  placeholder="Ex: ABC-1234"
                  value={formData.plate}
                  onChange={handleInputChange}
                  required
                  aria-required="true"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input 
                  id="model"
                  name="model"
                  placeholder="Ex: XLT 4x4"
                  value={formData.model}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year">Ano</Label>
                <Input 
                  id="year"
                  name="year"
                  type="number"
                  placeholder="Ex: 2023"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <Input 
                  id="imageUrl"
                  name="imageUrl"
                  placeholder="URL da imagem do veículo"
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
                {formMode === "create" ? "Cadastrar Veículo" : "Atualizar Veículo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Lista de veículos cadastrados */}
      <Card>
        <CardHeader>
          <CardTitle>Veículos Cadastrados</CardTitle>
          <CardDescription>
            {vehicles.length} veículo(s) registrado(s) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            // Mensagem quando não há veículos cadastrados
            <div className="text-center py-6 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum veículo cadastrado.</p>
              <p className="text-sm mt-1">Use o formulário acima para adicionar um novo veículo.</p>
            </div>
          ) : (
            // Tabela de veículos cadastrados
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Car className="h-4 w-4 mr-2" />
                          {vehicle.name}
                        </div>
                      </TableCell>
                      <TableCell>{vehicle.plate}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(vehicle)}
                            aria-label={`Editar ${vehicle.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:text-error/90"
                            onClick={() => handleDelete(vehicle.id)}
                            aria-label={`Excluir ${vehicle.name}`}
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
