
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
import { Loader2, Wrench, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceType as SharedMaintenanceType } from "@shared/schema"; // Renomeado
import { offlineStorage } from "@/services/offlineStorage";

// Schema de validação com Zod
const maintenanceTypeFormSchema = z.object({
  name: z.string().min(1, "Nome do tipo de manutenção é obrigatório."),
});

type MaintenanceTypeFormValues = z.infer<typeof maintenanceTypeFormSchema>;

// Estender o tipo MaintenanceType para incluir a propriedade opcional offlinePending (se aplicável no futuro)
interface MaintenanceType extends SharedMaintenanceType {
  offlinePending?: boolean;
}

export function CadastroTiposManutencao() {
  const { toast } = useToast();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentType, setCurrentType] = useState<MaintenanceType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<MaintenanceTypeFormValues>({
    resolver: zodResolver(maintenanceTypeFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const { data: types = [], isLoading, refetch } = useQuery<MaintenanceType[]>({ // Adicionado tipo
    queryKey: ["/api/maintenance-types"],
    queryFn: async (): Promise<MaintenanceType[]> => { // Adicionado tipo
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/maintenance-types");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveMaintenanceTypes(data);
            return data;
          }
        }
        return await offlineStorage.getMaintenanceTypes();
      } catch (error) {
        console.error("Erro ao buscar tipos de manutenção:", error);
        return await offlineStorage.getMaintenanceTypes();
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

  const handleEdit = (type: MaintenanceType) => {
    setCurrentType(type);
    form.reset({ // Usar form.reset
      name: type.name,
    });
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este tipo de manutenção?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/maintenance-types/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: "Sucesso!",
          description: "Tipo de manutenção excluído com sucesso.",
        });
        refetch();
      } else {
        throw new Error("Erro ao excluir tipo de manutenção");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao excluir o tipo de manutenção.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const onSubmitRHF = async (data: MaintenanceTypeFormValues) => { // Renomeado e usando dados do RHF
    // A validação de nome em branco é tratada pelo Zod schema
    setIsSubmitting(true);
    try {
      let url = '/api/maintenance-types';
      let method = 'POST';
      
      if (formMode === "edit" && currentType) {
        url = `/api/maintenance-types/${currentType.id}`;
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao salvar tipo de manutenção");
      }

      toast({
        title: "Sucesso!",
        description: formMode === "create" 
          ? "Tipo de manutenção cadastrado com sucesso." 
          : "Tipo de manutenção atualizado com sucesso.",
      });

      resetFormRHF();
      refetch();
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro ao salvar o tipo de manutenção.",
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
            {formMode === "create" ? "Novo Tipo de Manutenção" : "Editar Tipo de Manutenção"}
          </CardTitle>
          <CardDescription>
            {formMode === "create"
              ? "Cadastre um novo tipo de manutenção"
              : "Altere os dados do tipo de manutenção selecionado"}
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
                    <FormLabel>Nome do Tipo de Manutenção*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Troca de Óleo" {...field} />
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
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Manutenção Cadastrados</CardTitle>
          <CardDescription>
            {types.length} tipo(s) de manutenção registrado(s) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {types.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum tipo de manutenção cadastrado.</p>
              <p className="text-sm mt-1">Use o formulário acima para adicionar um novo tipo de manutenção.</p>
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
                          <Wrench className="h-4 w-4 mr-2" />
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
