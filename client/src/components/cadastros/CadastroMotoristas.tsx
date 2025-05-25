/**
 * Componente para gerenciamento de motoristas
 * 
 * Este componente permite cadastrar, editar, visualizar e excluir motoristas,
 * com suporte a operações offline através do armazenamento local.
 */
import { useState, useEffect } from "react"; // Adicionado useEffect, embora não usado diretamente na refatoração do form
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
import { FileInput } from "@/components/ui/file-input"; // Importar FileInput
import { Loader2, UserCircle, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Driver as SharedDriver } from "@shared/schema"; // Renomeado para evitar conflito
import { offlineStorage } from "@/services/offlineStorage";

// Schema de validação com Zod
const driverFormSchema = z.object({
  name: z.string().min(1, "Nome do motorista é obrigatório."),
  license: z.string().max(20, "CNH deve ter no máximo 20 caracteres.").optional().or(z.literal('')),
  phone: z.string().max(20, "Telefone deve ter no máximo 20 caracteres.").optional().or(z.literal('')),
  imageUrl: z.string().optional().or(z.literal('')), // Ajustado para aceitar data URLs
});

type DriverFormValues = z.infer<typeof driverFormSchema>;

// Estender o tipo Driver para incluir a propriedade opcional offlinePending (se aplicável no futuro)
interface Driver extends SharedDriver {
  offlinePending?: boolean;
}

export function CadastroMotoristas() {
  const { toast } = useToast();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      name: "",
      license: "",
      phone: "",
      imageUrl: "",
    },
  });

  /**
   * Consulta para buscar motoristas com suporte a operações offline
   * Tenta buscar do servidor primeiro, se estiver online
   * Caso contrário, ou em caso de erro, busca do armazenamento local
   */
  const { data: drivers = [], isLoading, refetch } = useQuery<Driver[]>({ // Adicionado tipo
    queryKey: ["/api/drivers"],
    queryFn: async (): Promise<Driver[]> => { // Adicionado tipo
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/drivers");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveDrivers(data);
            return data;
          }
        }
        return await offlineStorage.getDrivers();
      } catch (error) {
        console.error("Erro ao buscar motoristas:", error);
        return await offlineStorage.getDrivers();
      }
    }
  });

  /**
   * Reseta o formulário para o estado inicial
   */
  const resetFormRHF = () => { // Renomeado
    form.reset({
      name: "",
      license: "",
      phone: "",
      imageUrl: "",
    });
    setFormMode("create");
    setCurrentDriver(null);
  };

  /**
   * Prepara o formulário para edição de um motorista existente
   */
  const handleEdit = (driver: Driver) => {
    setCurrentDriver(driver);
    form.reset({ // Usar form.reset para popular o formulário
      name: driver.name,
      license: driver.license || "",
      phone: driver.phone || "",
      imageUrl: driver.imageUrl || "",
    });
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Exclui um motorista após confirmação do usuário
   */
  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este motorista?")) return;
    setDeletingId(id);
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
        refetch(); // Atualiza a lista após exclusão
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
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Processa o envio do formulário para criar ou atualizar um motorista
   */
  const onSubmitRHF = async (data: DriverFormValues) => { // Renomeado e usando dados do RHF
    setIsSubmitting(true);
    try {
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
        body: JSON.stringify(data), // Usar 'data' do RHF
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
      resetFormRHF();
      refetch();
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao salvar o motorista.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitRHF)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Motorista*</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="license"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNH</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 12345678901" {...field} maxLength={20} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: (11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagem do Motorista</FormLabel>
                      <FormControl>
                        <FileInput
                          accept={["image/jpeg", "image/png", "image/gif"]}
                          defaultPreview={field.value || ""}
                          onFileChange={(file) => {
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                field.onChange(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            } else {
                              if (field.value && !file) {
                                field.onChange("");
                              }
                            }
                          }}
                        />
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
                variant={formMode === "create" ? "default" : "success"}
                className="flex items-center gap-1"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  formMode === "create" ? "Cadastrar Motorista" : "Atualizar Motorista"
                )}
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
                            disabled={deletingId === driver.id || isSubmitting}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:text-error/90"
                            onClick={() => handleDelete(driver.id)}
                            aria-label={`Excluir ${driver.name}`}
                            disabled={deletingId === driver.id || isSubmitting}
                          >
                            {deletingId === driver.id ? (
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
