import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils";
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string; error?: string; prefix?: ReactNode; suffix?: ReactNode;
}
export function Input({ label, error, prefix, suffix, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative flex items-center">
        {prefix && <div className="absolute left-3 text-gray-400">{prefix}</div>}
        <input
          className={cn(
            "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
            prefix && "pl-9", suffix && "pr-9",
            error ? "border-red-400 bg-red-50" : "border-gray-300",
            className
          )}
          {...props}
        />
        {suffix && <div className="absolute right-3 text-gray-400">{suffix}</div>}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
