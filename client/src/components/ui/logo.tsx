import { brandColors } from "@/lib/colors";

export function Logo({ showText = true }: { showText?: boolean }) {
  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="flex items-center">
          <img 
            src="/logo-granduvale.svg" 
            alt="Granduvale Mineração" 
            className="h-12 mb-1"
          />
        </div>
        {showText && (
          <div className="text-center">
            <div className="text-sm font-medium text-blue-900">Sistema de Gestão</div>
            <div className="text-sm font-medium text-blue-900">de Frota</div>
          </div>
        )}
      </div>
    </div>
  );
}