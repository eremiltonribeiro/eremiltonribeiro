import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Droplet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export function NewFuelTypeForm() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validação simples
    if (!name || name.trim() === "") {
      setError("O nome do combustível é obrigatório");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      // Enviar dados de forma simples e direta
      const response = await fetch('/api/fuel-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar tipo de combustível');
      }
      
      // Sucesso
      toast({
        title: "Sucesso!",
        description: "Tipo de combustível cadastrado com sucesso.",
      });
      
      // Limpar formulário
      setName("");
      
      // Atualizar a lista de tipos (se necessário, atualize a página)
      window.location.reload();
    } catch (error: any) {
      console.error("Erro ao criar tipo de combustível:", error);
      toast({
        title: "Erro!",
        description: error.message || "Ocorreu um erro ao cadastrar o tipo de combustível.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="h-5 w-5" />
          Novo Tipo de Combustível
        </CardTitle>
        <CardDescription>
          Cadastre um novo tipo de combustível para abastecimentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Combustível*</Label>
            <Input 
              id="name"
              placeholder="Ex: Gasolina Comum" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Nome do tipo de combustível para abastecimento
            </p>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-1"
            >
              {loading ? (
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
      </CardContent>
    </Card>
  );
}