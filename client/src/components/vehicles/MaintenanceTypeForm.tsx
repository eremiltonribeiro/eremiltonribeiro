import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { insertMaintenanceTypeSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { offlineStorage } from "@/services/offlineStorage";

// Extend schema for validation
const maintenanceTypeFormSchema = insertMaintenanceTypeSchema;

type MaintenanceTypeFormValues = z.infer<typeof maintenanceTypeFormSchema>;

interface MaintenanceTypeFormProps {
  onSuccess?: () => void;
  editingType?: any;
}

export function MaintenanceTypeForm({ onSuccess, editingType }: MaintenanceTypeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default values
  const defaultValues: Partial<MaintenanceTypeFormValues> = {
    name: editingType?.name || "",
  };
  
  const form = useForm<MaintenanceTypeFormValues>({
    resolver: zodResolver(maintenanceTypeFormSchema),
    defaultValues,
  });
  
  const createMaintenanceType = useMutation({
    mutationFn: async (data: MaintenanceTypeFormValues) => {
      try {
        // Handle offline state
        if (!navigator.onLine) {
          // Generate a temporary id (negative to avoid collisions with server ids)
          const tempId = -(Date.now());
          
          // Create type object
          const maintenanceType = {
            ...data,
            id: tempId,
          };
          
          // Get current types
          const types = await offlineStorage.getMaintenanceTypes();
          
          // Add new type
          types.push(maintenanceType);
          
          // Save to local storage
          await offlineStorage.saveMaintenanceTypes(types);
          
          return maintenanceType;
        }
        
        // Send data to server
        const response = await fetch('/api/maintenance-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('Erro ao salvar tipo de manutenção');
        }
        
        return await response.json();
      } catch (error) {
        console.error("Erro ao criar tipo de manutenção:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Tipo de manutenção cadastrado com sucesso.",
      });
      
      // Reset form
      form.reset();
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-types'] });
      
      // Call success callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao cadastrar o tipo de manutenção. Tente novamente.",
        variant: "destructive",
      });
      
      console.error("Erro na mutação:", error);
    },
  });
  
  const onSubmit = (data: MaintenanceTypeFormValues) => {
    createMaintenanceType.mutate(data);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          {editingType ? "Editar Tipo de Manutenção" : "Novo Tipo de Manutenção"}
        </CardTitle>
        <CardDescription>
          {editingType 
            ? "Altere os dados do tipo de manutenção conforme necessário" 
            : "Cadastre um novo tipo de manutenção para registrar serviços"}
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
                  <FormLabel>Nome do Serviço*</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Troca de Óleo" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome do tipo de manutenção ou serviço
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={createMaintenanceType.isPending}
                className="flex items-center gap-1"
              >
                {createMaintenanceType.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Tipo
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