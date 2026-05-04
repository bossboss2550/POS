import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import type { Product } from "@/types";
import { cn, resolveProductImageUrl } from "@/utils";

interface ProductImageProps {
  product: Pick<Product, "name" | "imageUrl" | "image">;
  className?: string;
  iconClassName?: string;
}

export function ProductImage({ product, className, iconClassName }: ProductImageProps) {
  const src = resolveProductImageUrl(product.imageUrl ?? product.image);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Defer state update
    setTimeout(() => setHasError(false), 0);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className={cn("flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-blue-500", className)}>
        <Package className={cn("h-6 w-6", iconClassName)} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={product.name}
      className={cn("rounded-xl object-cover", className)}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}
