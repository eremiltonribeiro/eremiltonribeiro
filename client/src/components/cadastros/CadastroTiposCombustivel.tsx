import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Droplet, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FuelType } from "@shared/schema";
import { offlineStorage } from "@/services/offlineStorage";

export function CadastroTiposCombustivel() {
  const { toast } = useToast();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentType, setCurrentType] = useState<FuelType | null>(null);
  const [formData, setFormData] = useState({
    name: ""
  });

  const { data: types = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/fuel-types"],
    queryFn: async () => {
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/fuel-types");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveFuelTypes(data);
            return data;
          }
        }
        return await offlineStorage.getFuelTypes();
      } catch (error) {
        console.error("Erro ao buscar tipos de combustível:", error);
        return await offlineStorage.getFuelTypes();
      }
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: ""
    });
    setFormMode("create");
    setCurrentType(null);
  };

  const handleEdit = (type: FuelType) => {
    setCurrentType(type);
    setFormData({
      name: type.name
    });
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este tipo de combustível?")) return;

    try {
      const res = await fetch(`/api/fuel-types/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: "Sucesso!",
          description: "Tipo de combustível excluído com sucesso.",
        });
        refetch();
      } else {
        throw new Error("Erro ao excluir tipo de combustível");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao excluir o tipo de combustível.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro!",
        description: "O nome do combustível é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      let url = '/api/fuel-types';
      let method = 'POST';
      
      if (formMode === "edit" && currentType) {
        url = `/api/fuel-types/${currentType.id}`;
        method = 'PUT';
      }

      // Log para depuração
      console.log(`Enviando requisição para ${url} com método ${method}`);
      console.log("Dados:", JSON.stringify(formData));

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Resposta de erro:", errorData);
        throw new Error(errorData.message || "Erro ao salvar tipo de combustível");
      }

      toast({
        title: "Sucesso!",
        description: formMode === "create" 
          ? "Tipo de combustível cadastrado com sucesso." 
          : "Tipo de combustível atualizado com sucesso.",
      });

      resetForm();
      refetch();
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro ao salvar o tipo de combustível.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {formMode === "create" ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
            {formMode === "create" ? "Novo Tipo de Combustível" : "Editar Tipo de Combustível"}
          </CardTitle>
          <CardDescription>
            {formMode === "create" 
              ? "Cadastre um novo tipo de combustível" 
              : "Altere os dados do tipo de combustível selecionado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Combustível*</Label>
              <Input 
                id="name"
                name="name"
                placeholder="Ex: Gasolina Comum"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
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
                className="flex items-center gap-1"
              >
                {formMode === "create" ? "Cadastrar Tipo" : "Atualizar Tipo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Combustível Cadastrados</CardTitle>
          <CardDescription>
            {types.length} tipo(s) de combustível registrado(s) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {types.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Droplet className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum tipo de combustível cadastrado.</p>
              <p className="text-sm mt-1">Use o formulário acima para adicionar um novo tipo de combustível.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Droplet className="h-4 w-4 mr-2" />
                          {type.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(type)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(type.id)}
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