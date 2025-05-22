import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Car, BarChart2, Settings, History, Plus, FileText, CheckSquare } from "lucide-react";

export default function Welcome() {
  const [_, setLocation] = useLocation();
  
  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-none bg-gradient-to-r from-blue-900 to-blue-950 text-white">
        <CardHeader className="py-6">
          <CardTitle className="text-2xl md:text-3xl font-bold flex flex-wrap items-center gap-3 break-words">
            <Car className="h-8 w-8 flex-shrink-0" />
            <span className="break-words">Sistema de Gestão de Frotas</span>
          </CardTitle>
          <CardDescription className="text-yellow-300 text-base md:text-lg break-words max-w-full">
            Controle completo de abastecimentos, manutenções e viagens da sua frota
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="overflow-hidden border-2 hover:border-blue-700 transition-all h-full">
          <CardHeader className="bg-blue-50 pb-2">
            <CardTitle className="text-xl font-semibold flex flex-wrap items-center gap-2 break-words">
              <Plus className="h-5 w-5 text-blue-700 flex-shrink-0" />
              <span className="break-words">Novo Registro</span>
            </CardTitle>
            <CardDescription className="text-blue-700/80 break-words">
              Registrar abastecimento, manutenção ou viagem
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-700 mb-4">
              Registre informações detalhadas sobre abastecimentos, manutenções realizadas ou viagens com os veículos da frota.
            </p>
            <Button 
              className="w-full" 
              onClick={() => setLocation("/registros")}
              style={{ backgroundColor: '#12305D' }}
            >
              Adicionar Registro
            </Button>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-2 hover:border-blue-700 transition-all h-full">
          <CardHeader className="bg-blue-50 pb-2">
            <CardTitle className="text-xl font-semibold flex flex-wrap items-center gap-2 break-words">
              <CheckSquare className="h-5 w-5 text-blue-700 flex-shrink-0" />
              <span className="break-words">Checklist de Veículos</span>
            </CardTitle>
            <CardDescription className="text-blue-700/80 break-words">
              Inspeção e verificação de segurança
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-700 mb-4">
              Realize verificações periódicas de segurança e manutenção nos veículos com checklists customizáveis.
            </p>
            <Button 
              className="w-full" 
              onClick={() => setLocation("/checklists")}
              style={{ backgroundColor: '#12305D' }}
            >
              Realizar Checklist
            </Button>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-2 hover:border-blue-700 transition-all h-full">
          <CardHeader className="bg-blue-50 pb-2">
            <CardTitle className="text-xl font-semibold flex flex-wrap items-center gap-2 break-words">
              <History className="h-5 w-5 text-blue-700 flex-shrink-0" />
              <span className="break-words">Histórico</span>
            </CardTitle>
            <CardDescription className="text-blue-700/80 break-words">
              Consultar registros anteriores
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-700 mb-4">
              Visualize todos os registros anteriores com filtragem por veículo, período, motorista e tipo de registro.
            </p>
            <Button 
              className="w-full" 
              onClick={() => setLocation("/registros/history")}
              style={{ backgroundColor: '#12305D' }}
            >
              Ver Histórico
            </Button>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-2 hover:border-blue-700 transition-all h-full">
          <CardHeader className="bg-blue-50 pb-2">
            <CardTitle className="text-xl font-semibold flex flex-wrap items-center gap-2 break-words">
              <BarChart2 className="h-5 w-5 text-blue-700 flex-shrink-0" />
              <span className="break-words">Dashboard</span>
            </CardTitle>
            <CardDescription className="text-blue-700/80 break-words">
              Análises e estatísticas da frota
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-700 mb-4">
              Visualize indicadores de desempenho, gráficos de consumo, alertas de manutenção e previsões de gastos.
            </p>
            <Button 
              className="w-full" 
              onClick={() => setLocation("/registros/dashboard")}
              style={{ backgroundColor: '#12305D' }}
            >
              Acessar Dashboard
            </Button>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-2 hover:border-blue-700 transition-all h-full">
          <CardHeader className="bg-blue-50 pb-2">
            <CardTitle className="text-xl font-semibold flex flex-wrap items-center gap-2 break-words">
              <Settings className="h-5 w-5 text-blue-700 flex-shrink-0" />
              <span className="break-words">Configurações</span>
            </CardTitle>
            <CardDescription className="text-blue-700/80 break-words">
              Cadastro de veículos e informações
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-700 mb-4">
              Cadastre veículos, motoristas, postos de combustível, tipos de combustível e serviços de manutenção.
            </p>
            <Button 
              className="w-full" 
              onClick={() => setLocation("/configuracoes")}
              style={{ backgroundColor: '#12305D' }}
            >
              Configurar Sistema
            </Button>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-2 hover:border-blue-700 transition-all h-full">
          <CardHeader className="bg-blue-50 pb-2">
            <CardTitle className="text-xl font-semibold flex flex-wrap items-center gap-2 break-words">
              <FileText className="h-5 w-5 text-blue-700 flex-shrink-0" />
              <span className="break-words">Relatórios</span>
            </CardTitle>
            <CardDescription className="text-blue-700/80 break-words">
              Relatórios e exportação de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-700 mb-4">
              Gere relatórios detalhados de consumo, manutenções e custos. Exporte dados para análises externas.
            </p>
            <Button 
              className="w-full" 
              style={{ backgroundColor: '#B89B1C', color: 'white' }}
              onClick={() => setLocation("/relatorios")}
            >
              Gerar Relatórios
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}