import { cn } from "@/utils";
type Variant = "success" | "error" | "warning" | "info" | "neutral";
const variants: Record<Variant, string> = {
  success: "bg-green-100 text-green-700",
  error:   "bg-red-100 text-red-700",
  warning: "bg-yellow-100 text-yellow-700",
  info:    "bg-blue-100 text-blue-700",
  neutral: "bg-gray-100 text-gray-700",
};
export function Badge({ label, variant = "neutral" }: { label: string; variant?: Variant }) {
  return <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", variants[variant])}>{label}</span>;
}
