import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { insertVehicleSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import { Loader2, Save, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { offlineStorage } from "@/services/offlineStorage";

// Extend schema for validation
const vehicleFormSchema = insertVehicleSchema.extend({
  image: z.instanceof(File).optional(),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  onSuccess?: () => void;
  editingVehicle?: any;
}

export function VehicleForm({ onSuccess, editingVehicle }: VehicleFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default values
  const defaultValues: Partial<VehicleFormValues> = {
    name: editingVehicle?.name || "",
    plate: editingVehicle?.plate || "",
    model: editingVehicle?.model || "",
    year: editingVehicle?.year || new Date().getFullYear(),
  };
  
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues,
  });
  
  const createVehicle = useMutation({
    mutationFn: async (data: VehicleFormValues) => {
      try {
        // Handle offline state
        if (!navigator.onLine) {
          // Generate a temporary id (negative to avoid collisions with server ids)
          const tempId = -(Date.now());
          
          // Create vehicle object
          const vehicle = {
            ...data,
            id: tempId,
          };
          
          // Get current vehicles
          const vehicles = await offlineStorage.getVehicles();
          
          // Add new vehicle
          vehicles.push(vehicle);
          
          // Save to local storage
          await offlineStorage.saveVehicles(vehicles);
          
          // Save image if provided
          if (data.image && imagePreview) {
            await offlineStorage.saveImage(`vehicle_${tempId}`, imagePreview);
          }
          
          return vehicle;
        }
        
        // Online state - create FormData for file upload
        const formData = new FormData();
        
        // Add all fields to form data
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'image') {
            formData.append(key, String(value));
          }
        });
        
        // Add image if available
        if (data.image) {
          formData.append('image', data.image);
        }
        
        // Send data to server using fetch directly
        const response = await fetch('/api/vehicles', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Erro ao salvar veículo');
        }
        
        return await response.json();
      } catch (error) {
        console.error("Erro ao criar veículo:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Veículo cadastrado com sucesso.",
      });
      
      // Reset form
      form.reset();
      setImagePreview(null);
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      
      // Call success callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao cadastrar o veículo. Tente novamente.",
        variant: "destructive",
      });
      
      console.error("Erro na mutação:", error);
    },
  });
  
  const handleImageChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };
  
  const onSubmit = (data: VehicleFormValues) => {
    createVehicle.mutate(data);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          {editingVehicle ? "Editar Veículo" : "Novo Veículo"}
        </CardTitle>
        <CardDescription>
          {editingVehicle 
            ? "Altere os dados do veículo conforme necessário" 
            : "Preencha os dados para cadastrar um novo veículo"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormDescription>
                      Identifique o veículo de forma clara
                    </FormDescription>
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
                      <Input placeholder="Ex: ABC-1234" {...field} />
                    </FormControl>
                    <FormDescription>
                      Placa do veículo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Ranger XLT" {...field} />
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
                    <FormLabel>Ano*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ex: 2022" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || "")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="image"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Foto do Veículo</FormLabel>
                  <FormControl>
                    <FileInput
                      {...field}
                      accept={['image/jpeg', 'image/png', 'image/jpg']}
                      maxSize={5} // 5MB
                      onFileChange={(file) => {
                        onChange(file);
                        handleImageChange(file);
                      }}
                      defaultPreview={imagePreview || undefined}
                    />
                  </FormControl>
                  <FormDescription>
                    Adicione uma foto do veículo (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={createVehicle.isPending}
                className="flex items-center gap-1"
              >
                {createVehicle.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Veículo
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