import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency to BRL
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  
  // If value is in cents, convert to reais
  const amount = value >= 100 ? value / 100 : value;
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

// Format date to Brazilian format (DD/MM/YYYY)
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return dateObj.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Get a display text for the registration type
export function getRegistrationTypeText(type: string): string {
  switch (type) {
    case "fuel":
      return "Abastecimento";
    case "maintenance":
      return "Manutenção";
    case "trip":
      return "Viagem";
    default:
      return "Desconhecido";
  }
}

// Get a color for the registration type
export function getRegistrationTypeColor(type: string): {
  bg: string;
  text: string;
  icon: string;
} {
  switch (type) {
    case "fuel":
      return {
        bg: "bg-amber-500",
        text: "text-white",
        icon: "text-xl mb-1"
      };
    case "maintenance":
      return {
        bg: "bg-green-600",
        text: "text-white",
        icon: "text-xl mb-1"
      };
    case "trip":
      return {
        bg: "bg-blue-600",
        text: "text-white",
        icon: "text-xl mb-1"
      };
    default:
      return {
        bg: "bg-gray-500",
        text: "text-white",
        icon: "text-xl mb-1"
      };
  }
}


