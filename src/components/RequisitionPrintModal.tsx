import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";
import RequisitionSheet, { type SheetData } from "./RequisitionSheet";

const SHEET_PX = 794; // 210mm at 96dpi

function useFitScale(pad = 32) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerWidth - pad) / SHEET_PX));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [pad]);
  return scale;
}

interface Props {
  data?: SheetData; // omit for a blank form
  title?: string;
  onClose: () => void;
}

export default function RequisitionPrintModal({ data, title = "Requisition form", onClose }: Props) {
  const scale = useFitScale();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* On-screen preview */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-0 z-50 flex flex-col bg-slate-900/70 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-3 bg-[#0B2447] px-4 py-3 text-white">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D62828] px-4 py-2 text-sm font-semibold hover:bg-[#b81f1f] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Printer size={16} /> Print
            </button>
            <button
              onClick={onClose}
              aria-label="Close preview"
              className="rounded-lg p-2 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="mx-auto w-fit shadow-2xl" style={{ zoom: scale } as CSSProperties}>
            <RequisitionSheet data={data} />
          </div>
        </div>
      </div>

      {/* Print-only copy: a direct child of <body>, everything else is hidden when printing */}
      {createPortal(
        <div id="print-root">
          <RequisitionSheet data={data} />
        </div>,
        document.body
      )}
    </>
  );
}