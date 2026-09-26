"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ConnectorDocResponse } from "@/lib/api";
import {
  ArrowLeft,
  Copy,
  Check,
  Play,
} from "lucide-react";
import CodeBlock from "@/components/CodeBlock";

export default function ConnectorDocsPage() {
  const params = useParams();
  const slugOrId = params.id as string;

  const [docs, setDocs] = useState<ConnectorDocResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    loadDocs();
  }, [slugOrId]);

  const loadDocs = async () => {
    setIsLoading(true);
    try {
      let slug = slugOrId;
      if (!isNaN(Number(slugOrId))) {
        const c = await api.getConnector(slugOrId);
        slug = c.slug;
      }
      const data = await api.getConnectorDocs(slug);
      setDocs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load API documentation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (!docs) return;
    navigator.clipboard.writeText(docs.endpoint_url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center font-mono text-xs text-neutral-500">
        Loading API documentation...
      </div>
    );
  }

  if (error || !docs) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center space-y-4">
        <div className="border border-red-600 bg-red-50 p-6 text-xs font-mono text-red-700">
          {error || "Documentation not available."}
        </div>
        <Link href="/dashboard" className="btn-surge btn-surge-black text-xs py-2 px-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-14 space-y-12">
      {/* Header */}
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
              Documentation
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-sans font-black uppercase tracking-tight text-black">
            {docs.name}
          </h1>
          <p className="font-mono text-xs text-neutral-600 mt-1 max-w-2xl">
            {docs.description}
          </p>
        </div>

        <Link
          href={`/connectors/${docs.slug}/test`}
          className="btn-surge btn-surge-orange text-xs py-2.5 px-5 flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5 fill-black" />
          <span>Launch Playground</span>
        </Link>
      </div>

      {/* Endpoint URL Banner */}
      <div className="border border-black bg-neutral-50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 border border-black bg-black text-white font-bold">
            {docs.http_method}
          </span>
          <code className="text-black font-bold text-sm">{docs.endpoint_url}</code>
        </div>
        <button
          onClick={handleCopyUrl}
          className="btn-surge btn-surge-white text-[11px] py-1.5 px-3 self-end sm:self-auto"
        >
          {copiedUrl ? "Copied" : "Copy URL"}
        </button>
      </div>

      {/* Metadata Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-neutral-200 p-4 bg-white font-mono text-xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Provider</span>
          <span className="font-bold text-black uppercase mt-1 block">{docs.provider}</span>
        </div>
        <div className="border border-neutral-200 p-4 bg-white font-mono text-xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Model</span>
          <span className="font-bold text-black mt-1 block">{docs.model}</span>
        </div>
        <div className="border border-neutral-200 p-4 bg-white font-mono text-xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Content-Type</span>
          <span className="font-bold text-black mt-1 block">{docs.content_type}</span>
        </div>
        <div className="border border-neutral-200 p-4 bg-white font-mono text-xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Auth Header</span>
          <span className="font-bold text-[#DE6E4B] mt-1 block">X-API-Key</span>
        </div>
      </div>

      {/* Parameters Table */}
      <div className="space-y-4">
        <h2 className="text-2xl font-sans font-black uppercase tracking-tight text-black">
          REQUEST PARAMETERS
        </h2>
        <div className="border border-black overflow-hidden bg-white">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-black text-[11px] font-bold uppercase tracking-wider text-black">
                <th className="py-3 px-5 border-r border-neutral-200">Field</th>
                <th className="py-3 px-5 border-r border-neutral-200">Type</th>
                <th className="py-3 px-5 border-r border-neutral-200 text-center">Required</th>
                <th className="py-3 px-5 border-r border-neutral-200">Default</th>
                <th className="py-3 px-5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {docs.parameters.map((p) => (
                <tr key={p.name} className="hover:bg-neutral-50/50">
                  <td className="py-3.5 px-5 border-r border-neutral-200 font-bold text-black">
                    {p.name}
                  </td>
                  <td className="py-3.5 px-5 border-r border-neutral-200">
                    <span className="px-1.5 py-0.5 border border-neutral-200 bg-neutral-50 text-[10px] uppercase">
                      {p.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 border-r border-neutral-200 text-center">
                    {p.required ? (
                      <span className="text-red-700 font-bold text-[10px] uppercase">Required</span>
                    ) : (
                      <span className="text-neutral-400 text-[10px] uppercase">Optional</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 border-r border-neutral-200 text-neutral-500">
                    {p.default_value || "—"}
                  </td>
                  <td className="py-3.5 px-5 text-neutral-600">
                    {p.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Snippets Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-sans font-black uppercase tracking-tight text-black">
          IMPLEMENTATION CODE
        </h2>
        <CodeBlock
          tabs={[
            { id: "curl", label: "CURL", code: docs.curl_snippet },
            { id: "python", label: "PYTHON", code: docs.python_snippet },
            { id: "js", label: "JAVASCRIPT", code: docs.javascript_snippet },
          ]}
        />
      </div>

      {/* Output Schemas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-black">
            Expected JSON Schema
          </h3>
          <div className="border border-black bg-[#161616] p-5 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[350px]">
            <pre>{JSON.stringify(docs.output_schema, null, 2)}</pre>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-black">
            Sample Success Response (200 OK)
          </h3>
          <div className="border border-black bg-[#161616] p-5 text-xs font-mono text-neutral-200 overflow-x-auto max-h-[350px]">
            <pre>{JSON.stringify(docs.example_success_response, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
