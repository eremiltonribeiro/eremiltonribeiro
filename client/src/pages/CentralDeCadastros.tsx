import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Car, UserCircle, Fuel, Droplet, Wrench } from "lucide-react";
import { CadastroVeiculos } from "@/components/cadastros/CadastroVeiculos";
import { CadastroMotoristas } from "@/components/cadastros/CadastroMotoristas";
import { CadastroPostos } from "@/components/cadastros/CadastroPostos";
import { CadastroTiposCombustivel } from "@/components/cadastros/CadastroTiposCombustivel";
import { CadastroTiposManutencao } from "@/components/cadastros/CadastroTiposManutencao";

export default function CentralDeCadastros() {
  const [activeTab, setActiveTab] = useState("veiculos");

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Central de Cadastros</CardTitle>
          <CardDescription>Gerencie todos os cadastros do sistema</CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="veiculos" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            <span className="hidden sm:inline">Veículos</span>
          </TabsTrigger>
          <TabsTrigger value="motoristas" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Motoristas</span>
          </TabsTrigger>
          <TabsTrigger value="postos" className="flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            <span className="hidden sm:inline">Postos</span>
          </TabsTrigger>
          <TabsTrigger value="combustiveis" className="flex items-center gap-2">
            <Droplet className="h-4 w-4" />
            <span className="hidden sm:inline">Combustíveis</span>
          </TabsTrigger>
          <TabsTrigger value="manutencoes" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Manutenções</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="veiculos" className="mt-0">
          <CadastroVeiculos />
        </TabsContent>
        
        <TabsContent value="motoristas" className="mt-0">
          <CadastroMotoristas />
        </TabsContent>
        
        <TabsContent value="postos" className="mt-0">
          <CadastroPostos />
        </TabsContent>
        
        <TabsContent value="combustiveis" className="mt-0">
          <CadastroTiposCombustivel />
        </TabsContent>
        
        <TabsContent value="manutencoes" className="mt-0">
          <CadastroTiposManutencao />
        </TabsContent>
      </Tabs>
    </div>
  );
}