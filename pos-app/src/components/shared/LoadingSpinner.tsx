import { cn } from "@/utils";

interface Props { size?: "sm" | "md" | "lg"; className?: string; }
export function LoadingSpinner({ size = "md", className }: Props) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-blue-600", sizes[size], className)} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <LoadingSpinner size="lg" />
    </div>
  );
}
