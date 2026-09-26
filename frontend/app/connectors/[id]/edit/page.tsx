"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api, Connector, FieldType, ModelInfo } from "@/lib/api";
import { auth } from "@/lib/auth";
import { ArrowLeft, Check, Plus, Trash2, AlertCircle, RefreshCw } from "lucide-react";

export default function EditConnectorPage() {
  const router = useRouter();
  const params = useParams();
  const connectorId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState("gemini");
  const [model, setModel] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [status, setStatus] = useState<"active" | "disabled">("active");
  const [inputFields, setInputFields] = useState<any[]>([]);
  const [outputSchemaRaw, setOutputSchemaRaw] = useState("{}");
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadConnector();
  }, [connectorId]);

  const loadConnector = async () => {
    setIsLoading(true);
    try {
      const c = await api.getConnector(connectorId);
      setName(c.name);
      setDescription(c.description);
      setProvider(c.provider);
      setModel(c.model);
      setSystemPrompt(c.system_prompt);
      setStatus(c.status);
      setInputFields(c.input_fields.map((f) => ({
        name: f.name,
        field_type: f.field_type,
        required: f.required,
        description: f.description,
        default_value: f.default_value || "",
        validation_rules: f.validation_rules || {},
        order: f.order,
      })));
      setOutputSchemaRaw(JSON.stringify(c.output_schema || {}, null, 2));

      // Load models
      const models = await api.listModels(c.provider).catch(() => []);
      setAvailableModels(models);
    } catch (err: any) {
      setError(err.message || "Failed to load connector.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = async (newProv: string) => {
    setProvider(newProv);
    const models = await api.listModels(newProv).catch(() => []);
    setAvailableModels(models);
    if (models.length > 0) setModel(models[0].id);
  };

  const addInputField = () => {
    setInputFields([
      ...inputFields,
      {
        name: `field_${inputFields.length + 1}`,
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

  const updateInputField = (index: number, key: string, val: any) => {
    const updated = [...inputFields];
    updated[index] = { ...updated[index], [key]: val };
    setInputFields(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    let parsedSchema = {};
    try {
      parsedSchema = JSON.parse(outputSchemaRaw);
    } catch (err) {
      setError("Output schema must be valid JSON.");
      setIsSaving(false);
      return;
    }

    try {
      await api.updateConnector(connectorId, {
        name,
        description,
        provider,
        model,
        system_prompt: systemPrompt,
        status,
        output_schema: parsedSchema,
        input_fields: inputFields.map((f, idx) => ({ ...f, order: idx })),
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to update connector.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center font-mono text-xs">
        Loading connector details...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex items-center justify-between border-b-2 border-black pb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-600 hover:text-black uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="font-mono text-xs text-neutral-500 font-bold uppercase">
          Editing Connector #{connectorId}
        </span>
      </div>

      {error && (
        <div className="border-2 border-red-600 bg-red-50 p-4 text-xs font-mono text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="border-2 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#000] space-y-6">
        <div>
          <h1 className="text-2xl font-mono font-black uppercase text-black">
            EDIT CONNECTOR
          </h1>
          <p className="font-mono text-xs text-neutral-600 mt-1">
            Update prompt instructions, input fields, or provider models.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
              Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-black p-2.5 text-xs font-mono bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full border-2 border-black p-2.5 text-xs font-mono bg-white"
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border-2 border-black p-2.5 text-xs font-mono bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
              Provider *
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full border-2 border-black p-2.5 text-xs font-mono bg-white"
            >
              <option value="gemini">Google Gemini</option>
              <option value="groq">Groq LPU</option>
              <option value="openai">OpenAI</option>
              <option value="ollama">Ollama (Offline / Local)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
              Model *
            </label>
            {availableModels.length > 0 ? (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full border-2 border-black p-2.5 text-xs font-mono bg-white"
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.id}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full border-2 border-black p-2.5 text-xs font-mono bg-white"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
            System Instructions / Prompt *
          </label>
          <textarea
            rows={6}
            required
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full border-2 border-black p-3 text-xs font-mono bg-white"
          />
        </div>

        {/* Input Fields Builder */}
        <div className="space-y-4 pt-4 border-t-2 border-black">
          <div className="flex items-center justify-between">
            <h3 className="font-mono font-bold text-sm uppercase text-black">
              Input Parameters ({inputFields.length})
            </h3>
            <button
              type="button"
              onClick={addInputField}
              className="btn-brutal btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-[2px_2px_0px_#000]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Field</span>
            </button>
          </div>

          {inputFields.map((f, idx) => (
            <div key={idx} className="border-2 border-black p-3.5 bg-neutral-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase">Field #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeInputField(idx)}
                  className="text-xs font-mono text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    value={f.name}
                    onChange={(e) => updateInputField(idx, "name", e.target.value)}
                    placeholder="Field name"
                    className="w-full border border-black p-2 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <select
                    value={f.field_type}
                    onChange={(e) => updateInputField(idx, "field_type", e.target.value)}
                    className="w-full border border-black p-2 text-xs font-mono bg-white"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="image">Image (Upload)</option>
                    <option value="file">File (Upload)</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <div className="flex items-center pl-2">
                  <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => updateInputField(idx, "required", e.target.checked)}
                      className="accent-[#DE6E4B]"
                    />
                    <span>Required</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Output Schema */}
        <div className="pt-4 border-t-2 border-black">
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
            Expected Output JSON Schema
          </label>
          <textarea
            rows={7}
            value={outputSchemaRaw}
            onChange={(e) => setOutputSchemaRaw(e.target.value)}
            className="w-full border-2 border-black p-3 text-xs font-mono bg-[#121314] text-emerald-400"
          />
        </div>

        <div className="pt-4 border-t-2 border-black flex items-center justify-end gap-3">
          <Link href="/dashboard" className="btn-brutal text-xs py-2 px-4">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="btn-brutal btn-primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-[3px_3px_0px_#000]"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
