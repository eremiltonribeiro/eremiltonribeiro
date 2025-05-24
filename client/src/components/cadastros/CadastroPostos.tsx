import { useState, useEffect } from "react"; // Adicionado useEffect, embora não usado diretamente
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Label é substituído por FormLabel
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Fuel, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FuelStation as SharedFuelStation } from "@shared/schema"; // Renomeado
import { offlineStorage } from "@/services/offlineStorage";

// Schema de validação com Zod
const fuelStationFormSchema = z.object({
  name: z.string().min(1, "Nome do posto é obrigatório."),
  address: z.string().optional().or(z.literal('')),
});

type FuelStationFormValues = z.infer<typeof fuelStationFormSchema>;

// Estender o tipo FuelStation para incluir a propriedade opcional offlinePending (se aplicável no futuro)
interface FuelStation extends SharedFuelStation {
  offlinePending?: boolean;
}

export function CadastroPostos() {
  const { toast } = useToast();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentStation, setCurrentStation] = useState<FuelStation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<FuelStationFormValues>({
    resolver: zodResolver(fuelStationFormSchema),
    defaultValues: {
      name: "",
      address: "",
    },
  });

  const { data: stations = [], isLoading, refetch } = useQuery<FuelStation[]>({ // Adicionado tipo
    queryKey: ["/api/fuel-stations"],
    queryFn: async (): Promise<FuelStation[]> => { // Adicionado tipo
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

  const resetFormRHF = () => { // Renomeado
    form.reset({
      name: "",
      address: "",
    });
    setFormMode("create");
    setCurrentStation(null);
  };

  const handleEdit = (station: FuelStation) => {
    setCurrentStation(station);
    form.reset({ // Usar form.reset
      name: station.name,
      address: station.address || "",
    });
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este posto?")) return;
    setDeletingId(id);
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
    } finally {
      setDeletingId(null);
    }
  };

  const onSubmitRHF = async (data: FuelStationFormValues) => { // Renomeado e usando dados do RHF
    setIsSubmitting(true);
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
        body: JSON.stringify(data), // Usar 'data' do RHF
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

      resetFormRHF();
      refetch();
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao salvar o posto.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRHF)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Posto*</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Posto Ipiranga" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Av. Principal, 1000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                {formMode === "edit" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetFormRHF} // Atualizado
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                )}

                <Button
                type="submit"
                className="flex items-center gap-1"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  formMode === "create" ? "Cadastrar Posto" : "Atualizar Posto"
                )}
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
                            disabled={deletingId === station.id || isSubmitting}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(station.id)}
                            disabled={deletingId === station.id || isSubmitting}
                          >
                            {deletingId === station.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash className="h-4 w-4" />
                            )}
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