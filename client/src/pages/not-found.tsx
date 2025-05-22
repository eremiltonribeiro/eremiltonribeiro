import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex items-center mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Página Não Encontrada</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            A página que você está procurando não existe ou foi removida.
          </p>
          
          <div className="mt-6">
            <Link href="/">
              <Button className="w-full">Voltar para a página inicial</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
