import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VehicleChecklist {
  id: number;
  date: string;
  vehicleId: number;
  driverId: number;
  odometer: number;
  status: string;
  vehicle: {
    name: string;
    plate: string;
  };
  driver: {
    name: string;
  };
  template: {
    name: string;
  };
}

export default function ChecklistSimple() {
  const [checklists, setChecklists] = useState<VehicleChecklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const loadChecklists = async () => {
      setIsLoading(true);
      
      try {
        // Carregar dados da API
        const response = await fetch('/api/checklists');
        
        if (!response.ok) {
          throw new Error('Erro ao carregar checklists');
        }
        
        const data = await response.json();
        console.log("Checklists carregados:", data);
        setChecklists(data);
      } catch (error) {
        console.error('Erro ao carregar checklists:', error);
        toast({
          title: "Erro ao carregar",
          description: "Não foi possível carregar os checklists. Tente novamente.",
          variant: "destructive",
        });
        
        // Em caso de erro, mostrar lista vazia
        setChecklists([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChecklists();
  }, []);

  const handleNewChecklist = () => {
    console.log("Criando novo checklist");
    // Usando a forma mais direta e garantida de navegação
    document.location.href = "/checklists/new";
  };
  
  const handleViewChecklist = (id: number) => {
    setLocation(`/checklists/${id}`);
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateString;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "pending":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "complete":
        return "Aprovado";
      case "failed":
        return "Falhas Encontradas";
      case "pending":
        return "Pendente";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="text-center">
          <div className="mb-4">Carregando checklists...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-blue-900">Checklists de Veículos</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleNewChecklist}
            className="bg-blue-700 hover:bg-blue-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Checklist
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Checklists</CardTitle>
        </CardHeader>
        <CardContent>
          {checklists.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum checklist encontrado.</p>
              <p>Clique em "Novo Checklist" para criar o primeiro.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {checklists.map((checklist) => (
                <div 
                  key={checklist.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewChecklist(checklist.id)}
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h3 className="font-medium mb-1">
                        {checklist.vehicle?.name || "Veículo desconhecido"} ({checklist.vehicle?.plate || "N/A"})
                      </h3>
                      <div className="text-sm text-gray-500">
                        <p>Motorista: {checklist.driver?.name || "Desconhecido"}</p>
                        <p>Data: {formatDate(checklist.date)}</p>
                        <p>Hodômetro: {checklist.odometer} km</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(checklist.status)}
                        <span>{getStatusText(checklist.status)}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewChecklist(checklist.id);
                        }}
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}