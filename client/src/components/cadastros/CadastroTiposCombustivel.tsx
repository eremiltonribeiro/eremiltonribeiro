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
import { Loader2, Droplet, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FuelType as SharedFuelType } from "@shared/schema"; // Renomeado
import { offlineStorage } from "@/services/offlineStorage";

// Schema de validação com Zod
const fuelTypeFormSchema = z.object({
  name: z.string().min(1, "Nome do tipo de combustível é obrigatório."),
});

type FuelTypeFormValues = z.infer<typeof fuelTypeFormSchema>;

// Estender o tipo FuelType para incluir a propriedade opcional offlinePending (se aplicável no futuro)
interface FuelType extends SharedFuelType {
  offlinePending?: boolean;
}

export function CadastroTiposCombustivel() {
  const { toast } = useToast();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentType, setCurrentType] = useState<FuelType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<FuelTypeFormValues>({
    resolver: zodResolver(fuelTypeFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const { data: types = [], isLoading, refetch } = useQuery<FuelType[]>({ // Adicionado tipo
    queryKey: ["/api/fuel-types"],
    queryFn: async (): Promise<FuelType[]> => { // Adicionado tipo
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

  const resetFormRHF = () => { // Renomeado
    form.reset({
      name: "",
    });
    setFormMode("create");
    setCurrentType(null);
  };

  const handleEdit = (type: FuelType) => {
    setCurrentType(type);
    form.reset({ // Usar form.reset
      name: type.name,
    });
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este tipo de combustível?")) return;
    setDeletingId(id);
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
    } finally {
      setDeletingId(null);
    }
  };

  const onSubmitRHF = async (data: FuelTypeFormValues) => { // Renomeado e usando dados do RHF
    // A validação de nome em branco é tratada pelo Zod schema
    setIsSubmitting(true);
    try {
      let url = '/api/fuel-types';
      let method = 'POST';
      
      if (formMode === "edit" && currentType) {
        url = `/api/fuel-types/${currentType.id}`;
        method = 'PUT';
      }

      // Log para depuração
      console.log(`Enviando requisição para ${url} com método ${method}`);
      console.log("Dados:", JSON.stringify(data)); // Usar 'data' do RHF

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data), // Usar 'data' do RHF
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

      resetFormRHF();
      refetch();
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro ao salvar o tipo de combustível.",
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
            {formMode === "create" ? "Novo Tipo de Combustível" : "Editar Tipo de Combustível"}
          </CardTitle>
          <CardDescription>
            {formMode === "create"
              ? "Cadastre um novo tipo de combustível"
              : "Altere os dados do tipo de combustível selecionado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRHF)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Combustível*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Gasolina Comum" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  formMode === "create" ? "Cadastrar Tipo" : "Atualizar Tipo"
                )}
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
                            disabled={deletingId === type.id || isSubmitting}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(type.id)}
                            disabled={deletingId === type.id || isSubmitting}
                          >
                            {deletingId === type.id ? (
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