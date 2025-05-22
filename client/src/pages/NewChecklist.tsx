import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Save, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

// Interfaces para os dados
interface Vehicle {
  id: number;
  name: string;
  plate: string;
}

interface Driver {
  id: number;
  name: string;
}

interface ChecklistTemplate {
  id: number;
  name: string;
  description: string | null;
}

interface ChecklistItem {
  id: number;
  templateId: number;
  name: string;
  description: string | null;
  isRequired: boolean;
  category: string | null;
  order: number;
}

// Esquema de validação para o formulário básico
const baseFormSchema = z.object({
  vehicleId: z.string().min(1, "Selecione um veículo"),
  driverId: z.string().min(1, "Selecione um motorista"),
  templateId: z.string().min(1, "Selecione um modelo de checklist"),
  odometer: z.string().min(1, "Informe a quilometragem"),
  observations: z.string().optional(),
});

// Componente principal
export default function NewChecklist() {
  const params = useParams<{ id?: string }>();
  const editMode = !!params.id;
  const checklistId = params.id ? parseInt(params.id) : undefined;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<"info" | "items">("info");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<{ [key: number]: { status: string; observation: string | null; photoUrl: string | null } }>({});
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [baseFormComplete, setBaseFormComplete] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [issueObservation, setIssueObservation] = useState("");
  const [existingChecklist, setExistingChecklist] = useState<any>(null);

  // Inicializar o formulário
  const form = useForm<z.infer<typeof baseFormSchema>>({
    resolver: zodResolver(baseFormSchema),
    defaultValues: {
      vehicleId: "",
      driverId: "",
      templateId: "",
      odometer: "",
      observations: "",
    },
  });

  // Carregar dados iniciais

  useEffect(() => {
    const loadInitialDataAndChecklist = async () => {
      await loadInitialData();
      
      // Se estiver no modo de edição, carregar dados do checklist existente
      if (editMode && checklistId) {
        try {
          const response = await fetch(`/api/checklists/edit/${checklistId}`);

          if (!response.ok) {
            throw new Error("Erro ao carregar dados do checklist");
          }

          const checklistData = await response.json();
          console.log("Checklist carregado para edição:", checklistData);

          // Armazenar os dados completos do checklist
          setExistingChecklist(checklistData);

          // Preencher o formulário com os dados existentes
          form.setValue("vehicleId", checklistData.vehicleId.toString());
          form.setValue("driverId", checklistData.driverId.toString());
          form.setValue("templateId", checklistData.templateId.toString());
          form.setValue("odometer", checklistData.odometer ? checklistData.odometer.toString() : "0");
          form.setValue("observations", checklistData.observations || "");

          // Carregar os itens do template primeiro
          await loadTemplateItems(checklistData.templateId);

          // Carregar os resultados do checklist
          if (checklistData.results && checklistData.results.length > 0) {
            const resultsMap: { [key: number]: { status: string; observation: string | null; photoUrl: string | null } } = {};

            checklistData.results.forEach((result: any) => {
              resultsMap[result.itemId] = {
                status: result.status,
                observation: result.observation,
                photoUrl: result.photoUrl
              };
            });

            setResults(resultsMap);
          }

          // Depois de carregar os dados, podemos ir direto para os itens
          setBaseFormComplete(true);
          setSelectedTab("items");
        } catch (error) {
          console.error("Erro ao carregar checklist para edição:", error);
          toast({
            title: "Erro ao carregar",
            description: "Não foi possível carregar os dados do checklist para edição",
            variant: "destructive"
          });
        }
      }
    };
    
    loadInitialDataAndChecklist();
  }, [editMode, checklistId]);

  // Carregar dados quando o template muda
  useEffect(() => {
    const templateId = form.watch("templateId");
    if (templateId) {
      loadTemplateItems(parseInt(templateId));
    }
  }, [form.watch("templateId")]);

  // Função para carregar os dados iniciais
  const loadInitialData = async () => {
    setIsLoading(true);

    try {
      // Carregar veículos da API
      const vehiclesResponse = await fetch('/api/vehicles');
      if (!vehiclesResponse.ok) {
        throw new Error('Erro ao carregar veículos');
      }
      const vehiclesData = await vehiclesResponse.json();
      setVehicles(vehiclesData);

      // Carregar motoristas da API
      const driversResponse = await fetch('/api/drivers');
      if (!driversResponse.ok) {
        throw new Error('Erro ao carregar motoristas');
      }
      const driversData = await driversResponse.json();
      setDrivers(driversData);

      // Carregar templates de checklist da API
      const templatesResponse = await fetch('/api/checklist-templates');
      if (!templatesResponse.ok) {
        throw new Error('Erro ao carregar templates');
      }
      const templatesData = await templatesResponse.json();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os dados necessários. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // This duplicate function has been removed to fix the build error

  // Função para carregar os itens do template selecionado
  const loadTemplateItems = async (templateId: number) => {
    try {
      // Carregar itens do template da API
      const response = await fetch(`/api/checklist-templates/${templateId}/items`);

      if (!response.ok) {
        throw new Error('Erro ao carregar itens do template');
      }

      const items: ChecklistItem[] = await response.json();

      setItems(items);

      // Inicializar resultados como vazios
      const initialResults: { [key: number]: { status: string; observation: string | null; photoUrl: string | null } } = {};
      items.forEach(item => {
        initialResults[item.id] = { status: "", observation: null, photoUrl: null };
      });

      setResults(initialResults);
    } catch (error) {
      console.error('Erro ao carregar itens do template:', error);
      toast({
        title: "Erro ao carregar itens",
        description: "Não foi possível carregar os itens do checklist. Tente novamente.",
        variant: "destructive",
      });

      // Em caso de erro, definir uma lista vazia
      setItems([]);
      setResults({});
    }
  };

  // Voltar para a página de checklists
  const handleBack = () => {
    setLocation("/checklists");
  };

  // Enviar o formulário
  const onSubmit = async (data: z.infer<typeof baseFormSchema>) => {
    // Se estivermos na primeira etapa, avançar para a segunda
    if (selectedTab === "info") {
      setBaseFormComplete(true);
      setSelectedTab("items");
      return;
    }

    // Verificar se todos os itens obrigatórios foram avaliados
    const requiredItems = items.filter(item => item.isRequired);
    const missingItems = requiredItems.filter(item => !results[item.id]?.status);

    if (missingItems.length > 0) {
      toast({
        title: "Checklist incompleto",
        description: `Existem ${missingItems.length} itens obrigatórios não avaliados.`,
        variant: "destructive",
      });
      return;
    }

    // Se todos os itens obrigatórios foram avaliados, enviar o checklist
    setIsSubmitting(true);

    try {
      // Criar objeto com os dados do checklist
      const checklistData = {
        vehicleId: parseInt(data.vehicleId),
        driverId: parseInt(data.driverId),
        templateId: parseInt(data.templateId),
        odometer: parseInt(data.odometer),
        observations: data.observations || null,
        // Manter a data original se estiver em modo edição
        date: editMode && existingChecklist?.date ? new Date(existingChecklist.date) : new Date(),
        status: "pending", // Status inicial
        photoUrl: null,
        results: Object.entries(results).map(([itemId, result]) => ({
          itemId: parseInt(itemId),
          status: result.status || "not_applicable",
          observation: result.observation,
          photoUrl: result.photoUrl, // Aqui estamos enviando a URL da foto (que pode ser um data URL)
        })),
      };

      console.log(editMode ? "Atualizando checklist:" : "Enviando novo checklist:", checklistData);

      // URL e método HTTP variam dependendo se estamos editando ou criando
      const url = editMode ? `/api/checklists/${checklistId}` : "/api/checklists";
      const method = editMode ? "PUT" : "POST";

      // Usar FormData para enviar os dados e arquivos, se necessário
      const formData = new FormData();
      formData.append('data', JSON.stringify(checklistData));

      // Verifica se há fotos para os itens (em uma implementação real, enviariam os arquivos)
      // Como estamos usando data URLs, não precisamos enviar os arquivos separadamente

      // Enviar para a API com headers adequados para FormData
      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Erro ao salvar checklist";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          console.error("Resposta de erro não é JSON válido:", errorText);
        }
        throw new Error(errorMessage);
      }

      // Tentar obter a resposta para debugging
      const responseData = await response.json();
      console.log("Resposta do servidor:", responseData);

      toast({
        title: editMode ? "Checklist atualizado com sucesso!" : "Checklist salvo com sucesso!",
        description: editMode 
          ? "As alterações foram salvas no sistema."
          : "O checklist foi registrado no sistema.",
      });

      // Sempre setar isSubmitting para false antes de redirecionar
      setIsSubmitting(false);

      // Redirecionar para a página de checklists após pequeno delay para mostrar mensagem
      setTimeout(() => {
        setLocation("/checklists");
      }, 500);
    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Não foi possível salvar o checklist. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Atualizar o status de um item
  const updateItemStatus = (itemId: number, status: string) => {
    setResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        status,
      },
    }));
  };

  // Abrir o diálogo para reportar um problema
  const openIssueDialog = (item: ChecklistItem) => {
    setSelectedItem(item);
    setIssueObservation("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoDialogOpen(true);
  };

  // Salvar os detalhes do problema
  const saveIssueDetails = () => {
    if (!selectedItem) return;

    // Verificar se temos um arquivo de foto e um preview
    if (photoFile && photoPreview) {
      // Usamos o preview da imagem (data URL) diretamente
      // Em uma implementação real, enviaríamos o arquivo para o servidor
      // e utilizaríamos a URL retornada
      setResults(prev => ({
        ...prev,
        [selectedItem.id]: {
          ...prev[selectedItem.id],
          status: "issue",
          observation: issueObservation || null,
          photoUrl: photoPreview, // Armazenamos o data URL diretamente
        },
      }));

      console.log(`Foto associada ao item ${selectedItem.id}`);
    } else {
      // Sem foto, apenas atualizamos a observação
      setResults(prev => ({
        ...prev,
        [selectedItem.id]: {
          ...prev[selectedItem.id],
          status: "issue",
          observation: issueObservation || null,
          photoUrl: null,
        },
      }));
    }

    setPhotoDialogOpen(false);
  };

  // Manipular o upload de foto
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Agrupar itens por categoria
  const getItemsByCategory = () => {
    const categories: Record<string, ChecklistItem[]> = {};

    items.forEach(item => {
      const category = item.category || "Sem categoria";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(item);
    });

    return categories;
  };

  // Verificar se todos os itens foram avaliados
  const allItemsChecked = () => {
    const requiredItems = items.filter(item => item.isRequired);
    return requiredItems.every(item => results[item.id]?.status);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="text-center">
          <div className="mb-4">Carregando...</div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Previne múltiplos cliques
    if (isSaving) return;

    setIsSaving(true);

    try {
      // Verificar se todos os campos obrigatórios estão preenchidos
      if (!form.getValues("vehicleId") || !form.getValues("driverId") || !form.getValues("templateId")) {
        toast({
          title: "Dados incompletos",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Preparar o FormData para envio
      const formData = new FormData();
      const resultsToSend = Object.entries(results).map(([itemId, result]) => {
        return {
          itemId: parseInt(itemId),
          status: result.status || "ok",
          observation: result.observation,
          photoUrl: result.photoUrl,
        };
      });

      const checklistData = {
        vehicleId: parseInt(form.getValues("vehicleId")),
        driverId: parseInt(form.getValues("driverId")),
        templateId: parseInt(form.getValues("templateId")),
        odometer: parseInt(form.getValues("odometer")),
        observations: form.getValues("observations") || null,
        date: editMode && existingChecklist?.date ? new Date(existingChecklist.date) : new Date(),
        status: "pending",
        results: resultsToSend,
      };

      formData.append("data", JSON.stringify(checklistData));

      // Determinar URL com base em modo de edição
      const url = editMode
        ? `/api/checklists/${checklistId}`
        : "/api/checklists";

      // Configurar método com base em modo de edição
      const method = editMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        throw new Error(errorData.message || `Erro ao ${editMode ? "atualizar" : "criar"} checklist`);
      }

      const result = await response.json();

      toast({
        title: editMode ? "Checklist atualizado" : "Checklist criado",
        description: editMode
          ? "O checklist foi atualizado com sucesso."
          : "O checklist foi criado com sucesso.",
      });

      // Redirecionar para a página de detalhes do checklist após um breve delay
      // para permitir que o toast seja exibido
      setTimeout(() => {
        setIsSaving(false); // Garantir que o estado é resetado antes da navegação
        setLocation(`/checklists/${editMode ? checklistId : result.id}`);
      }, 500);

      return; // Importante: impede a execução do setIsSaving(false) no finally
    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
      toast({
        title: "Erro",
        description: `Ocorreu um erro ao ${
          editMode ? "atualizar" : "criar"
        } o checklist: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8 text-blue-700 mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold text-blue-900">Novo Checklist</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedTab === "info" ? "default" : "outline"}
            onClick={() => setSelectedTab("info")}
            className={selectedTab === "info" ? "bg-blue-700" : "text-blue-700 border-blue-700"}
          >
            1. Informações Básicas
          </Button>
          <Button
            variant={selectedTab === "items" ? "default" : "outline"}
            onClick={() => baseFormComplete && setSelectedTab("items")}
            disabled={!baseFormComplete}
            className={selectedTab === "items" ? "bg-blue-700" : "text-blue-700 border-blue-700"}
          >
            2. Itens do Checklist
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {selectedTab === "info" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Informações do Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Veículo</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um veículo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                {vehicle.name} ({vehicle.plate})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="driverId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motorista</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um motorista" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {drivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id.toString()}>
                                {driver.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo de Checklist</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um modelo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="odometer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hodômetro (km)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações Gerais</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações adicionais sobre o veículo ou checklist" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {selectedTab === "items" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Itens do Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    Nenhum item encontrado para este modelo de checklist.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(getItemsByCategory()).map(([category, categoryItems]) => (
                      <div key={category} className="space-y-3">
                        <h3 className="font-medium text-blue-900">{category}</h3>
                        <div className="overflow-auto rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead className="font-medium">Item</TableHead>
                                <TableHead className="font-medium">Obrigatório</TableHead>
                                <TableHead className="font-medium">Status</TableHead>
                                <TableHead className="font-medium">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {categoryItems.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{item.name}</p>
                                      {item.description && (
                                        <p className="text-sm text-gray-500">{item.description}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {item.isRequired ? "Sim" : "Não"}
                                  </TableCell>
                                  <TableCell>
                                    <RadioGroup
                                      value={results[item.id]?.status || ""}
                                      onValueChange={(value) => updateItemStatus(item.id, value)}
                                      className="flex space-x-4"
                                    >
                                      <div className="flex items-center space-x-1">
                                        <RadioGroupItem 
                                          value="ok" 
                                          id={`ok-${item.id}`} 
                                          className="text-green-600" 
                                        />
                                        <label 
                                          htmlFor={`ok-${item.id}`}
                                          className="text-sm cursor-pointer"
                                        >
                                          OK
                                        </label>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <RadioGroupItem 
                                          value="issue" 
                                          id={`issue-${item.id}`} 
                                          className="text-red-600"
                                        />
                                        <label
                                          htmlFor={`issue-${item.id}`}
                                          className="text-sm cursor-pointer"
                                        >
                                          Problema
                                        </label>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <RadioGroupItem 
                                          value="not_applicable" 
                                          id={`na-${item.id}`}
                                          className="text-yellow-600"
                                        />
                                        <label
                                          htmlFor={`na-${item.id}`}
                                          className="text-sm cursor-pointer"
                                        >
                                          N/A
                                        </label>
                                      </div>
                                    </RadioGroup>
                                  </TableCell>
                                  <TableCell>
                                    {results[item.id]?.status === "issue" && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.preventDefault(); // Impedir que o formulário seja submetido
                                          openIssueDialog(item);
                                        }}
                                        className="text-red-600 border-red-600"
                                      >
                                        Detalhar Problema
                                      </Button>
                                    )}
                                    {results[item.id]?.status === "issue" && results[item.id]?.observation && (
                                      <div className="mt-1 text-xs text-red-600">
                                        {results[item.id]?.observation}
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="text-blue-700 border-blue-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancelar
            </Button>

            {selectedTab === "info" ? (
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-700 hover:bg-blue-800"
              >
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit"
                disabled={isSubmitting || !allItemsChecked()}
                className="bg-blue-700 hover:bg-blue-800"
              >
                {isSubmitting ? "Salvando..." : "Salvar Checklist"}
                {isSubmitting ? null : <Save className="ml-2 h-4 w-4" />}
              </Button>
            )}
          </div>
        </form>
      </Form>

      {/* Diálogo para reportar um problema */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhar Problema</DialogTitle>
            <DialogDescription>
              Adicione uma descrição e foto do problema encontrado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="observation" className="text-sm font-medium">
                Descrição do Problema
              </label>
              <Textarea
                id="observation"
                placeholder="Descreva o problema encontrado..."
                value={issueObservation}
                onChange={(e) => setIssueObservation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="photo" className="text-sm font-medium">
                Foto do Problema (opcional)
              </label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
              />

              {photoPreview && (
                <div className="mt-2">
                  <p className="text-sm mb-1">Preview:</p>
                  <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setPhotoDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={saveIssueDetails}
              className="bg-blue-700 hover:bg-blue-800"
            >
              Salvar Detalhes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}