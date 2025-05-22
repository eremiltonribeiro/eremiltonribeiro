import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Truck, CheckCircle2, XCircle, AlertTriangle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: number;
  templateId: number;
  name: string;
  description: string | null;
  isRequired: boolean;
  category: string | null;
  order: number | null;
}

interface ChecklistResult {
  id: number;
  checklistId: number;
  itemId: number;
  status: "ok" | "issue" | "not_applicable";
  observation: string | null;
  photoUrl: string | null;
}

interface VehicleChecklist {
  id: number;
  vehicleId: number;
  driverId: number;
  templateId: number;
  date: string;
  observations: string | null;
  odometer: number;
  status: "pending" | "complete" | "failed";
  photoUrl: string | null;
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
  results: ChecklistResult[];
  items: ChecklistItem[];
}

export default function ChecklistDetails() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [checklist, setChecklist] = useState<VehicleChecklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Função para navegação
  const navigate = (path: string) => setLocation(path);

  useEffect(() => {
    if (id) {
      loadChecklistData(id);
    }
  }, [id]);

  const loadChecklistData = async (checklistId: string) => {
    setIsLoading(true);

    try {
      console.log("Carregando checklist ID:", checklistId);

      // Buscar dados do checklist da API
      const response = await fetch(`/api/checklists/${checklistId}`);

      if (!response.ok) {
        console.error("Falha ao carregar checklist:", response.status, response.statusText);
        throw new Error('Erro ao carregar dados do checklist');
      }

      const checklistData = await response.json();
      console.log("Dados do checklist:", checklistData);

      // Verificar se há dados válidos e templateId
      if (!checklistData) {
        throw new Error('Dados do checklist inválidos');
      }

      // Se o template não existir, definir um padrão
      if (!checklistData.template) {
        checklistData.template = { name: "Sem modelo" };
      }

      // Se o veículo não existir, definir um padrão
      if (!checklistData.vehicle) {
        checklistData.vehicle = { name: "Veículo desconhecido", plate: "N/A" };
      }

      // Se o motorista não existir, definir um padrão
      if (!checklistData.driver) {
        checklistData.driver = { name: "Motorista desconhecido" };
      }

      let resultsData: ChecklistResult[] = [];
      let itemsData: ChecklistItem[] = [];

      // Buscar os resultados do checklist se possível
      try {
        const resultsResponse = await fetch(`/api/checklists/${checklistId}/results`);

        if (resultsResponse.ok) {
          resultsData = await resultsResponse.json();
          console.log("Resultados carregados:", resultsData.length);
        }
      } catch (error) {
        console.warn("Erro ao carregar resultados:", error);
      }

      // Buscar os itens do template se houver templateId
      if (checklistData.templateId) {
        try {
          const itemsResponse = await fetch(`/api/checklist-templates/${checklistData.templateId}/items`);

          if (itemsResponse.ok) {
            itemsData = await itemsResponse.json();
            console.log("Itens carregados:", itemsData.length);
          }
        } catch (error) {
          console.warn("Erro ao carregar itens:", error);
        }
      }

      // Montar o objeto checklist completo
      const completeChecklist = {
        ...checklistData,
        results: resultsData,
        items: itemsData
      };

      console.log("Checklist completo montado:", completeChecklist);
      setChecklist(completeChecklist);
    } catch (error) {
      console.error('Erro ao carregar dados do checklist:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os detalhes do checklist. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/checklists");
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString || "Data não disponível";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "issue":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "not_applicable":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ok":
        return "OK";
      case "issue":
        return "Problema";
      case "not_applicable":
        return "Não aplicável";
      default:
        return status;
    }
  };

  const getChecklistStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case "failed":
        return <XCircle className="h-6 w-6 text-red-600" />;
      case "pending":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getChecklistStatusText = (status: string) => {
    switch (status) {
      case "complete":
        return "Aprovado";
      case "failed":
        return "Falhas Encontradas";
      case "pending":
        return "Pendente";
      default:
        return status || "Status desconhecido";
    }
  };

  // Agrupar itens por categoria
  const getItemsByCategory = () => {
    if (!checklist) return {};

    const categories: Record<string, { item: ChecklistItem, result: ChecklistResult }[]> = {};

    // Verificar se os itens existem
    if (!checklist.items || checklist.items.length === 0) {
      return {
        "Sem itens": [
          {
            item: {
              id: 0,
              templateId: checklist.templateId || 0,
              name: "Nenhum item de checklist encontrado",
              description: null,
              isRequired: false,
              category: null,
              order: null
            },
            result: {
              id: 0,
              checklistId: checklist.id,
              itemId: 0,
              status: "not_applicable",
              observation: null,
              photoUrl: null
            }
          }
        ]
      };
    }

    // Agregar itens por categoria
    checklist.items.forEach(item => {
      const category = item.category || "Sem categoria";
      if (!categories[category]) {
        categories[category] = [];
      }

      // Buscar o resultado correspondente ao item
      const result = checklist.results.find(r => r.itemId === item.id);

      // Se não encontrar um resultado, criar um resultado padrão
      const defaultResult: ChecklistResult = {
        id: 0,
        checklistId: checklist.id,
        itemId: item.id,
        status: "not_applicable",
        observation: null,
        photoUrl: null
      };

      categories[category].push({ 
        item, 
        result: result || defaultResult 
      });
    });

    return categories;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="text-center">
          <div className="mb-4">Carregando detalhes do checklist...</div>
        </div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-red-600 mb-2">Checklist não encontrado</h3>
          <p className="text-gray-600">O checklist solicitado não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="h-8 w-8 text-blue-700 mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold text-blue-900">Detalhes do Checklist</h2>
      </div>

      <Card className="overflow-hidden">
        <div className={`h-2 w-full ${
          checklist.status === "complete" ? "bg-green-500" : 
          checklist.status === "failed" ? "bg-red-500" : 
          "bg-yellow-500"
        }`}></div>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div>
              <CardTitle className="text-xl font-medium mb-2 text-blue-900">
                {checklist.template?.name || "Sem modelo"} - {formatDate(checklist.date)}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-gray-600 text-sm">
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
                  <Truck className="h-4 w-4 text-blue-700" />
                  <span className="font-medium">{checklist.vehicle?.name || "Veículo desconhecido"}</span>
                  <span className="text-gray-500">({checklist.vehicle?.plate || "N/A"})</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
                  <User className="h-4 w-4 text-blue-700" />
                  <span className="font-medium">{checklist.driver?.name || "Motorista desconhecido"}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
                  <span className="font-medium">{checklist.odometer || 0} km</span>
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-2 font-medium px-3 py-2 rounded-full ${
              checklist.status === "complete" ? "bg-green-100 text-green-800" : 
              checklist.status === "failed" ? "bg-red-100 text-red-800" : 
              "bg-yellow-100 text-yellow-800"
            }`}>
              {getChecklistStatusIcon(checklist.status)}
              <span>
                {getChecklistStatusText(checklist.status)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {checklist.observations && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"></path>
                  <path d="M9 9h1"></path>
                  <path d="M9 13h6"></path>
                  <path d="M9 17h6"></path>
                </svg>
                Observações gerais
              </h3>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-md border border-gray-100 shadow-sm">{checklist.observations}</p>
            </div>
          )}

          <div className="space-y-6">
            {Object.entries(getItemsByCategory()).map(([category, items]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-medium text-blue-900 flex items-center gap-2 mb-2 pb-1 border-b">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700">
                    <path d="m2 18 8-8 4 4 6-6 2 2-8 8-4-4-6 6-2-2Z"/>
                  </svg>
                  {category}
                </h3>
                <div className="space-y-4">
                  {items.map(({ item, result }: { item: ChecklistItem, result: ChecklistResult }) => (
                    <div key={item.id} className={`border rounded-lg p-4 ${
                      result.status === "ok" ? "border-l-4 border-l-green-500" : 
                      result.status === "issue" ? "border-l-4 border-l-red-500" : 
                      "border-l-4 border-l-yellow-500"
                    } hover:shadow-md transition-shadow duration-200`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`
                              px-2 py-1 rounded-full text-xs font-medium inline-flex items-center
                              ${result.status === "ok" ? "bg-green-100 text-green-800" : 
                                result.status === "issue" ? "bg-red-100 text-red-800" : 
                                "bg-yellow-100 text-yellow-800"}
                            `}>
                              {getStatusIcon(result.status)}
                              <span className="ml-1">{getStatusText(result.status)}</span>
                            </span>
                            <h4 className="font-medium text-blue-900">{item.name}</h4>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-md">{item.description}</p>
                          )}
                        </div>
                        {item.isRequired && (
                          <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Obrigatório
                          </span>
                        )}
                      </div>

                      {result.status === "issue" && (
                        <div className="mt-3 space-y-3">
                          {result.observation && (
                            <div className="bg-red-50 p-3 rounded-md border border-red-100">
                              <h5 className="text-sm font-semibold text-red-800 mb-1">Descrição do problema:</h5>
                              <p className="text-red-700 text-sm">{result.observation}</p>
                            </div>
                          )}

                          {result.photoUrl && (
                            <div>
                              <h5 className="text-sm font-medium mb-1 text-gray-700">Evidência fotográfica:</h5>
                              <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                                {result.photoUrl.startsWith("data:") ? (
                                  <img 
                                    src={result.photoUrl} 
                                    alt="Evidência do problema" 
                                    className="absolute inset-0 w-full h-full object-contain"
                                  />
                                ) : (
                                  <img 
                                    src={result.photoUrl} 
                                    alt="Evidência do problema" 
                                    className="absolute inset-0 w-full h-full object-contain"
                                    onClick={() => {
                                      // Abrir imagem em tamanho completo em uma nova aba
                                      window.open(result.photoUrl, '_blank');
                                    }}
                                    style={{ cursor: 'pointer' }}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.onerror = null;
                                      console.log("Erro ao carregar imagem:", result.photoUrl);

                                      // Tentativas de correção de caminho
                                      if (!result.photoUrl.startsWith("/")) {
                                        target.src = "/" + result.photoUrl;
                                      } else if (result.photoUrl && result.photoUrl.startsWith("/uploads/")) {
                                        // Se o caminho já começa com /uploads, tentar caminho absoluto
                                        target.src = result.photoUrl;
                                      } else {
                                        // Se todas as tentativas falham, mostrar mensagem de erro
                                        target.src = ""; // Limpa a src
                                        const parentElement = target.parentElement;
                                        if (parentElement) {
                                          parentElement.innerHTML = '<div class="absolute inset-0 flex items-center justify-center text-gray-400">Imagem não disponível ou corrompida</div>';
                                        }
                                      }
                                    }}
                                  />
                                )}
                                <div className="absolute bottom-2 right-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (result.photoUrl) {
                                        window.open(result.photoUrl, '_blank');
                                      }
                                    }}
                                    className="bg-white text-blue-700 p-1 rounded-full shadow-md"
                                    title="Ver em tamanho real"
                                    aria-label="Abrir imagem em tamanho real"
                                    className="bg-white text-blue-700 p-1 rounded-full shadow-md"
                                    title="Ver em tamanho real"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M15 3h6v6"></path>
                                      <path d="M10 14 21 3"></path>
                                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleBack}
          className="text-blue-700 border-blue-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Checklists
        </Button>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="border-amber-600 text-amber-600 hover:bg-amber-50"
            onClick={() => {
              // Redirecionar para a página de edição
              console.log("Editando checklist ID:", id);
              navigate(`/checklists/edit/${id}`);
            }}
          >
            Editar
          </Button>

          <Button 
            variant="outline" 
            className="border-red-600 text-red-600 hover:bg-red-50"
            onClick={async () => {
              const confirm = window.confirm("Tem certeza que deseja excluir este checklist?");

              if (confirm) {
                try {
                  console.log("Tentando excluir checklist ID:", id);
                  // Excluir o checklist usando a API
                  const response = await fetch(`/api/checklists/${id}`, {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  });

                  console.log("Resposta da exclusão:", response.status);

                  const responseText = await response.text();
                  console.log("Resposta completa:", responseText);

                  let responseData;
                  try {
                    responseData = JSON.parse(responseText);
                  } catch (e) {
                    console.log("Resposta não é JSON válido");
                  }

                  if (response.ok) {
                    toast({
                      title: "Sucesso",
                      description: "Checklist excluído com sucesso!",
                    });
                    // Redirecionar para a lista de checklists após um pequeno delay
                    setTimeout(() => {
                      navigate('/checklists');
                    }, 500);
                  } else {
                    throw new Error(responseData?.message || "Erro ao excluir checklist");
                  }
                } catch (error) {
                  console.error("Erro ao excluir checklist:", error);
                  toast({
                    title: "Erro",
                    description: error instanceof Error ? error.message : "Erro ao excluir checklist",
                    variant: "destructive",
                  });
                }
              }
            }}
          >
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}