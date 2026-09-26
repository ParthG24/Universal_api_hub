"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ConnectorSummary, GlobalStats } from "@/lib/api";
import { auth } from "@/lib/auth";
import {
  Play,
  FileText,
  BarChart2,
  Edit,
  Trash2,
  Key,
  Search,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rotate Key state
  const [revealedKey, setRevealedKey] = useState<{ name: string; key: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [conns, stats] = await Promise.all([
        api.listConnectors(),
        api.getGlobalStats().catch(() => null),
      ]);
      setConnectors(conns);
      if (stats) setGlobalStats(stats);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (c: ConnectorSummary) => {
    const nextStatus = c.status === "active" ? "disabled" : "active";
    try {
      await api.toggleConnectorStatus(c.id, nextStatus);
      setConnectors((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, status: nextStatus } : item))
      );
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleDelete = async (c: ConnectorSummary) => {
    if (!confirm(`Are you sure you want to delete '${c.name}'?`)) return;
    try {
      await api.deleteConnector(c.id);
      setConnectors((prev) => prev.filter((item) => item.id !== c.id));
    } catch (err: any) {
      alert(`Failed to delete connector: ${err.message}`);
    }
  };

  const handleRegenerateKey = async (c: ConnectorSummary) => {
    if (!confirm(`Rotate API key for '${c.name}'? The previous key will be invalidated immediately.`)) return;
    try {
      const res = await api.regenerateKey(c.id);
      setRevealedKey({ name: c.name, key: res.api_key });
    } catch (err: any) {
      alert(`Failed to rotate key: ${err.message}`);
    }
  };

  const handleCopyKey = () => {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const filteredConnectors = connectors.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.provider.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-14 space-y-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-neutral-200 pb-8">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#DE6E4B] block mb-2">
            // Overview & Gateway
          </span>
          <h1 className="text-4xl font-sans font-black uppercase tracking-tight text-black">
            CONNECTORS
          </h1>
          <p className="font-mono text-xs text-neutral-600 mt-1 max-w-xl">
            Live AI endpoints, usage telemetry, and access configuration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="btn-surge btn-surge-white text-xs py-2.5 px-3"
            title="Refresh metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Link
            href="/connectors/new"
            className="btn-surge btn-surge-black text-xs py-2.5 px-5"
          >
            + Create Connector
          </Link>
        </div>
      </div>

      {/* Clean Global Metrics Cards */}
      {globalStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-black p-6 bg-white space-y-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Active Endpoints
            </span>
            <div className="text-3xl font-mono font-black text-black">
              {globalStats.active_connectors}
              <span className="text-sm font-normal text-neutral-400"> / {globalStats.total_connectors}</span>
            </div>
          </div>

          <div className="border border-black p-6 bg-white space-y-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Total Requests
            </span>
            <div className="text-3xl font-mono font-black text-black">
              {globalStats.total_requests}
            </div>
          </div>

          <div className="border border-black p-6 bg-white space-y-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Success Rate
            </span>
            <div className="text-3xl font-mono font-black text-emerald-600">
              {globalStats.global_success_rate}%
            </div>
          </div>

          <div className="border border-black p-6 bg-white space-y-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Est. Total Cost
            </span>
            <div className="text-3xl font-mono font-black text-black">
              ${globalStats.total_estimated_cost.toFixed(4)}
            </div>
          </div>
        </div>
      )}

      {/* Key Revealed Banner */}
      {revealedKey && (
        <div className="border border-black bg-amber-50/70 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-800" />
              <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-black">
                New API Key Generated for {revealedKey.name}
              </h3>
            </div>
            <button
              onClick={() => setRevealedKey(null)}
              className="text-xs font-mono text-neutral-500 hover:text-black font-bold uppercase"
            >
              [Dismiss]
            </button>
          </div>
          <p className="font-mono text-xs text-neutral-600">
            Copy and store this API key now. It is hashed on the server and cannot be viewed again.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={revealedKey.key}
              className="flex-1 font-mono text-xs border border-black bg-white p-2.5 select-all"
            />
            <button
              onClick={handleCopyKey}
              className="btn-surge btn-surge-black text-xs py-2 px-4"
            >
              {copiedKey ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter connectors by name, slug, or model..."
          className="w-full surge-input pl-10"
        />
      </div>

      {error && (
        <div className="border border-red-600 bg-red-50 p-4 text-xs font-mono text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Clean Desktop Table */}
      {isLoading ? (
        <div className="border border-neutral-200 p-16 text-center font-mono text-xs text-neutral-500">
          Loading connectors...
        </div>
      ) : filteredConnectors.length === 0 ? (
        <div className="border border-black p-16 text-center space-y-4 bg-white">
          <p className="font-mono text-xs text-neutral-600">
            {searchQuery ? "No connectors match your search." : "No connectors configured yet."}
          </p>
          <Link
            href="/connectors/new"
            className="btn-surge btn-surge-black text-xs py-2.5 px-5 inline-block"
          >
            Create Your First Connector
          </Link>
        </div>
      ) : (
        <div className="border border-black overflow-hidden bg-white">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-black bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-black">
                <th className="py-3 px-5 border-r border-neutral-200">Connector</th>
                <th className="py-3 px-5 border-r border-neutral-200">Model</th>
                <th className="py-3 px-5 border-r border-neutral-200">Parameters</th>
                <th className="py-3 px-5 border-r border-neutral-200 text-center">Status</th>
                <th className="py-3 px-5 border-r border-neutral-200 text-right">Requests</th>
                <th className="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredConnectors.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-4 px-5 border-r border-neutral-200">
                    <div className="font-bold text-black text-sm">{c.name}</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      /api/connectors/{c.slug}/invoke
                    </div>
                  </td>

                  <td className="py-4 px-5 border-r border-neutral-200">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 border border-black bg-black text-white">
                        {c.provider}
                      </span>
                      <span className="text-neutral-800 text-[11px]">{c.model}</span>
                    </div>
                  </td>

                  <td className="py-4 px-5 border-r border-neutral-200">
                    <div className="flex flex-wrap gap-1.5">
                      {c.input_fields_summary.map((f) => (
                        <span
                          key={f}
                          className="px-1.5 py-0.5 border border-neutral-300 bg-neutral-50 text-[10px] text-neutral-600"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-4 px-5 border-r border-neutral-200 text-center">
                    <button
                      onClick={() => handleToggleStatus(c)}
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase border transition-colors ${
                        c.status === "active"
                          ? "border-emerald-600 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                          : "border-neutral-300 text-neutral-500 bg-neutral-100 hover:bg-neutral-200"
                      }`}
                    >
                      {c.status}
                    </button>
                  </td>

                  <td className="py-4 px-5 border-r border-neutral-200 text-right font-bold text-black">
                    {c.total_requests}
                  </td>

                  <td className="py-4 px-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/connectors/${c.id}/test`}
                        className="p-1.5 border border-black hover:bg-[#DE6E4B] transition-colors"
                        title="Interactive Playground"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/connectors/${c.slug}/docs`}
                        className="p-1.5 border border-neutral-300 hover:border-black transition-colors"
                        title="API Docs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/connectors/${c.id}/stats`}
                        className="p-1.5 border border-neutral-300 hover:border-black transition-colors"
                        title="Stats & Telemetry"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/connectors/${c.id}/edit`}
                        className="p-1.5 border border-neutral-300 hover:border-black transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleRegenerateKey(c)}
                        className="p-1.5 border border-neutral-300 hover:border-black transition-colors"
                        title="Rotate Key"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 border border-neutral-300 hover:border-red-600 hover:text-red-600 transition-colors text-neutral-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
