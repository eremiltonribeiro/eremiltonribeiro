import { useState, useEffect, ChangeEvent } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Palette, Image } from "lucide-react";

// Interface para temas de cores
interface ColorTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  preview: JSX.Element;
}

// Interface para configurações do app
interface AppConfig {
  logoUrl: string;
  companyName: string;
  colorTheme: string;
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Temas de cores predefinidos
const colorThemes: ColorTheme[] = [
  {
    id: "blue",
    name: "Azul (Padrão)",
    primary: "#1e40af",
    secondary: "#1d4ed8",
    accent: "#fbbf24",
    preview: (
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-800"></div>
        <div className="w-8 h-8 rounded-full bg-blue-700"></div>
        <div className="w-8 h-8 rounded-full bg-amber-400"></div>
      </div>
    )
  },
  {
    id: "green",
    name: "Verde",
    primary: "#15803d",
    secondary: "#16a34a",
    accent: "#fbbf24",
    preview: (
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-green-700"></div>
        <div className="w-8 h-8 rounded-full bg-green-600"></div>
        <div className="w-8 h-8 rounded-full bg-amber-400"></div>
      </div>
    )
  },
  {
    id: "purple",
    name: "Roxo",
    primary: "#7e22ce",
    secondary: "#9333ea",
    accent: "#2563eb",
    preview: (
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-purple-700"></div>
        <div className="w-8 h-8 rounded-full bg-purple-600"></div>
        <div className="w-8 h-8 rounded-full bg-blue-600"></div>
      </div>
    )
  },
  {
    id: "gray",
    name: "Cinza",
    primary: "#334155",
    secondary: "#475569",
    accent: "#f59e0b",
    preview: (
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-700"></div>
        <div className="w-8 h-8 rounded-full bg-slate-600"></div>
        <div className="w-8 h-8 rounded-full bg-amber-500"></div>
      </div>
    )
  },
  {
    id: "custom",
    name: "Personalizado",
    primary: "#000000",
    secondary: "#333333",
    accent: "#ffffff",
    preview: (
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500"></div>
      </div>
    )
  }
];

export default function AppConfig() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("appearance");
  const [selectedTheme, setSelectedTheme] = useState("blue");
  const [customColors, setCustomColors] = useState({
    primary: "#1e40af",
    secondary: "#1d4ed8",
    accent: "#fbbf24"
  });
  const [companyName, setCompanyName] = useState("Granduvale Mineração");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  
  // Carregar configurações salvas
  useEffect(() => {
    const savedConfig = localStorage.getItem("appConfig");
    if (savedConfig) {
      try {
        const config: AppConfig = JSON.parse(savedConfig);
        setSelectedTheme(config.colorTheme || "blue");
        setCompanyName(config.companyName || "Granduvale Mineração");
        setLogoUrl(config.logoUrl || "");
        
        // Mostrar logo salvo
        if (config.logoUrl) {
          setLogoPreview(config.logoUrl);
        }
        
        // Carregar cores personalizadas
        if (config.colorTheme === "custom" && config.customColors) {
          setCustomColors({
            primary: config.customColors.primary,
            secondary: config.customColors.secondary,
            accent: config.customColors.accent
          });
        }
        
        // Aplicar tema na página
        applyTheme(config.colorTheme, config.customColors);
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      }
    }
  }, []);
  
  // Função para aplicar o tema na página
  const applyTheme = (themeId: string, customThemeColors?: { primary: string, secondary: string, accent: string }) => {
    let theme = colorThemes.find(t => t.id === themeId);
    if (!theme) theme = colorThemes[0];
    
    const colors = themeId === "custom" && customThemeColors ? customThemeColors : theme;
    
    // Aplicar cores ao documento
    document.documentElement.style.setProperty('--color-primary', colors.primary);
    document.documentElement.style.setProperty('--color-secondary', colors.secondary);
    document.documentElement.style.setProperty('--color-accent', colors.accent);
    
    // Aplicar classes CSS aos elementos específicos
    const sideNav = document.querySelector('.side-navigation') as HTMLElement;
    if (sideNav) {
      sideNav.style.background = `linear-gradient(to bottom, ${colors.primary}, ${colors.secondary})`;
    }
    
    // Atualizar botões primários
    const primaryButtons = document.querySelectorAll('.bg-blue-700, .bg-blue-800') as NodeListOf<HTMLElement>;
    primaryButtons.forEach(button => {
      button.style.backgroundColor = colors.primary;
    });
    
    // Atualizar cores de texto nos cabeçalhos
    const headings = document.querySelectorAll('h1, h2, h3') as NodeListOf<HTMLElement>;
    headings.forEach(heading => {
      if (heading.className.includes('text-blue-900')) {
        heading.style.color = colors.primary;
      }
    });
  };
  
  // Quando o usuário seleciona um tema
  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    
    // Aplicar tema imediatamente para visualização
    const theme = colorThemes.find(t => t.id === themeId);
    if (theme && themeId !== "custom") {
      applyTheme(themeId);
    } else if (themeId === "custom") {
      applyTheme("custom", customColors);
    }
    
    setHasChanges(true);
  };
  
  // Quando o usuário altera cores personalizadas
  const handleCustomColorChange = (colorKey: string, value: string) => {
    setCustomColors(prev => {
      const updated = { ...prev, [colorKey]: value };
      
      // Se o tema personalizado estiver selecionado, aplicar as cores imediatamente
      if (selectedTheme === "custom") {
        applyTheme("custom", updated);
      }
      
      return updated;
    });
    
    setHasChanges(true);
  };
  
  // Quando o usuário faz upload de um logo
  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verificar tipo e tamanho
    if (!file.type.includes('image/')) {
      toast({
        title: "Formato inválido",
        description: "O arquivo deve ser uma imagem (PNG, JPG, SVG)",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 2MB",
        variant: "destructive",
      });
      return;
    }
    
    // Ler e salvar o arquivo como data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreview(dataUrl);
      setLogoUrl(dataUrl);
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
  };
  
  // Salvar configurações
  const saveConfig = () => {
    try {
      const config: AppConfig = {
        logoUrl,
        companyName,
        colorTheme: selectedTheme,
      };
      
      // Incluir cores personalizadas se o tema for personalizado
      if (selectedTheme === "custom") {
        config.customColors = { ...customColors };
      }
      
      // Salvar no localStorage
      localStorage.setItem("appConfig", JSON.stringify(config));
      
      // Aplicar tema
      applyTheme(selectedTheme, customColors);
      
      // Atualizar logo e nome da empresa em tempo real
      document.querySelectorAll('.company-name').forEach(el => {
        (el as HTMLElement).innerText = companyName;
      });
      
      if (logoUrl) {
        document.querySelectorAll('.company-logo').forEach(el => {
          (el as HTMLImageElement).src = logoUrl;
        });
      }
      
      toast({
        title: "Configurações salvas",
        description: "As alterações foram aplicadas com sucesso",
      });
      
      setHasChanges(false);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLocation("/configuracoes")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold text-blue-900">Configurações do Aplicativo</h2>
        </div>
        
        <Button
          onClick={saveConfig}
          className="bg-blue-700 hover:bg-blue-800"
          disabled={!hasChanges}
        >
          Salvar Alterações
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Personalize seu sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-4">
            Ajuste a aparência do sistema conforme a identidade visual de sua empresa.
          </p>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span>Cores e Tema</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span>Logo e Marca</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="appearance" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Escolha o esquema de cores</h3>
                
                <RadioGroup 
                  value={selectedTheme} 
                  onValueChange={handleThemeChange}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {colorThemes.map((theme) => (
                    <div key={theme.id} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={theme.id} 
                        id={`theme-${theme.id}`} 
                        className="border-2 border-gray-200 data-[state=checked]:border-blue-500"
                      />
                      <Label 
                        htmlFor={`theme-${theme.id}`}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        {theme.preview}
                        <span>{theme.name}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              {selectedTheme === "custom" && (
                <div className="space-y-4">
                  <Separator />
                  <h3 className="text-lg font-medium mb-4">Personalize as cores</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Cor Primária</Label>
                      <div className="flex gap-2 items-center">
                        <div 
                          className="w-8 h-8 rounded-full border border-gray-300" 
                          style={{ backgroundColor: customColors.primary }}
                        />
                        <Input
                          id="primaryColor"
                          type="color"
                          value={customColors.primary}
                          onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Cor Secundária</Label>
                      <div className="flex gap-2 items-center">
                        <div 
                          className="w-8 h-8 rounded-full border border-gray-300" 
                          style={{ backgroundColor: customColors.secondary }}
                        />
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={customColors.secondary}
                          onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Cor de Destaque</Label>
                      <div className="flex gap-2 items-center">
                        <div 
                          className="w-8 h-8 rounded-full border border-gray-300" 
                          style={{ backgroundColor: customColors.accent }}
                        />
                        <Input
                          id="accentColor"
                          type="color"
                          value={customColors.accent}
                          onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg mt-4">
                    <h4 className="text-sm font-medium mb-2">Visualização</h4>
                    <div className="flex flex-wrap gap-4">
                      <div 
                        className="p-4 rounded-lg text-white flex items-center justify-center"
                        style={{ backgroundColor: customColors.primary }}
                      >
                        Texto Primário
                      </div>
                      <div 
                        className="p-4 rounded-lg text-white flex items-center justify-center"
                        style={{ backgroundColor: customColors.secondary }}
                      >
                        Texto Secundário
                      </div>
                      <div 
                        className="p-4 rounded-lg text-gray-800 flex items-center justify-center"
                        style={{ backgroundColor: customColors.accent }}
                      >
                        Destaque
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="branding" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Logo e Nome da Empresa</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="block text-base">Logo da Empresa</Label>
                    <div className="flex justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                      {logoPreview ? (
                        <div className="flex flex-col items-center gap-4">
                          <img 
                            src={logoPreview} 
                            alt="Logo Preview" 
                            className="max-h-32 max-w-full object-contain"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                            size="sm"
                          >
                            Alterar Logo
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <div className="bg-gray-100 p-4 rounded-full">
                            <Upload className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500 mb-2">
                              Arraste e solte ou clique para fazer upload
                            </p>
                            <p className="text-xs text-gray-400">
                              PNG, JPG ou SVG (máx. 2MB)
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                            size="sm"
                          >
                            Selecionar Arquivo
                          </Button>
                        </div>
                      )}
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      O logo será exibido no cabeçalho e em relatórios exportados.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Nome da Empresa</Label>
                      <Input
                        id="company-name"
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          setHasChanges(true);
                        }}
                        placeholder="Digite o nome da empresa"
                      />
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg mt-8">
                      <h4 className="text-sm font-medium mb-4">Visualização</h4>
                      <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 rounded-lg flex items-center gap-4">
                        {logoPreview ? (
                          <img 
                            src={logoPreview} 
                            alt="Logo Preview" 
                            className="max-h-10 max-w-16 object-contain"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-white/20 rounded-md flex items-center justify-center">
                            <span className="text-white text-xs">Logo</span>
                          </div>
                        )}
                        <span className="text-white font-medium">{companyName || "Nome da Empresa"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}