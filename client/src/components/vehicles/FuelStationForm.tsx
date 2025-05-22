import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { insertFuelStationSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Fuel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { offlineStorage } from "@/services/offlineStorage";

// Extend schema for validation
const fuelStationFormSchema = insertFuelStationSchema;

type FuelStationFormValues = z.infer<typeof fuelStationFormSchema>;

interface FuelStationFormProps {
  onSuccess?: () => void;
  editingStation?: any;
}

export function FuelStationForm({ onSuccess, editingStation }: FuelStationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default values
  const defaultValues: Partial<FuelStationFormValues> = {
    name: editingStation?.name || "",
    address: editingStation?.address || "",
  };
  
  const form = useForm<FuelStationFormValues>({
    resolver: zodResolver(fuelStationFormSchema),
    defaultValues,
  });
  
  const createFuelStation = useMutation({
    mutationFn: async (data: FuelStationFormValues) => {
      try {
        // Handle offline state
        if (!navigator.onLine) {
          // Generate a temporary id (negative to avoid collisions with server ids)
          const tempId = -(Date.now());
          
          // Create fuelStation object
          const fuelStation = {
            ...data,
            id: tempId,
          };
          
          // Get current stations
          const stations = await offlineStorage.getFuelStations();
          
          // Add new fuelStation
          stations.push(fuelStation);
          
          // Save to local storage
          await offlineStorage.saveFuelStations(stations);
          
          return fuelStation;
        }
        
        // Send data to server using fetch directly
        const response = await fetch('/api/fuel-stations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('Erro ao salvar posto de combustível');
        }
        
        return await response.json();
      } catch (error) {
        console.error("Erro ao criar posto:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Posto de combustível cadastrado com sucesso.",
      });
      
      // Reset form
      form.reset();
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/fuel-stations'] });
      
      // Call success callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao cadastrar o posto de combustível. Tente novamente.",
        variant: "destructive",
      });
      
      console.error("Erro na mutação:", error);
    },
  });
  
  const onSubmit = (data: FuelStationFormValues) => {
    createFuelStation.mutate(data);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          {editingStation ? "Editar Posto" : "Novo Posto"}
        </CardTitle>
        <CardDescription>
          {editingStation 
            ? "Altere os dados do posto conforme necessário" 
            : "Preencha os dados para cadastrar um novo posto de combustível"}
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
                  <FormLabel>Nome do Posto*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Posto Ipiranga" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Nome da empresa ou posto de combustível
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Av. Paulista, 1578" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Endereço completo ou referência do posto
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={createFuelStation.isPending}
                className="flex items-center gap-1"
              >
                {createFuelStation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Posto
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