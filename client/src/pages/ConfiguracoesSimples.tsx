import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function ConfiguracoesSimples() {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Configure seu sistema</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">Sistema em manutenção</h3>
            <p className="text-muted-foreground mb-6">
              A seção de configurações está sendo atualizada para melhorar a experiência do usuário.
            </p>
            
            <Button 
              onClick={() => setLocation("/")}
              className="mx-auto"
            >
              Voltar para a Página Inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}