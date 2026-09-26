"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ConnectorStats, RequestLogRow } from "@/lib/api";
import { auth } from "@/lib/auth";
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  FileCode,
  Coins,
  RefreshCw,
  Play,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ConnectorStatsPage() {
  const params = useParams();
  const connectorId = params.id as string;

  const [stats, setStats] = useState<ConnectorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  useEffect(() => {
    loadStats();
  }, [connectorId]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      let id = connectorId;
      if (isNaN(Number(connectorId))) {
        const list = await api.listConnectors();
        const found = list.find((c) => c.slug === connectorId);
        if (!found) throw new Error("Connector not found");
        id = String(found.id);
      }
      const data = await api.getConnectorStats(id, 100);
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load usage statistics.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center font-mono text-xs">
        Loading analytics & logs...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="border-2 border-red-600 bg-red-50 p-6 text-xs font-mono text-red-700">
          {error || "Statistics not available."}
        </div>
        <Link href="/dashboard" className="btn-brutal text-xs py-2 px-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-mono font-bold text-neutral-600 hover:text-black uppercase"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-neutral-400">/</span>
            <span className="font-mono text-xs text-neutral-500 font-bold uppercase">
              Usage & Observability
            </span>
          </div>

          <h1 className="text-3xl font-mono font-black uppercase text-black mt-2">
            {stats.name} — METRICS & LOGS
          </h1>
          <p className="font-mono text-xs text-neutral-600 mt-1">
            Persistent execution history, token consumption, latency, and cost telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStats}
            className="btn-brutal text-xs py-2 px-3"
            title="Refresh metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Link
            href={`/connectors/${stats.connector_id}/test`}
            className="btn-brutal btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-[3px_3px_0px_#000]"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Test Console</span>
          </Link>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 font-mono">
        <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000]">
          <div className="text-[10px] uppercase font-bold text-neutral-500">Total Invocations</div>
          <div className="text-3xl font-black text-black mt-1">{stats.total_requests}</div>
        </div>

        <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000]">
          <div className="text-[10px] uppercase font-bold text-neutral-500">Success Rate</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">
            {stats.success_rate_percent}%
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            {stats.successful_requests} ok / {stats.failed_requests} fail
          </div>
        </div>

        <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000]">
          <div className="text-[10px] uppercase font-bold text-neutral-500">Avg Latency</div>
          <div className="text-3xl font-black text-black mt-1">
            {stats.average_response_time_ms}
            <span className="text-xs font-normal text-neutral-400">ms</span>
          </div>
        </div>

        <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000]">
          <div className="text-[10px] uppercase font-bold text-neutral-500">Total Tokens</div>
          <div className="text-3xl font-black text-black mt-1">{stats.total_tokens}</div>
        </div>

        <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#DE6E4B] col-span-2 lg:col-span-1">
          <div className="text-[10px] uppercase font-bold text-neutral-500">Total Cost</div>
          <div className="text-3xl font-black text-black mt-1">
            ${stats.estimated_total_cost.toFixed(6)}
          </div>
        </div>
      </div>

      {/* Visual Distribution Chart / Bar */}
      <div className="border-2 border-black bg-white p-6 shadow-[6px_6px_0px_#000] space-y-4">
        <h2 className="text-base font-mono font-black uppercase text-black">
          Success / Failure Volume Breakdown
        </h2>

        {stats.total_requests > 0 ? (
          <div className="space-y-2">
            <div className="w-full h-8 border-2 border-black flex overflow-hidden">
              <div
                style={{
                  width: `${(stats.successful_requests / stats.total_requests) * 100}%`,
                }}
                className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-mono font-bold text-black"
                title={`${stats.successful_requests} Successful requests`}
              >
                {stats.successful_requests > 0 && `${Math.round((stats.successful_requests / stats.total_requests) * 100)}%`}
              </div>
              <div
                style={{
                  width: `${(stats.failed_requests / stats.total_requests) * 100}%`,
                }}
                className="bg-red-500 h-full flex items-center justify-center text-[10px] font-mono font-bold text-white"
                title={`${stats.failed_requests} Failed requests`}
              >
                {stats.failed_requests > 0 && `${Math.round((stats.failed_requests / stats.total_requests) * 100)}%`}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-neutral-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-500 border border-black inline-block" />
                <span>Success: {stats.successful_requests}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 border border-black inline-block" />
                <span>Failed: {stats.failed_requests}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="font-mono text-xs text-neutral-500">No requests recorded yet.</p>
        )}
      </div>

      {/* Recent Request Logs Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-mono font-black uppercase text-black">
          Recent Request Logs ({stats.recent_logs.length})
        </h2>

        {stats.recent_logs.length === 0 ? (
          <div className="border-2 border-black p-8 text-center font-mono text-xs text-neutral-500 bg-white">
            No execution logs found for this connector yet. Try invoking it from the Test Console!
          </div>
        ) : (
          <div className="border-2 border-black shadow-[6px_6px_0px_#000] overflow-hidden bg-white">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-neutral-100 border-b-2 border-black text-[11px] font-black uppercase tracking-wider">
                  <th className="py-2.5 px-4 border-r border-black">Status</th>
                  <th className="py-2.5 px-4 border-r border-black">Timestamp</th>
                  <th className="py-2.5 px-4 border-r border-black text-right">Latency</th>
                  <th className="py-2.5 px-4 border-r border-black text-right">Tokens (In / Out)</th>
                  <th className="py-2.5 px-4 border-r border-black text-right">Cost</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/20">
                {stats.recent_logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const dateStr = new Date(log.request_timestamp).toLocaleString();

                  return (
                    <tr key={log.id} className="group hover:bg-neutral-50">
                      <td className="py-3 px-4 border-r border-black">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase border border-black ${
                            log.status === "success"
                              ? "bg-emerald-100 text-emerald-900 border-emerald-900"
                              : "bg-red-100 text-red-900 border-red-900"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 border-r border-black text-neutral-600 whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-3 px-4 border-r border-black text-right font-bold">
                        {log.response_time_ms} ms
                      </td>

                      <td className="py-3 px-4 border-r border-black text-right text-neutral-700">
                        {log.total_tokens} ({log.input_tokens} / {log.output_tokens})
                      </td>

                      <td className="py-3 px-4 border-r border-black text-right text-emerald-800 font-bold">
                        ${log.estimated_cost.toFixed(6)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {log.error_type && (
                            <div className="text-[11px] text-red-700 font-bold uppercase">
                              [{log.error_type}]: {log.error_message}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleExpand(log.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#DE6E4B] hover:underline font-bold"
                          >
                            <span>{isExpanded ? "Hide Preview" : "View Preview"}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-3 border border-black bg-[#121314] text-[11px] text-neutral-200 space-y-2">
                              {log.request_preview && (
                                <div>
                                  <div className="text-neutral-500 uppercase text-[9px] font-bold">Request Payload:</div>
                                  <pre className="text-amber-200 overflow-x-auto whitespace-pre-wrap">{log.request_preview}</pre>
                                </div>
                              )}
                              {log.response_preview && (
                                <div>
                                  <div className="text-neutral-500 uppercase text-[9px] font-bold">AI Response:</div>
                                  <pre className="text-emerald-300 overflow-x-auto whitespace-pre-wrap">{log.response_preview}</pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
