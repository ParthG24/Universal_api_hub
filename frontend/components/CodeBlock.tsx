"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeTab {
  id: string;
  label: string;
  code: string;
}

interface CodeBlockProps {
  tabs: CodeTab[];
}

export default function CodeBlock({ tabs }: CodeBlockProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");
  const [copied, setCopied] = useState(false);

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  const handleCopy = () => {
    if (!currentTab) return;
    navigator.clipboard.writeText(currentTab.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = currentTab ? currentTab.code.trim().split("\n") : [];

  return (
    <div className="relative">
      {/* Terracotta/Coral offset background card (exact SurgeDB style) */}
      <div className="absolute top-2.5 left-2.5 w-full h-full bg-[#DE6E4B] border border-black z-0 pointer-events-none" />

      {/* Main Code Box */}
      <div className="relative z-10 border border-black bg-[#161616] overflow-hidden">
        {/* Header Tabs: White background with black active tab, thin 1px borders */}
        <div className="flex items-center justify-between border-b border-black bg-white">
          <div className="flex items-center">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 text-xs font-mono font-bold tracking-widest uppercase border-r border-black transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "bg-white text-black hover:bg-neutral-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Minimal Copy Button */}
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 hover:text-black flex items-center gap-1.5 transition-colors"
            title="Copy snippet"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-5 overflow-x-auto text-[13px] font-mono leading-relaxed min-h-[380px] max-h-[460px] scrollbar-thin">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => {
                const trimmed = line.trim();
                let content = <span className="text-neutral-200">{line}</span>;

                if (trimmed.startsWith("#") || trimmed.startsWith("//")) {
                  content = <span className="text-emerald-400">{line}</span>;
                } else if (
                  trimmed.startsWith("from ") ||
                  trimmed.startsWith("import ") ||
                  trimmed.startsWith("const ") ||
                  trimmed.startsWith("curl ")
                ) {
                  content = <span className="text-sky-300">{line}</span>;
                } else if (line.includes('"') || line.includes("'")) {
                  content = <span className="text-amber-200">{line}</span>;
                }

                return (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="w-10 select-none text-right pr-5 text-neutral-600 font-mono text-xs">
                      {idx + 1}
                    </td>
                    <td className="whitespace-pre font-mono">
                      {content}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
