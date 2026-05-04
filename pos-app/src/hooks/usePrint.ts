import { useRef, useCallback } from "react";
import { useReactToPrint } from "react-to-print";

interface UsePrintOptions {
  documentTitle?: string;
  /** Extra CSS injected into the print iframe */
  printStyle?: string;
}

/**
 * Wraps react-to-print with sensible POS defaults.
 * Returns a ref to attach to the printable element and a trigger function.
 */
export function usePrint<T extends HTMLElement>(options: UsePrintOptions = {}) {
  const { documentTitle = "POS Report", printStyle = "" } = options;
  const contentRef = useRef<T>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle,
    pageStyle: `
      @page { size: auto; margin: 12mm; }
      @media print {
        nav, aside, header, .no-print { display: none !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-break-before { page-break-before: always; }
        ${printStyle}
      }
    `,
  });

  const print = useCallback(() => handlePrint(), [handlePrint]);

  return { contentRef, print };
}
