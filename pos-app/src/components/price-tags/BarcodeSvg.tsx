import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeSvgProps {
  value: string;
  className?: string;
}

export function BarcodeSvg({ value, className }: BarcodeSvgProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }

    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        width: 1.6,
        height: 22,
        background: "#ffffff",
      });
      // Defer state update
      setTimeout(() => setHasError(false), 0);
    } catch {
      // Defer state update
      setTimeout(() => setHasError(true), 0);
    }
  }, [value]);

  if (hasError) {
    return <div className={className}>{value}</div>;
  }

  return <svg ref={svgRef} className={className} role="img" aria-label={`Barcode ${value}`} />;
}
