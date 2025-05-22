import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewFuelTypeForm } from "@/components/NewFuelTypeForm";
import { FuelType } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function NovaConfiguracao() {
  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Cadastre e gerencie os tipos de combustível</CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        <NewFuelTypeForm />
        <ListaTiposCombustivel />
      </div>
    </div>
  );
}

function ListaTiposCombustivel() {
  const { data: tipos = [], isLoading } = useQuery({
    queryKey: ["/api/fuel-types"],
    queryFn: async (): Promise<FuelType[]> => {
      const res = await fetch("/api/fuel-types");
      if (!res.ok) {
        throw new Error("Erro ao buscar tipos de combustível");
      }
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tipos de Combustível</CardTitle>
          <CardDescription>
            {tipos.length} tipo(s) de combustível cadastrado(s)
          </CardDescription>
        </div>
        <Badge variant="outline" className="ml-auto">Total: {tipos.length}</Badge>
      </CardHeader>
      <CardContent>
        {tipos.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Droplet className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum tipo de combustível cadastrado.</p>
            <p className="text-sm mt-1">Use o formulário acima para adicionar um novo tipo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tipos.map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Droplet className="h-4 w-4 mr-2" />
                        {tipo.name}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}