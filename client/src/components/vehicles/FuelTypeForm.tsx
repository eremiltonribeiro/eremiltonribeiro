import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { insertFuelTypeSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Droplet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { offlineStorage } from "@/services/offlineStorage";

// Extend schema for validation
const fuelTypeFormSchema = insertFuelTypeSchema;

type FuelTypeFormValues = z.infer<typeof fuelTypeFormSchema>;

interface FuelTypeFormProps {
  onSuccess?: () => void;
  editingType?: any;
}

export function FuelTypeForm({ onSuccess, editingType }: FuelTypeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default values
  const defaultValues: Partial<FuelTypeFormValues> = {
    name: editingType?.name || "",
  };
  
  const form = useForm<FuelTypeFormValues>({
    resolver: zodResolver(fuelTypeFormSchema),
    defaultValues,
  });
  
  const createFuelType = useMutation({
    mutationFn: async (data: FuelTypeFormValues) => {
      try {
        // Handle offline state
        if (!navigator.onLine) {
          // Generate a temporary id (negative to avoid collisions with server ids)
          const tempId = -(Date.now());
          
          // Create fuelType object
          const fuelType = {
            ...data,
            id: tempId,
          };
          
          // Get current types
          const types = await offlineStorage.getFuelTypes();
          
          // Add new fuelType
          types.push(fuelType);
          
          // Save to local storage
          await offlineStorage.saveFuelTypes(types);
          
          return fuelType;
        }
        
        // Simplificando ao máximo o envio de dados
        const simplifiedData = { name: data.name.trim() };
        console.log("Enviando dados simplificados:", simplifiedData);
        
        // Enviar dados diretamente ao servidor
        const response = await fetch('/api/fuel-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(simplifiedData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Resposta de erro do servidor:", errorData);
          throw new Error(errorData.message || 'Erro ao salvar tipo de combustível');
        }
        
        const result = await response.json();
        console.log("Resultado do servidor:", result);
        return result;
      } catch (error) {
        console.error("Erro ao criar tipo de combustível:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Tipo de combustível cadastrado com sucesso.",
      });
      
      // Reset form
      form.reset();
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/fuel-types'] });
      
      // Call success callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao cadastrar o tipo de combustível. Tente novamente.",
        variant: "destructive",
      });
      
      console.error("Erro na mutação:", error);
    },
  });
  
  const onSubmit = (data: FuelTypeFormValues) => {
    // Verifique se o campo name não está vazio
    if (!data.name || data.name.trim() === "") {
      form.setError("name", {
        type: "manual",
        message: "O nome do combustível é obrigatório"
      });
      return;
    }
    
    console.log("Enviando dados para servidor:", data);
    createFuelType.mutate(data);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="h-5 w-5" />
          {editingType ? "Editar Tipo de Combustível" : "Novo Tipo de Combustível"}
        </CardTitle>
        <CardDescription>
          {editingType 
            ? "Altere os dados do tipo de combustível conforme necessário" 
            : "Cadastre um novo tipo de combustível para abastecimentos"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Combustível*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Gasolina Comum" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Nome do tipo de combustível para abastecimento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={createFuelType.isPending}
                className="flex items-center gap-1"
              >
                {createFuelType.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Combustível
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}