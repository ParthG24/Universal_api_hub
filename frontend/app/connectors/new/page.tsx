"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, FieldType, ModelInfo } from "@/lib/api";
import { auth } from "@/lib/auth";
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Copy,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface FormInputField {
  name: string;
  field_type: FieldType;
  required: boolean;
  description: string;
  default_value: string;
  validation_rules: Record<string, any>;
  order: number;
}

export default function NewConnectorPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const [provider, setProvider] = useState("gemini");
  const [model, setModel] = useState("gemini-1.5-flash");
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);

  const [systemPrompt, setSystemPrompt] = useState(
    "You are a specialized AI assistant. Analyze the incoming inputs and return structured JSON matching the requested schema."
  );

  const [inputFields, setInputFields] = useState<FormInputField[]>([
    {
      name: "input_data",
      field_type: "text",
      required: true,
      description: "Primary input query or text",
      default_value: "",
      validation_rules: {},
      order: 0,
    },
  ]);

  const [outputSchemaRaw, setOutputSchemaRaw] = useState(
    JSON.stringify({ result: "string", confidence: "number" }, null, 2)
  );

  // Created Result (Secret API key)
  const [createdResult, setCreatedResult] = useState<{
    id: number;
    slug: string;
    apiKey: string;
    name: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadModels(provider);
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]/g, "-")) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, "-"));
    }
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    loadModels(newProvider);
  };

  const loadModels = async (provName: string) => {
    try {
      const models = await api.listModels(provName);
      setAvailableModels(models);
      if (models.length > 0) setModel(models[0].id);
    } catch {
      if (provName === "gemini") setModel("gemini-1.5-flash");
      else if (provName === "groq") setModel("llama-3.3-70b-versatile");
      else if (provName === "openai") setModel("gpt-4o-mini");
      else if (provName === "ollama") setModel("llama3.2:latest");
    }
  };

  const handleRefreshModels = async () => {
    setIsRefreshingModels(true);
    try {
      const models = await api.refreshModels(provider);
      setAvailableModels(models);
      if (models.length > 0) setModel(models[0].id);
    } catch (e: any) {
      alert(`Model refresh failed: ${e.message}`);
    } finally {
      setIsRefreshingModels(false);
    }
  };

  const addInputField = () => {
    setInputFields([
      ...inputFields,
      {
        name: `param_${inputFields.length + 1}`,
        field_type: "text",
        required: true,
        description: "",
        default_value: "",
        validation_rules: {},
        order: inputFields.length,
      },
    ]);
  };

  const removeInputField = (index: number) => {
    setInputFields(inputFields.filter((_, i) => i !== index));
  };

  const updateInputField = (index: number, key: keyof FormInputField, val: any) => {
    const updated = [...inputFields];
    updated[index] = { ...updated[index], [key]: val };
    setInputFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !slug.trim()) {
      setError("Please provide a name and endpoint slug.");
      return;
    }

    let parsedSchema = {};
    try {
      parsedSchema = JSON.parse(outputSchemaRaw);
    } catch (err) {
      setError("Output schema must be valid JSON.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.createConnector({
        name,
        slug,
        description,
        provider,
        model,
        system_prompt: systemPrompt,
        output_schema: parsedSchema,
        status: "active",
        input_fields: inputFields.map((f, idx) => ({ ...f, order: idx })),
      });

      setCreatedResult({
        id: res.connector_id,
        slug: res.slug,
        apiKey: res.api_key,
        name: res.name,
      });
    } catch (err: any) {
      setError(err.message || "Failed to create connector.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (!createdResult) return;
    navigator.clipboard.writeText(createdResult.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // SUCCESS SCREEN
  if (createdResult) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24">
        <div className="border border-black bg-white p-10 space-y-8">
          <div>
            <span className="font-mono text-xs text-[#DE6E4B] font-bold uppercase tracking-widest block mb-2">
              // Deployed Successfully
            </span>
            <h1 className="text-3xl font-sans font-black uppercase text-black">
              {createdResult.name}
            </h1>
            <p className="font-mono text-xs text-neutral-600 mt-1">
              Endpoint: <code className="text-black font-bold">/api/connectors/{createdResult.slug}/invoke</code>
            </p>
          </div>

          <div className="border border-black bg-neutral-50 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                API Key (Copy Now)
              </span>
              <span className="font-mono text-[10px] text-neutral-500 uppercase">
                Shown Once Only
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdResult.apiKey}
                className="flex-1 font-mono text-xs border border-black bg-white p-2.5 select-all"
              />
              <button
                type="button"
                onClick={handleCopyKey}
                className="btn-surge btn-surge-black text-xs py-2.5 px-4"
              >
                {copiedKey ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-neutral-200">
            <Link
              href={`/connectors/${createdResult.id}/test`}
              className="btn-surge btn-surge-orange text-xs py-3 px-6"
            >
              Open Test Console →
            </Link>
            <Link
              href="/dashboard"
              className="btn-surge btn-surge-white text-xs py-3 px-6"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
      {/* Top Header */}
      <div className="space-y-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-neutral-500 hover:text-black uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Connectors</span>
        </Link>
        <h1 className="text-4xl font-sans font-black uppercase tracking-tight text-black">
          CREATE CONNECTOR
        </h1>
        <p className="font-mono text-xs text-neutral-600 max-w-xl">
          Configure a new AI endpoint. Set system instructions, input parameters,
          and expected output schema.
        </p>
      </div>

      {error && (
        <div className="border border-red-600 bg-red-50 p-4 text-xs font-mono text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Clean Single-Page Form with Generous Whitespace */}
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* SECTION 1: ENDPOINT IDENTITY */}
        <section className="border border-black bg-white p-8 space-y-6">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="font-mono font-bold text-xs uppercase tracking-widest text-black">
              01 // Endpoint Identity
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black">
                Connector Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Invoice OCR Scanner"
                className="w-full surge-input"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black">
                Endpoint Slug
              </label>
              <div className="flex items-center">
                <span className="border border-r-0 border-black bg-neutral-100 px-3 py-2 text-xs font-mono text-neutral-500">
                  /connectors/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  placeholder="invoice-scanner"
                  className="w-full surge-input"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Extract structured financial metrics from receipt images..."
              className="w-full surge-input"
            />
          </div>
        </section>

        {/* SECTION 2: AI PROVIDER & MODEL */}
        <section className="border border-black bg-white p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h2 className="font-mono font-bold text-xs uppercase tracking-widest text-black">
              02 // Model Configuration
            </h2>
            <button
              type="button"
              onClick={handleRefreshModels}
              disabled={isRefreshingModels}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-600 hover:text-black uppercase tracking-wider transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingModels ? "animate-spin" : ""}`} />
              <span>Refresh Models</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: "gemini", name: "Google Gemini", tag: "Vision + Text" },
              { id: "groq", name: "Groq LPU", tag: "Ultra-Fast Text" },
              { id: "openai", name: "OpenAI", tag: "GPT-4o" },
              { id: "ollama", name: "Ollama (Offline)", tag: "100% Free / Local" },
            ].map((p) => {
              const isSelected = provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderChange(p.id)}
                  className={`border text-left p-4 transition-all ${
                    isSelected
                      ? "border-black bg-neutral-100 shadow-[3px_3px_0px_#DE6E4B]"
                      : "border-neutral-200 hover:border-black bg-white"
                  }`}
                >
                  <div className="font-mono font-bold text-sm text-black">{p.name}</div>
                  <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider mt-1">
                    {p.tag}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-2 pt-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black">
              Selected Model
            </label>
            {availableModels.length > 0 ? (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full surge-input"
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.id} {m.capabilities?.includes("vision") ? "• [Vision]" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full surge-input"
              />
            )}
          </div>
        </section>

        {/* SECTION 3: INSTRUCTIONS & INPUT FIELDS */}
        <section className="border border-black bg-white p-8 space-y-6">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="font-mono font-bold text-xs uppercase tracking-widest text-black">
              03 // Instructions & Parameters
            </h2>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black">
              System Prompt
            </label>
            <textarea
              rows={5}
              required
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full surge-input leading-relaxed"
            />
          </div>

          {/* Dynamic Inputs List */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                Input Parameters ({inputFields.length})
              </label>
              <button
                type="button"
                onClick={addInputField}
                className="text-xs font-mono font-bold uppercase text-[#DE6E4B] hover:text-black flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Parameter</span>
              </button>
            </div>

            <div className="space-y-3">
              {inputFields.map((f, idx) => (
                <div
                  key={idx}
                  className="border border-neutral-300 p-4 bg-neutral-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  <div className="flex-1 w-full space-y-1">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">Field Name</span>
                    <input
                      type="text"
                      required
                      value={f.name}
                      onChange={(e) => updateInputField(idx, "name", e.target.value)}
                      placeholder="e.g. image or topic"
                      className="w-full surge-input"
                    />
                  </div>

                  <div className="w-full sm:w-44 space-y-1">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">Type</span>
                    <select
                      value={f.field_type}
                      onChange={(e) => updateInputField(idx, "field_type", e.target.value as FieldType)}
                      className="w-full surge-input"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="image">Image (Upload)</option>
                      <option value="file">File (Upload)</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4 pt-4 sm:pt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer font-mono text-xs">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => updateInputField(idx, "required", e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#DE6E4B]"
                      />
                      <span className="uppercase text-[11px] font-medium">Req</span>
                    </label>

                    {inputFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInputField(idx)}
                        className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                        title="Remove parameter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expected Output Schema */}
          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black">
                Expected Output JSON Schema
              </label>
              <span className="font-mono text-[10px] text-neutral-500 uppercase">
                Enforced & Auto-Repaired
              </span>
            </div>
            <textarea
              rows={6}
              value={outputSchemaRaw}
              onChange={(e) => setOutputSchemaRaw(e.target.value)}
              className="w-full font-mono text-xs p-4 bg-[#161616] text-emerald-400 border border-black focus:outline-none"
            />
          </div>
        </section>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href="/dashboard"
            className="btn-surge btn-surge-white px-6 py-3"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-surge btn-surge-black px-8 py-3 text-xs"
          >
            {isLoading ? "Creating Endpoint..." : "Deploy Connector"}
          </button>
        </div>
      </form>
    </div>
  );
}
