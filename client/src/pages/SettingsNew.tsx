import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Palette, FileText } from "lucide-react";

export default function SettingsNew() {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Gerencie os dados do sistema</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="default"
          className="h-28 w-full flex flex-col items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setLocation("/checklist-templates")}
        >
          <ClipboardCheck className="h-8 w-8" />
          <span className="text-sm font-medium">Templates de Checklist</span>
        </Button>
        
        <Button
          variant="default"
          className="h-28 w-full flex flex-col items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setLocation("/configuracoes/app")}
        >
          <Palette className="h-8 w-8" />
          <span className="text-sm font-medium">Aparência do Sistema</span>
        </Button>
        
        <Button
          variant="default"
          className="h-28 w-full flex flex-col items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setLocation("/relatorios")}
        >
          <FileText className="h-8 w-8" />
          <span className="text-sm font-medium">Relatórios</span>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <h3 className="text-lg font-medium mb-2">Central de Cadastros</h3>
            <p className="text-muted-foreground mb-4">
              Agora você pode acessar todos os cadastros do sistema através do menu "Cadastros".
            </p>
            <Button 
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setLocation("/cadastros")}
            >
              Acessar Cadastros
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}