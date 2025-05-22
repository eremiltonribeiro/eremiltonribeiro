import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Palette, FileText } from "lucide-react";

export default function Settings() {
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
            <h3 className="text-lg font-medium mb-2">Configurações de Cadastro</h3>
            <p className="text-muted-foreground mb-4">
              A seção de cadastros está sendo atualizada para melhorar a experiência do usuário.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ConfigButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  accent?: boolean;
}

function ConfigButton({ icon, label, isActive, onClick, accent = false }: ConfigButtonProps) {
  return (
    <Button
      variant={isActive ? "default" : accent ? "default" : "outline"}
      className={`h-20 w-full flex flex-col items-center justify-center gap-1 p-2 ${
        accent ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
      }`}
      onClick={onClick}
    >
      <div className="h-5 w-5">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}

// Componente para listar veículos
function VehiclesList() {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null); // Usando o tipo Vehicle importado

  const { data: vehicles = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: async (): Promise<Vehicle[]> => { // Especificando o tipo de retorno
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/vehicles");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveVehicles(data);
            return data;
          }
        }
        return await offlineStorage.getVehicles();
      } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        return await offlineStorage.getVehicles();
      }
    }
  });

  const handleEdit = (vehicle: Vehicle) => { // Usando o tipo Vehicle importado
    setCurrentVehicle(vehicle);
    setEditMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este veículo?")) return;

    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: "Sucesso!",
          description: "Veículo excluído com sucesso.",
        });
        refetch();
      } else {
        throw new Error("Erro ao excluir veículo");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao excluir o veículo.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      {editMode && currentVehicle && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Edit className="h-4 w-4 mr-2" /> Editar Veículo
              </CardTitle>
              <CardDescription>Altere os dados do veículo abaixo</CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleForm
                editingVehicle={currentVehicle}
                onSuccess={() => {
                  setEditMode(false);
                  setCurrentVehicle(null);
                  refetch();
                }}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  setCurrentVehicle(null);
                }}
              >
                Cancelar Edição
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Veículos Cadastrados</CardTitle>
            <CardDescription>
              {vehicles.length} veículo(s) registrado(s) no sistema
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-auto">Total: {vehicles.length}</Badge>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum veículo cadastrado.</p>
              <p className="text-sm mt-1">Use o formulário acima para adicionar um novo veículo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle: Vehicle) => ( // Usando o tipo Vehicle importado
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Car className="h-4 w-4 mr-2" />
                          {vehicle.name}
                        </div>
                      </TableCell>
                      <TableCell>{vehicle.plate}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(vehicle)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(vehicle.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
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
    </>
  );
}

// Componente para listar motoristas
function DriversList() {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null); // Usando o tipo Driver importado

  const { data: drivers = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: async (): Promise<Driver[]> => { // Especificando o tipo de retorno
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/drivers");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveDrivers(data);
            return data;
          }
        }
        return await offlineStorage.getDrivers();
      } catch (error) {
        console.error("Erro ao buscar motoristas:", error);
        return await offlineStorage.getDrivers();
      }
    }
  });

  const handleEdit = (driver: Driver) => { // Usando o tipo Driver importado
    setCurrentDriver(driver);
    setEditMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este motorista?")) return;

    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: "Sucesso!",
          description: "Motorista excluído com sucesso.",
        });
        refetch();
      } else {
        throw new Error("Erro ao excluir motorista");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao excluir o motorista.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      {editMode && currentDriver && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Edit className="h-4 w-4 mr-2" /> Editar Motorista
              </CardTitle>
              <CardDescription>Altere os dados do motorista abaixo</CardDescription>
            </CardHeader>
            <CardContent>
              <DriverForm
                editingDriver={currentDriver}
                onSuccess={() => {
                  setEditMode(false);
                  setCurrentDriver(null);
                  refetch();
                }}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  setCurrentDriver(null);
                }}
              >
                Cancelar Edição
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Motoristas Cadastrados</CardTitle>
            <CardDescription>
              {drivers.length} motorista(s) registrado(s) no sistema
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-auto">Total: {drivers.length}</Badge>
        </CardHeader>
        <CardContent>
          {drivers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <UserCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum motorista cadastrado.</p>
              <p className="text-sm mt-1">Use o formulário acima para adicionar um novo motorista.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNH</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver: Driver) => ( // Usando o tipo Driver importado
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <UserCircle className="h-4 w-4 mr-2" />
                          {driver.name}
                        </div>
                      </TableCell>
                      <TableCell>{driver.license}</TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(driver)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(driver.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
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
    </>
  );
}

// Componente para listar postos de combustível
function FuelStationsList() {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [currentStation, setCurrentStation] = useState<FuelStation | null>(null); // Tipagem adicionada

  const { data: stations = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/fuel-stations"],
    queryFn: async (): Promise<FuelStation[]> => { // Especificando o tipo de retorno
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/fuel-stations");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveFuelStations(data);
            return data;
          }
        }
        return await offlineStorage.getFuelStations();
      } catch (error) {
        console.error("Erro ao buscar postos:", error);
        return await offlineStorage.getFuelStations();
      }
    }
  });

  const handleEdit = (station: FuelStation) => { // Tipagem adicionada
    setCurrentStation(station);
    setEditMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => { // Tipagem adicionada
    if (!confirm("Tem certeza que deseja excluir este posto?")) return;

    try {
      const res = await fetch(`/api/fuel-stations/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: "Sucesso!",
          description: "Posto excluído com sucesso.",
        });
        refetch();
      } else {
        throw new Error("Erro ao excluir posto");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao excluir o posto.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      {editMode && currentStation && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Edit className="h-4 w-4 mr-2" /> Editar Posto
              </CardTitle>
              <CardDescription>Altere os dados do posto abaixo</CardDescription>
            </CardHeader>
            <CardContent>
              <FuelStationForm
                editingStation={currentStation}
                onSuccess={() => {
                  setEditMode(false);
                  setCurrentStation(null);
                  refetch();
                }}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  setCurrentStation(null);
                }}
              >
                Cancelar Edição
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Postos Cadastrados</CardTitle>
            <CardDescription>
              {stations.length} posto(s) registrado(s) no sistema
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-auto">Total: {stations.length}</Badge>
        </CardHeader>
        <CardContent>
          {stations.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Fuel className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum posto cadastrado.</p>
              <p className="text-sm mt-1">Use o formulário acima para adicionar um novo posto.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stations.map((station: FuelStation) => ( // Tipagem adicionada
                    <TableRow key={station.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Fuel className="h-4 w-4 mr-2" />
                          {station.name}
                        </div>
                      </TableCell>
                      <TableCell>{station.address}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(station)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(station.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
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
    </>
  );
}

// Componente para listar tipos de combustível
function FuelTypesList() {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [currentType, setCurrentType] = useState<FuelType | null>(null); // Tipagem adicionada

  const { data: types = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/fuel-types"],
    queryFn: async (): Promise<FuelType[]> => { // Especificando o tipo de retorno
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/fuel-types");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveFuelTypes(data);
            return data;
          }
        }
        return await offlineStorage.getFuelTypes();
      } catch (error) {
        console.error("Erro ao buscar tipos de combustível:", error);
        return await offlineStorage.getFuelTypes();
      }
    }
  });

  const handleEdit = (type: FuelType) => { // Tipagem adicionada
    setCurrentType(type);
    setEditMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => { // Tipagem adicionada
    if (!confirm("Tem certeza que deseja excluir este tipo de combustível?")) return;

    try {
      const res = await fetch(`/api/fuel-types/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: "Sucesso!",
          description: "Tipo de combustível excluído com sucesso.",
        });
        refetch();
      } else {
        throw new Error("Erro ao excluir tipo de combustível");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao excluir o tipo de combustível.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      {editMode && currentType && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Edit className="h-4 w-4 mr-2" /> Editar Tipo de Combustível
              </CardTitle>
              <CardDescription>Altere os dados do tipo de combustível abaixo</CardDescription>
            </CardHeader>
            <CardContent>
              <FuelTypeForm
                editingType={currentType}
                onSuccess={() => {
                  setEditMode(false);
                  setCurrentType(null);
                  refetch();
                }}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  setCurrentType(null);
                }}
              >
                Cancelar Edição
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tipos de Combustível</CardTitle>
            <CardDescription>
              {types.length} tipo(s) de combustível registrado(s)
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-auto">Total: {types.length}</Badge>
        </CardHeader>
        <CardContent>
          {types.length === 0 ? (
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
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map((type: FuelType) => ( // Tipagem adicionada
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Droplet className="h-4 w-4 mr-2" />
                          {type.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(type)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(type.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
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
    </>
  );
}

// Componente para listar tipos de manutenção
function MaintenanceTypesList() {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [currentType, setCurrentType] = useState<MaintenanceType | null>(null); // Tipagem adicionada

  const { data: types = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/maintenance-types"],
    queryFn: async (): Promise<MaintenanceType[]> => { // Especificando o tipo de retorno
      try {
        if (navigator.onLine) {
          const res = await fetch("/api/maintenance-types");
          if (res.ok) {
            const data = await res.json();
            await offlineStorage.saveMaintenanceTypes(data);
            return data;
          }
        }
        return await offlineStorage.getMaintenanceTypes();
      } catch (error) {
        console.error("Erro ao buscar tipos de manutenção:", error);
        return await offlineStorage.getMaintenanceTypes();
      }
    }
  });

  const handleEdit = (type: MaintenanceType) => { // Tipagem adicionada
    setCurrentType(type);
    setEditMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => { // Tipagem adicionada
    if (!confirm("Tem certeza que deseja excluir este tipo de manutenção?")) return;

    try {
      const res = await fetch(`/api/maintenance-types/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: "Sucesso!",
          description: "Tipo de manutenção excluído com sucesso.",
        });
        refetch();
      } else {
        throw new Error("Erro ao excluir tipo de manutenção");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro!",
        description: "Ocorreu um erro ao excluir o tipo de manutenção.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      {editMode && currentType && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Edit className="h-4 w-4 mr-2" /> Editar Tipo de Manutenção
              </CardTitle>
              <CardDescription>Altere os dados do tipo de manutenção abaixo</CardDescription>
            </CardHeader>
            <CardContent>
              <MaintenanceTypeForm
                editingType={currentType}
                onSuccess={() => {
                  setEditMode(false);
                  setCurrentType(null);
                  refetch();
                }}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  setCurrentType(null);
                }}
              >
                Cancelar Edição
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tipos de Manutenção</CardTitle>
            <CardDescription>
              {types.length} tipo(s) de manutenção registrado(s)
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-auto">Total: {types.length}</Badge>
        </CardHeader>
        <CardContent>
          {types.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum tipo de manutenção cadastrado.</p>
              <p className="text-sm mt-1">Use o formulário acima para adicionar um novo tipo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map((type: MaintenanceType) => ( // Tipagem adicionada
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Wrench className="h-4 w-4 mr-2" />
                          {type.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(type)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(type.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
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
    </>
  );
}