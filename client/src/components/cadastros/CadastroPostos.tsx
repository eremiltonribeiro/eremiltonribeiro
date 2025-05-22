import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Fuel, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FuelStation } from "@shared/schema";
import { offlineStorage } from "@/services/offlineStorage";

export function CadastroPostos() {
  const { toast } = useToast();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentStation, setCurrentStation] = useState<FuelStation | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: ""
  });

  const { data: stations = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/fuel-stations"],
    queryFn: async () => {
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/fuel-stations");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveFuelStations(data);
            return data;
          }
        }
        return await offlineStorage.getFuelStations();
      } catch (error) {
        console.error("Erro ao buscar postos:", error);
        return await offlineStorage.getFuelStations();
      }
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: ""
    });
    setFormMode("create");
    setCurrentStation(null);
  };

  const handleEdit = (station: FuelStation) => {
    setCurrentStation(station);
    setFormData({
      name: station.name,
      address: station.address || ""
    });
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este posto?")) return;

    try {
      const res = await fetch(`/api/fuel-stations/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: "Sucesso!",
          description: "Posto excluído com sucesso.",
        });
        refetch();
      } else {
        throw new Error("Erro ao excluir posto");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao excluir o posto.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let url = '/api/fuel-stations';
      let method = 'POST';
      
      if (formMode === "edit" && currentStation) {
        url = `/api/fuel-stations/${currentStation.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar posto");
      }

      toast({
        title: "Sucesso!",
        description: formMode === "create" 
          ? "Posto cadastrado com sucesso." 
          : "Posto atualizado com sucesso.",
      });

      resetForm();
      refetch();
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao salvar o posto.",
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
            {formMode === "create" ? "Novo Posto" : "Editar Posto"}
          </CardTitle>
          <CardDescription>
            {formMode === "create" 
              ? "Cadastre um novo posto de combustível" 
              : "Altere os dados do posto selecionado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Posto*</Label>
                <Input 
                  id="name"
                  name="name"
                  placeholder="Ex: Posto Ipiranga"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input 
                  id="address"
                  name="address"
                  placeholder="Ex: Av. Principal, 1000"
                  value={formData.address}
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
                className="flex items-center gap-1"
              >
                {formMode === "create" ? "Cadastrar Posto" : "Atualizar Posto"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Postos Cadastrados</CardTitle>
          <CardDescription>
            {stations.length} posto(s) registrado(s) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stations.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Fuel className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum posto cadastrado.</p>
              <p className="text-sm mt-1">Use o formulário acima para adicionar um novo posto.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stations.map((station) => (
                    <TableRow key={station.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Fuel className="h-4 w-4 mr-2" />
                          {station.name}
                        </div>
                      </TableCell>
                      <TableCell>{station.address}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(station)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(station.id)}
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