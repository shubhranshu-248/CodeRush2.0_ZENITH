"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Code, Copy, Download, FileText } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export type ExportFormat = "MARKDOWN" | "PDF";

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  result: Record<string, unknown> | null;
  onExport: (format: ExportFormat) => Promise<void>;
  isExporting?: boolean;
}

type ViewTab = "preview" | "raw";

const getResultText = (result: Record<string, unknown> | null): string => {
  if (!result) return "";
  const candidate = result.content ?? result.result;
  if (typeof candidate === "string") return candidate;
  if (candidate != null) return JSON.stringify(candidate, null, 2);
  return JSON.stringify(result, null, 2);
};

/** Very lightweight markdown-ish renderer: headings, bullet points, paragraphs. */
const PreviewContent: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split(/\r?\n/);

  return (
    <div className="space-y-2.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        const headingMatch = /^(#{1,4})\s+(.*)$/.exec(trimmed);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const sizeClass =
            level === 1
              ? "text-base font-semibold text-white"
              : level === 2
              ? "text-sm font-semibold text-gray-100"
              : "text-xs font-semibold text-gray-200 uppercase tracking-wide";
          return (
            <div key={idx} className={sizeClass}>
              {headingMatch[2]}
            </div>
          );
        }

        const bulletMatch = /^[-*•]\s+(.*)$/.exec(trimmed);
        if (bulletMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
              <span className="text-xs text-gray-300 leading-relaxed">
                {bulletMatch[1]}
              </span>
            </div>
          );
        }

        const numberedMatch = /^(\d+)[.)]\s+(.*)$/.exec(trimmed);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-[11px] text-indigo-400 font-mono shrink-0">
                {numberedMatch[1]}.
              </span>
              <span className="text-xs text-gray-300 leading-relaxed">
                {numberedMatch[2]}
              </span>
            </div>
          );
        }

        return (
          <p key={idx} className="text-xs text-gray-300 leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
};

/** Naive JSON syntax highlighting via regex over the stringified value. */
const RawJsonView: React.FC<{ result: Record<string, unknown> | null }> = ({
  result,
}) => {
  const json = useMemo(() => JSON.stringify(result ?? {}, null, 2), [result]);

  const html = useMemo(() => {
    const escaped = json
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return escaped.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "text-amber-300/90"; // number
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "text-indigo-300" : "text-emerald-300";
        } else if (/true|false/.test(match)) {
          cls = "text-rose-300";
        } else if (/null/.test(match)) {
          cls = "text-gray-500";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }, [json]);

  return (
    <pre className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-words">
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
};

export const ExportPanel: React.FC<ExportPanelProps> = ({
  isOpen,
  onClose,
  result,
  onExport,
  isExporting = false,
}) => {
  const [tab, setTab] = useState<ViewTab>("preview");
  const [format, setFormat] = useState<ExportFormat>("MARKDOWN");
  const [copied, setCopied] = useState(false);

  const resultText = useMemo(() => getResultText(result), [result]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  const handleExport = () => {
    void onExport(format);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Execution Result">
      <div className="space-y-4">
        {/* Tab toggle */}
        <div className="relative flex items-center gap-1 p-1 bg-[#0a0b0e] rounded-lg border border-white/[0.06] w-fit">
          {(["preview", "raw"] as ViewTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative z-10 px-3 py-1.5 rounded-md text-[11px] font-medium capitalize transition-colors ${
                tab === t ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === t && (
                <motion.div
                  layoutId="export-tab-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="absolute inset-0 bg-white/[0.08] rounded-md -z-10"
                />
              )}
              <span className="flex items-center gap-1.5 relative">
                {t === "preview" ? (
                  <FileText className="w-3 h-3" />
                ) : (
                  <Code className="w-3 h-3" />
                )}
                {t}
              </span>
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0b0e] p-4 max-h-80 overflow-y-auto">
          <AnimatePresence mode="wait">
            {resultText || (result && Object.keys(result).length > 0) ? (
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {tab === "preview" ? (
                  <PreviewContent text={resultText} />
                ) : (
                  <RawJsonView result={result} />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500 text-center py-8"
              >
                No result available yet.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          {/* Format segmented control */}
          <div className="relative flex items-center gap-1 p-1 bg-[#0a0b0e] rounded-lg border border-white/[0.06]">
            {(["MARKDOWN", "PDF"] as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`relative z-10 px-3 py-1.5 rounded-md text-[10px] font-semibold tracking-wide transition-colors ${
                  format === f ? "text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {format === f && (
                  <motion.div
                    layoutId="export-format-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    className="absolute inset-0 bg-indigo-500/80 rounded-md -z-10"
                  />
                )}
                <span className="relative">{f === "MARKDOWN" ? "Markdown" : "PDF"}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              onClick={handleCopy}
              className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
              title="Copy to clipboard"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    className="flex"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    className="flex"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </motion.span>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {copied && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 whitespace-nowrap"
                  >
                    Copied!
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? "Exporting…" : "Download"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
