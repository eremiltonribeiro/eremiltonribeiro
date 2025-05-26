/**
 * Componente para gerenciamento de veículos
 * 
 * Este componente permite cadastrar, editar, visualizar e excluir veículos,
 * com suporte a operações offline através do armazenamento local.
 */
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Label é substituído por FormLabel de react-hook-form
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileInput } from "@/components/ui/file-input"; // Importar FileInput
import { Loader2, Car, Plus, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Vehicle as SharedVehicle } from "@shared/schema"; // Renomeado para evitar conflito
import { offlineStorage } from "@/services/offlineStorage";

// Schema de validação com Zod
const vehicleFormSchema = z.object({
  name: z.string().min(1, "Nome do veículo é obrigatório."),
  plate: z.string().min(1, "Placa é obrigatória.")
    .regex(/^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/i, "Formato de placa inválido (ex: ABC-1234 ou ABC1D23). Use letras maiúsculas."),
  model: z.string().optional(),
  year: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "Ano deve ser um número."})
      .int("O ano deve ser um número inteiro.")
      .min(1900, "Ano mínimo é 1900.")
      .max(new Date().getFullYear() + 1, `Ano máximo é ${new Date().getFullYear() + 1}.`)
      .optional()
  ),
  // imageUrl agora aceita qualquer string (incluindo data URLs) ou string vazia.
  // A validação de ser uma "URL válida" pode ser muito restritiva para data URLs.
  imageUrl: z.string().optional().or(z.literal('')), 
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

// Estender o tipo Vehicle para incluir a propriedade opcional offlinePending
interface Vehicle extends SharedVehicle {
  offlinePending?: boolean;
}


export function CadastroVeiculos() {
  const { toast } = useToast();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      name: "",
      plate: "",
      model: "",
      year: undefined,
      imageUrl: "",
    },
  });

  /**
   * Consulta para buscar veículos com suporte a operações offline
   * Tenta buscar do servidor primeiro, se estiver online
   * Caso contrário, ou em caso de erro, busca do armazenamento local
   */
  const { data: vehicles = [], isLoading, refetch } = useQuery<Vehicle[]>({ // Adicionado tipo aqui
    queryKey: ["/api/vehicles"],
    queryFn: async (): Promise<Vehicle[]> => { // Adicionado tipo de retorno aqui
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/vehicles");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveVehicles(data);
            return data;
          }
        }
        return await offlineStorage.getVehicles();
      } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        return await offlineStorage.getVehicles();
      }
    }
  });

  /**
   * Reseta o formulário para o estado inicial
   */
  const resetFormRHF = () => { // Renomeado para evitar conflito e usar RHF
    form.reset({
      name: "",
      plate: "",
      model: "",
      year: undefined,
      imageUrl: "",
    });
    setFormMode("create");
    setCurrentVehicle(null);
  };

  /**
   * Prepara o formulário para edição de um veículo existente
   */
  const handleEdit = (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle);
    form.reset({
      name: vehicle.name,
      plate: vehicle.plate,
      model: vehicle.model || "",
      year: vehicle.year ? Number(vehicle.year) : undefined,
      imageUrl: vehicle.imageUrl || "",
    });
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Exclui um veículo após confirmação do usuário
   */
  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este veículo?")) return;
    setDeletingId(id);
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
        refetch(); // Atualiza a lista após exclusão
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
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Processa o envio do formulário para criar ou atualizar um veículo
   */
  const onSubmitRHF = async (data: VehicleFormValues) => { // Renomeado e usando dados do RHF
    setIsSubmitting(true);
    try {
      // Os dados já estão validados e tipados por Zod e RHF
      // A conversão de 'year' para número (ou undefined) é feita pelo Zod preprocess
      const vehicleData = {
        ...data,
        // Garante que plate seja maiúscula antes de enviar, se necessário pela API
        plate: data.plate.toUpperCase(), 
      };

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
      resetFormRHF();
      refetch();
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao salvar o veículo.",
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
            {formMode === "create" ? "Novo Veículo" : "Editar Veículo"}
          </CardTitle>
          <CardDescription>
            {formMode === "create"
              ? "Cadastre um novo veículo no sistema"
              : "Altere os dados do veículo selecionado"}
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
                      <FormLabel>Nome do Veículo*</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Ford Ranger" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="plate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa*</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: ABC-1234 ou ABC1D23" {...field} style={{ textTransform: 'uppercase' }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: XLT 4x4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 2023" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Imagem do Veículo</FormLabel>
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
                              // Se o FileInput permitir limpar a seleção,
                              // o valor de field.value já deve ter sido limpo pelo FileInput
                              // ou podemos explicitamente chamar field.onChange("") se necessário.
                              // O FileInput atual não parece ter um botão "limpar" explícito,
                              // mas selecionar um novo arquivo substituirá o antigo.
                              // Se o usuário não selecionar nada, o valor antigo persiste
                              // (se houver um) ou fica vazio.
                              // Para garantir que um "desselecionar" (se possível) limpe o campo:
                              if (field.value && !file) { // se havia valor mas agora não há file
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
                    formMode === "create" ? "Cadastrar Veículo" : "Atualizar Veículo"
                  )}
                </Button>
              </div>
            </form>
          </Form>
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
                            disabled={deletingId === vehicle.id || isSubmitting} // Adicionado isSubmitting aqui
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:text-error/90"
                            onClick={() => handleDelete(vehicle.id)}
                            aria-label={`Excluir ${vehicle.name}`}
                            disabled={deletingId === vehicle.id || isSubmitting} // Adicionado isSubmitting aqui
                          >
                            {deletingId === vehicle.id ? (
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
