import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useVehicleRegistrations } from "@/hooks/use-vehicle-registrations";
import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { jsPDF } from "jspdf";

export function SimpleReportGenerator() {
  const [reportType, setReportType] = useState<"all" | "fuel" | "maintenance" | "trip">("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const { registrations } = useVehicleRegistrations();

  // Função para obter o nome amigável do tipo de relatório
  const getReportTypeName = (type: string): string => {
    switch (type) {
      case "fuel": return "Abastecimentos";
      case "maintenance": return "Manutenções";
      case "trip": return "Viagens";
      default: return "Todos os Registros";
    }
  };

  // Função para preparar os dados baseados nos filtros
  const prepareReportData = () => {
    // Início da filtragem por tipo
    let filteredData = [...registrations];

    if (reportType !== "all") {
      filteredData = filteredData.filter(reg => reg.type === reportType);
    }

    // Filtragem por data
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);

      filteredData = filteredData.filter(reg => {
        const regDate = new Date(reg.date);
        return regDate >= fromDate;
      });
    }

    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);

      filteredData = filteredData.filter(reg => {
        const regDate = new Date(reg.date);
        return regDate <= toDate;
      });
    }

    // Formatar datas para exibição
    return filteredData.map(reg => ({
      ...reg,
      formattedDate: formatDate(reg.date),
      vehicleName: reg.vehicle?.name || "N/A",
      driverName: reg.driver?.name || "N/A",
      fuelStation: reg.fuelStation?.name,
      fuelType: reg.fuelType?.name,
      maintenanceType: reg.maintenanceType?.name
    }));
  };

  // Gerar relatório em CSV
  const generateCSVReport = () => {
    const filteredData = prepareReportData();

    // Diferentes cabeçalhos e campos para cada tipo de relatório
    let headers: string[] = [];
    let dataRows: string[][] = [];

    switch (reportType) {
      case "fuel":
        headers = ["Data", "Veículo", "Motorista", "Posto", "Combustível", "Litros", "Preço/L", "Valor Total", "Km"];
        dataRows = filteredData.map(reg => [
          reg.formattedDate,
          reg.vehicleName,
          reg.driverName,
          reg.fuelStation || "",
          reg.fuelType || "",
          (reg.liters || "").toString(),
          formatCurrency(reg.fuelPrice || 0),
          formatCurrency(reg.fuelCost || 0),
          (reg.odometer || "").toString()
        ]);
        break;

      case "maintenance":
        headers = ["Data", "Veículo", "Motorista", "Tipo", "Descrição", "Valor", "Km"];
        dataRows = filteredData.map(reg => [
          reg.formattedDate,
          reg.vehicleName,
          reg.driverName,
          reg.maintenanceType || "",
          reg.maintenanceDescription || "",
          formatCurrency(reg.maintenanceCost || 0),
          (reg.odometer || "").toString()
        ]);
        break;

      case "trip":
        headers = ["Data", "Veículo", "Motorista", "Origem", "Destino", "Km Inicial", "Km Final", "Distância"];
        dataRows = filteredData.map(reg => [
          reg.formattedDate,
          reg.vehicleName,
          reg.driverName,
          reg.origin || "",
          reg.destination || "",
          (reg.startOdometer || "").toString(),
          (reg.endOdometer || "").toString(),
          ((reg.endOdometer || 0) - (reg.startOdometer || 0)).toString()
        ]);
        break;

      default:
        headers = ["Data", "Veículo", "Motorista", "Tipo", "Descrição", "Valor"];
        dataRows = filteredData.map(reg => {
          const description = reg.type === "fuel" ? `Abastecimento: ${reg.fuelType}` : 
                            reg.type === "maintenance" ? `Manutenção: ${reg.maintenanceDescription}` :
                            reg.type === "trip" ? `Viagem: ${reg.origin} -> ${reg.destination}` : "";

          const cost = reg.type === "fuel" ? reg.fuelCost : 
                     reg.type === "maintenance" ? reg.maintenanceCost : 0;

          return [
            reg.formattedDate,
            reg.vehicleName,
            reg.driverName,
            getReportTypeName(reg.type || ""),
            description,
            formatCurrency(cost || 0)
          ];
        });
    }

    // Criar conteúdo CSV
    let csvContent = headers.join(",") + "\n";

    dataRows.forEach(row => {
      // Tratar células com vírgulas adicionando aspas
      const processedRow = row.map(cell => {
        // Verificar se a célula contém vírgula ou aspas
        if (cell.includes(",") || cell.includes('"')) {
          // Escapar aspas duplicando-as e envolver em aspas
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      });

      csvContent += processedRow.join(",") + "\n";
    });

    // Criar um Blob e fazer download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Função simplificada para gerar PDF
  const generatePDFReport = () => {
    setIsGenerating(true);

    try {
      console.log("Iniciando geração de PDF...");

      // Criar documento PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Configurações básicas
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const filteredData = prepareReportData();

      console.log(`Dados filtrados: ${filteredData.length} registros`);

      // Cores da Granduvale
      const blue = [18, 30, 61]; // RGB para azul
      const gold = [220, 180, 40]; // RGB para dourado

      // Cabeçalho
      doc.setFillColor(blue[0], blue[1], blue[2]);
      doc.rect(0, 0, pageWidth, 25, 'F');

      // Título principal
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('GRANDUVALE MINERAÇÃO', margin, 10);

      // Subtítulo
      doc.setTextColor(gold[0], gold[1], gold[2]);
      doc.setFontSize(10);
      doc.text('Sistema de Gestão de Frota', margin, 18);

      // Título do relatório
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Relatório de ${getReportTypeName(reportType)}`, margin, 35);

      // Informações do relatório
      doc.setFontSize(9);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, 42);

      // Período do relatório
      const periodoTexto = dateRange.from 
        ? `${format(dateRange.from, "dd/MM/yyyy")}${dateRange.to ? ` a ${format(dateRange.to, "dd/MM/yyyy")}` : ""}` 
        : "Todo o período";
      doc.text(`Período: ${periodoTexto}`, margin, 48);

      // Linha separadora
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, 52, pageWidth - margin, 52);

      // Configuração para tabela de dados
      const startY = 60;
      const lineHeight = 8;

      // Definir cabeçalhos baseados no tipo de relatório
      let headers = [];
      switch (reportType) {
        case "fuel":
          headers = ["Data", "Veículo", "Motorista", "Posto", "Combustível", "Litros", "Valor"];
          break;
        case "maintenance":
          headers = ["Data", "Veículo", "Motorista", "Tipo", "Descrição", "Valor"];
          break;
        case "trip":
          headers = ["Data", "Veículo", "Motorista", "Origem", "Destino", "Distância"];
          break;
        default:
          headers = ["Data", "Veículo", "Motorista", "Tipo", "Descrição", "Valor"];
      }

      // Calcular largura das colunas
      const colWidth = (pageWidth - 2 * margin) / headers.length;

      // Desenhar cabeçalho da tabela
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, startY - 6, pageWidth - 2 * margin, 6, 'F');

      // Textos do cabeçalho
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(blue[0], blue[1], blue[2]);
      headers.forEach((header, i) => {
        doc.text(header, margin + i * colWidth, startY - 2);
      });

      // Limitar a 15 registros para evitar problemas de memória
      const maxRows = Math.min(filteredData.length, 15);

      // Desenhar linhas de dados
      doc.setFont('helvetica', 'normal');
      let currentY = startY + 5;

      for (let i = 0; i < maxRows; i++) {
        const reg = filteredData[i];

        // Verificar se o registro existe
        if (!reg) {
          console.warn(`Registro ${i} é undefined ou null`);
          continue;
        }

        // Alternar cores das linhas
        if (i % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(margin, currentY - 5, pageWidth - 2 * margin, lineHeight, 'F');
        }

        // Preparar células com base no tipo de registro
        let rowData = [];
        try {
          if (reportType === "fuel" || reg.type === "fuel") {
            rowData = [
              reg.formattedDate || format(new Date(reg.date || new Date()), "dd/MM/yyyy"),
              (reg.vehicleName || "N/A").substring(0, 12),
              (reg.driverName || "N/A").substring(0, 12),
              (reg.fuelStation || "N/A").substring(0, 10),
              (reg.fuelType || "N/A").substring(0, 8),
              (reg.liters || "0").toString(),
              formatCurrency(reg.fuelCost || 0)
            ];
          } else if (reportType === "maintenance" || reg.type === "maintenance") {
            rowData = [
              reg.formattedDate || format(new Date(reg.date || new Date()), "dd/MM/yyyy"),
              (reg.vehicleName || "N/A").substring(0, 12),
              (reg.driverName || "N/A").substring(0, 12),
              (reg.maintenanceType || "N/A").substring(0, 10),
              (reg.maintenanceDescription || "").substring(0, 15),
              formatCurrency(reg.maintenanceCost || 0)
            ];
          } else if (reportType === "trip" || reg.type === "trip") {
            const distance = (reg.endOdometer || 0) - (reg.startOdometer || 0);
            rowData = [
              reg.formattedDate || format(new Date(reg.date || new Date()), "dd/MM/yyyy"),
              (reg.vehicleName || "N/A").substring(0, 12),
              (reg.driverName || "N/A").substring(0, 12),
              (reg.origin || "").substring(0, 12),
              (reg.destination || "").substring(0, 12),
              distance.toString() + " km"
            ];
          } else {
            // Caso genérico
            rowData = [
              reg.formattedDate || format(new Date(reg.date || new Date()), "dd/MM/yyyy"),
              (reg.vehicleName || "N/A").substring(0, 12),
              (reg.driverName || "N/A").substring(0, 12),
              reg.type || "N/A",
              "...",
              formatCurrency(reg.fuelCost || reg.maintenanceCost || 0)
            ];
          }
        } catch (cellError) {
          console.error("Erro ao processar célula:", cellError);
          rowData = headers.map(() => "Erro");
        }

        // Garantir que temos células suficientes
        while (rowData.length < headers.length) {
          rowData.push("");
        }

        // Desenhar células
        rowData.forEach((cell, j) => {
          doc.text((cell || "").toString(), margin + j * colWidth, currentY);
        });

        currentY += lineHeight;
      }

      // Se tiver mais registros do que exibidos
      if (filteredData.length > maxRows) {
        doc.setFont('helvetica', 'italic');
        doc.text(`... mais ${filteredData.length - maxRows} registro(s) não exibidos neste relatório.`, 
                margin, currentY + 5);
      }

      // Rodapé
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

      // Texto do rodapé
      doc.setTextColor(blue[0], blue[1], blue[2]);  // Usando a cor azul definida anteriormente
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Granduvale Mineração - Sistema de Gestão de Frota', margin, pageHeight - 10);
      doc.text('Página 1 de 1', pageWidth - margin - 20, pageHeight - 10);

      console.log("PDF gerado com sucesso, salvando...");

      // Salvar o PDF
      doc.save(`relatorio_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Ocorreu um erro ao gerar o PDF: " + (error.message || "Erro desconhecido") + 
            "\nTente novamente com menos dados ou use a exportação CSV.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-navy-blue">Gerar Relatórios</h3>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select
                value={reportType}
                onValueChange={(value) => setReportType(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os registros</SelectItem>
                  <SelectItem value="fuel">Abastecimentos</SelectItem>
                  <SelectItem value="maintenance">Manutenções</SelectItem>
                  <SelectItem value="trip">Viagens</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-2/3">
              <label className="text-sm font-medium">Período</label>
              <div className="flex">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal w-full",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy")
                        )
                      ) : (
                        <span>Selecione um período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={(range) => 
                        setDateRange({
                          from: range?.from,
                          to: range?.to,
                        })
                      }
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setDateRange({ from: undefined, to: undefined });
                setReportType("all");
              }}
            >
              Limpar Filtros
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={generateCSVReport}
              disabled={isGenerating}
            >
              <FileText size={16} />
              Exportar CSV
            </Button>

            <Button
              className="flex items-center gap-2"
              onClick={generatePDFReport}
              disabled={isGenerating}
            >
              <Download size={16} />
              {isGenerating ? "Gerando..." : "Exportar PDF"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}