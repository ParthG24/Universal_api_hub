"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, Connector, InvokeResponse } from "@/lib/api";
import {
  Play,
  ArrowLeft,
  UploadCloud,
  Check,
  Copy,
  Clock,
  Coins,
  FileCode,
  AlertCircle,
  Key,
} from "lucide-react";

export default function TestConsolePage() {
  const router = useRouter();
  const params = useParams();
  const connectorId = params.id as string;

  const [connector, setConnector] = useState<Connector | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form input state
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [customApiKey, setCustomApiKey] = useState("");

  // Invocation state
  const [isInvoking, setIsInvoking] = useState(false);
  const [executionTimer, setExecutionTimer] = useState(0);
  const [responseResult, setResponseResult] = useState<InvokeResponse | null>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadConnector();
  }, [connectorId]);

  const loadConnector = async () => {
    setIsLoading(true);
    try {
      let c: Connector;
      if (isNaN(Number(connectorId))) {
        const list = await api.listConnectors().catch(() => []);
        const found = list.find((item) => item.slug === connectorId);
        if (!found) throw new Error(`Connector '${connectorId}' not found.`);
        c = await api.getConnector(found.id);
      } else {
        c = await api.getConnector(connectorId);
      }

      setConnector(c);

      const initialValues: Record<string, any> = {};
      c.input_fields.forEach((f) => {
        if (f.default_value !== undefined && f.default_value !== null) {
          initialValues[f.name] = f.default_value;
        } else if (f.field_type === "boolean") {
          initialValues[f.name] = false;
        } else if (f.field_type === "number") {
          initialValues[f.name] = 100;
        } else if (f.field_type === "json") {
          initialValues[f.name] = '{"key": "value"}';
        } else {
          initialValues[f.name] = "";
        }
      });

      if (c.slug === "content-rewriter" && !initialValues["text"]) {
        initialValues["text"] =
          "Universal AI Hub empowers engineering teams to rapidly create and deploy custom, multi-provider AI APIs with automatic schema repair and observability.";
        initialValues["tone"] = "excited";
        initialValues["word_count"] = 30;
      }

      if (c.slug === "card-scanner" && !customApiKey) {
        setCustomApiKey("uah_card_demo_key_2026_xyz987");
      } else if (c.slug === "content-rewriter" && !customApiKey) {
        setCustomApiKey("uah_rewrite_demo_key_2026_abc123");
      }

      setFormValues(initialValues);
    } catch (err: any) {
      setError(err.message || "Failed to load connector details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleFileChange = (fieldName: string, file: File | null) => {
    if (!file) return;
    setSelectedFiles((prev) => ({ ...prev, [fieldName]: file }));

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrls((prev) => ({ ...prev, [fieldName]: url }));
    }
  };

  const handleRunInvocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connector) return;

    setIsInvoking(true);
    setResponseResult(null);
    setExecutionTimer(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setExecutionTimer(Date.now() - startTime);
    }, 50);

    try {
      const hasFiles = Object.keys(selectedFiles).length > 0;
      let body: FormData | Record<string, any>;

      if (hasFiles) {
        const formData = new FormData();
        Object.entries(formValues).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            formData.append(k, String(v));
          }
        });
        Object.entries(selectedFiles).forEach(([k, file]) => {
          formData.append(k, file);
        });
        body = formData;
      } else {
        body = { ...formValues };
      }

      const res = await api.invokeConnector(connector.slug, body, customApiKey || undefined);
      setResponseResult(res);
    } catch (err: any) {
      setResponseResult({
        success: false,
        data: null,
        error: {
          type: "client_error",
          message: err.message || "Invocation failed.",
        },
      });
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsInvoking(false);
    }
  };

  const handleCopyResponse = () => {
    if (!responseResult) return;
    navigator.clipboard.writeText(JSON.stringify(responseResult, null, 2));
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const handleGenerateSampleCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = "#DE6E4B";
    ctx.fillRect(10, 10, 16, canvas.height - 20);

    ctx.fillStyle = "#000000";
    ctx.font = "bold 26px monospace";
    ctx.fillText("ALEX MORGAN", 50, 70);

    ctx.fillStyle = "#DE6E4B";
    ctx.font = "bold 15px monospace";
    ctx.fillText("VP OF ARTIFICIAL INTELLIGENCE", 50, 105);

    ctx.fillStyle = "#222222";
    ctx.font = "bold 18px monospace";
    ctx.fillText("APEX DYNAMICS INC.", 50, 160);

    ctx.font = "14px monospace";
    ctx.fillText("PHONE:   +1 (555) 019-2834", 50, 220);
    ctx.fillText("EMAIL:   alex.morgan@apexdynamics.io", 50, 255);
    ctx.fillText("WEBSITE: https://apexdynamics.io", 50, 290);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "sample_business_card.png", { type: "image/png" });
      handleFileChange("image", file);
    }, "image/png");
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center font-mono text-xs text-neutral-500">
        Loading test console...
      </div>
    );
  }

  if (error || !connector) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center space-y-4">
        <div className="border border-red-600 bg-red-50 p-6 text-xs font-mono text-red-700">
          {error || "Connector not found."}
        </div>
        <Link href="/dashboard" className="btn-surge btn-surge-black text-xs py-2 px-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-14 space-y-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-neutral-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="text-xs font-mono font-medium text-neutral-500 hover:text-black uppercase tracking-wider transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Connectors</span>
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="font-mono text-xs text-neutral-500 font-bold uppercase">
              Playground
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-sans font-black uppercase tracking-tight text-black">
            {connector.name}
          </h1>
          <p className="font-mono text-xs text-neutral-600 mt-1">
            Endpoint: <code className="text-black font-bold">/api/connectors/{connector.slug}/invoke</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/connectors/${connector.slug}/docs`}
            className="btn-surge btn-surge-white text-xs py-2.5 px-4"
          >
            API Docs
          </Link>
          <Link
            href={`/connectors/${connector.id}/stats`}
            className="btn-surge btn-surge-white text-xs py-2.5 px-4"
          >
            Stats & Telemetry
          </Link>
        </div>
      </div>

      {/* Main 2-Column Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Dynamic Request Form */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleRunInvocation}
            className="border border-black bg-white p-7 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-black">
                Input Parameters ({connector.input_fields.length})
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-black text-white">
                {connector.provider} • {connector.model}
              </span>
            </div>

            {/* Custom API Key Input */}
            <div className="border border-neutral-200 bg-neutral-50 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold uppercase text-neutral-600 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#e07850]" />
                  <span>Connector API Key (X-API-Key)</span>
                </label>
                {connector.slug === "card-scanner" && (
                  <button
                    type="button"
                    onClick={() => setCustomApiKey("uah_card_demo_key_2026_xyz987")}
                    className="text-[10px] font-mono text-[#e07850] hover:underline font-bold"
                  >
                    [Auto-Fill Demo Key]
                  </button>
                )}
                {connector.slug === "content-rewriter" && (
                  <button
                    type="button"
                    onClick={() => setCustomApiKey("uah_rewrite_demo_key_2026_abc123")}
                    className="text-[10px] font-mono text-[#e07850] hover:underline font-bold"
                  >
                    [Auto-Fill Demo Key]
                  </button>
                )}
              </div>
              <input
                type="text"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="Enter connector API key (e.g. uah_live_...)"
                className="w-full surge-input text-[11px] py-1.5 font-mono"
              />
              <p className="text-[10px] text-neutral-500 font-mono">
                {customApiKey
                  ? "✓ Active key configured. Request will be signed with X-API-Key header."
                  : "Leave blank to invoke using current admin session."}
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {connector.input_fields.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                      {f.name} {f.required && <span className="text-[#DE6E4B]">*</span>}
                    </label>
                    <span className="text-[10px] font-mono uppercase text-neutral-400">
                      {f.field_type}
                    </span>
                  </div>

                  {f.description && (
                    <p className="text-[11px] font-mono text-neutral-500">{f.description}</p>
                  )}

                  {f.field_type === "text" && (
                    <textarea
                      rows={3}
                      required={f.required}
                      value={formValues[f.name] || ""}
                      onChange={(e) => handleInputChange(f.name, e.target.value)}
                      placeholder={`Enter ${f.name}...`}
                      className="w-full surge-input"
                    />
                  )}

                  {f.field_type === "number" && (
                    <input
                      type="number"
                      required={f.required}
                      value={formValues[f.name] || ""}
                      onChange={(e) => handleInputChange(f.name, e.target.value)}
                      className="w-full surge-input"
                    />
                  )}

                  {f.field_type === "boolean" && (
                    <label className="flex items-center gap-2 cursor-pointer pt-1 font-mono text-xs">
                      <input
                        type="checkbox"
                        checked={!!formValues[f.name]}
                        onChange={(e) => handleInputChange(f.name, e.target.checked)}
                        className="w-4 h-4 accent-[#DE6E4B]"
                      />
                      <span>Enable {f.name}</span>
                    </label>
                  )}

                  {(f.field_type === "image" || f.field_type === "file") && (
                    <div className="space-y-2">
                      <div className="border border-dashed border-neutral-400 bg-neutral-50 p-6 text-center hover:bg-neutral-100 transition-colors cursor-pointer relative">
                        <input
                          type="file"
                          accept={f.field_type === "image" ? "image/*" : "*/*"}
                          required={f.required && !selectedFiles[f.name]}
                          onChange={(e) => handleFileChange(f.name, e.target.files?.[0] || null)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <UploadCloud className="w-5 h-5 text-neutral-500" />
                          <div className="font-mono text-xs font-bold text-black uppercase">
                            {selectedFiles[f.name] ? selectedFiles[f.name].name : "Choose File or Drop Here"}
                          </div>
                        </div>
                      </div>

                      {previewUrls[f.name] && (
                        <div className="border border-black p-2 bg-white flex items-center gap-3">
                          <img
                            src={previewUrls[f.name]}
                            alt="Preview"
                            className="w-16 h-12 object-cover border border-neutral-200"
                          />
                          <div className="text-xs font-mono truncate">
                            <div className="font-bold">{selectedFiles[f.name]?.name}</div>
                          </div>
                        </div>
                      )}

                      {connector.slug === "card-scanner" && !selectedFiles[f.name] && (
                        <button
                          type="button"
                          onClick={handleGenerateSampleCard}
                          className="text-[11px] font-mono text-[#DE6E4B] hover:text-black font-bold uppercase transition-colors"
                        >
                          + Load Sample Business Card
                        </button>
                      )}
                    </div>
                  )}

                  {f.field_type === "json" && (
                    <textarea
                      rows={4}
                      required={f.required}
                      value={formValues[f.name] || ""}
                      onChange={(e) => handleInputChange(f.name, e.target.value)}
                      className="w-full font-mono text-xs p-3 bg-[#161616] text-emerald-400 border border-black focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isInvoking}
              className="w-full btn-surge btn-surge-orange py-3 text-xs tracking-wider"
            >
              {isInvoking ? (
                <span>Invoking Model ({Math.round(executionTimer)}ms)...</span>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Execute Invocation</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Exact SurgeDB Offset Shadow Response Terminal */}
        <div className="lg:col-span-7">
          <div className="relative">
            {/* Terracotta offset card */}
            <div className="absolute top-2.5 left-2.5 w-full h-full bg-[#DE6E4B] border border-black z-0 pointer-events-none" />

            <div className="relative z-10 border border-black bg-[#161616] overflow-hidden min-h-[500px] flex flex-col">
              {/* Header bar */}
              <div className="border-b border-black bg-white px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-black">
                    Response JSON
                  </span>
                  {responseResult && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                        responseResult.success
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-red-600 bg-red-50 text-red-800"
                      }`}
                    >
                      {responseResult.success ? "200 Success" : "Failed"}
                    </span>
                  )}
                </div>

                {responseResult && (
                  <button
                    onClick={handleCopyResponse}
                    className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 hover:text-black flex items-center gap-1.5 transition-colors"
                  >
                    {copiedResponse ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedResponse ? "Copied" : "Copy"}</span>
                  </button>
                )}
              </div>

              {/* Metrics Pill Bar */}
              {responseResult?.meta && (
                <div className="border-b border-neutral-800 bg-[#1A1A1A] px-5 py-2.5 flex items-center gap-6 text-xs font-mono text-neutral-300">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{responseResult.meta.latency_ms} ms</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{responseResult.meta.tokens} tokens</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Coins className="w-3.5 h-3.5 text-emerald-500" />
                    <span>${responseResult.meta.estimated_cost.toFixed(6)}</span>
                  </div>
                </div>
              )}

              {/* Code/Response Content */}
              <div className="p-5 flex-1 text-neutral-200 overflow-x-auto font-mono text-xs leading-relaxed">
                {isInvoking ? (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center space-y-3 text-neutral-400">
                    <div className="w-6 h-6 border-2 border-[#DE6E4B] border-t-transparent rounded-full animate-spin" />
                    <div className="text-xs uppercase font-mono tracking-wider">
                      Streaming response ({Math.round(executionTimer)}ms)...
                    </div>
                  </div>
                ) : responseResult ? (
                  <pre className="text-xs font-mono text-neutral-200 whitespace-pre-wrap">
                    {JSON.stringify(responseResult, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center space-y-2 text-neutral-600">
                    <div className="text-xs uppercase font-mono tracking-widest">
                      Ready to execute. Click &apos;Execute Invocation&apos;.
                    </div>
                  </div>
                )}
              </div>

              {responseResult?.error && (
                <div className="border-t border-red-900 bg-red-950/40 p-4 text-xs font-mono text-red-300 space-y-1">
                  <div className="font-bold uppercase">
                    Error [{responseResult.error.type}]:
                  </div>
                  <p>{responseResult.error.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
