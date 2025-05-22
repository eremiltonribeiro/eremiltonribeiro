import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { brandColors } from "@/lib/colors";
import { useLocation } from "wouter";
import { useAuth } from "@/App";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  
  // Redirecionar para a página principal se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Verificar se é o usuário admin padrão
      if (username === "admin" && password === "admin") {
        // Dados do usuário admin
        const userData = {
          id: "1",
          name: "Administrador",
          username: "admin",
          role: "admin"
        };
        
        // Mostrar toast de sucesso
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo ao sistema de gestão de frota!",
          variant: "default",
        });
        
        // Autenticar e redirecionar 
        login(userData);
        
        // Forçar a atualização direta do localStorage
        window.localStorage.setItem("authenticated", "true");
        window.localStorage.setItem("user", JSON.stringify(userData));
        
        // Redirecionar para a página inicial
        window.location.href = "/";
        return;
      } 
      
      // Verificar se é um usuário armazenado localmente
      const storedUsers = JSON.parse(localStorage.getItem("appUsers") || "{}");
      const userInfo = storedUsers[username];
      
      if (userInfo && userInfo.password === password) {
        // Criar objeto de usuário
        const userData = {
          id: userInfo.id,
          name: userInfo.name,
          username: username,
          role: userInfo.role
        };
        
        // Mostrar toast de sucesso
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo ao sistema de gestão de frota!",
          variant: "default",
        });
        
        // Autenticar e redirecionar
        login(userData);
        
        // Forçar a atualização direta do localStorage
        window.localStorage.setItem("authenticated", "true");
        window.localStorage.setItem("user", JSON.stringify(userData));
        
        // Redirecionar para a página inicial
        window.location.href = "/";
        return;
      } else {
        setError("Usuário ou senha incorretos");
        toast({
          title: "Falha no login",
          description: "Usuário ou senha incorretos. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setError("Erro ao realizar login. Tente novamente.");
      toast({
        title: "Erro no sistema",
        description: "Ocorreu um erro ao processar o login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <Card className="max-w-md w-full shadow-lg border-t-4" style={{ borderTopColor: brandColors.navyBlue }}>
        <CardHeader className="space-y-3">
          <div className="mx-auto text-center">
            <img 
              src="/logo-granduvale.svg" 
              alt="Granduvale Mineração" 
              className="h-24 mx-auto mb-2"
            />
          </div>
          <CardTitle className="text-xl text-center text-blue-900">Sistema de Gestão de Frota</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Acesse sua conta para gerenciar veículos, registros de abastecimento, manutenções e viagens e teste.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input 
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            
            <Button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 hover:bg-blue-700 text-white"
              size="lg"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </span>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center text-sm text-gray-500">
          <div className="text-center">
            <p>Usuário e senha padrão: <strong>admin</strong></p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}