import { auth } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type FieldType = "text" | "number" | "boolean" | "image" | "file" | "json";
export type ConnectorStatus = "active" | "disabled";

export interface InputField {
  id?: number;
  connector_id?: number;
  name: string;
  field_type: FieldType;
  required: boolean;
  description: string;
  default_value?: string | null;
  validation_rules?: Record<string, any>;
  order: number;
}

export interface Connector {
  id: number;
  slug: string;
  name: string;
  description: string;
  provider: string;
  model: string;
  system_prompt: string;
  output_schema: Record<string, any>;
  status: ConnectorStatus;
  created_at: string;
  updated_at: string;
  input_fields: InputField[];
}

export interface ConnectorSummary {
  id: number;
  slug: string;
  name: string;
  description: string;
  provider: string;
  model: string;
  status: ConnectorStatus;
  total_requests: number;
  success_rate: number;
  last_used?: string | null;
  created_at: string;
  updated_at: string;
  input_fields_summary: string[];
}

export interface ConnectorCreatePayload {
  name: string;
  slug: string;
  description: string;
  provider: string;
  model: string;
  system_prompt: string;
  output_schema: Record<string, any>;
  status: ConnectorStatus;
  input_fields: Omit<InputField, "id" | "connector_id">[];
}

export interface ConnectorKeyResponse {
  connector_id: number;
  slug: string;
  name: string;
  api_key: string;
  message: string;
}

export interface RequestLogRow {
  id: number;
  status: string;
  request_timestamp: string;
  response_time_ms: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  provider: string;
  model: string;
  error_type?: string | null;
  error_message?: string | null;
  request_preview?: string | null;
  response_preview?: string | null;
}

export interface ConnectorStats {
  connector_id: number;
  slug: string;
  name: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate_percent: number;
  average_response_time_ms: number;
  total_tokens: number;
  estimated_total_cost: number;
  first_used?: string | null;
  last_used?: string | null;
  recent_logs: RequestLogRow[];
}

export interface GlobalStats {
  total_connectors: number;
  active_connectors: number;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  global_success_rate: number;
  total_estimated_cost: number;
  providers_configured: string[];
}

export interface DocParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default_value?: string | null;
  validation_rules: Record<string, any>;
}

export interface ConnectorDocResponse {
  slug: string;
  name: string;
  description: string;
  endpoint_url: string;
  http_method: string;
  content_type: string;
  auth_header: string;
  provider: string;
  model: string;
  parameters: DocParam[];
  output_schema: Record<string, any>;
  example_request_json?: Record<string, any> | null;
  example_success_response: Record<string, any>;
  example_error_responses: Record<string, Record<string, any>>;
  curl_snippet: string;
  python_snippet: string;
  javascript_snippet: string;
}

export interface ErrorDetail {
  type: string;
  message: string;
}

export interface ExecutionMeta {
  latency_ms: number;
  tokens: number;
  estimated_cost: number;
  provider: string;
  model: string;
}

export interface InvokeResponse {
  success: boolean;
  data: any;
  error: ErrorDetail | null;
  meta?: ExecutionMeta | null;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  context_window?: number;
  description?: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  configured: boolean;
}

// Typed API Client
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = auth.getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Set application/json only if body is not FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.detail || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Authentication
  async login(email: string, password: string) {
    const data = await request<{ access_token: string; expires_in: number; email: string }>("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    auth.setToken(data.access_token, data.email);
    return data;
  },

  async getMe() {
    return request<{ id: number; email: string; created_at: string }>("/api/admin/auth/me");
  },

  // Connectors (Supports unauthenticated evaluation fallback)
  async listConnectors(): Promise<ConnectorSummary[]> {
    if (auth.isAuthenticated()) {
      try {
        return await request<ConnectorSummary[]>("/api/admin/connectors");
      } catch {
        return request<ConnectorSummary[]>("/api/connectors/public");
      }
    }
    return request<ConnectorSummary[]>("/api/connectors/public");
  },

  async getConnector(id: number | string): Promise<Connector> {
    if (auth.isAuthenticated()) {
      try {
        return await request<Connector>(`/api/admin/connectors/${id}`);
      } catch {
        return request<Connector>(`/api/connectors/public/${id}`);
      }
    }
    return request<Connector>(`/api/connectors/public/${id}`);
  },

  async createConnector(payload: ConnectorCreatePayload): Promise<ConnectorKeyResponse> {
    return request<ConnectorKeyResponse>("/api/admin/connectors", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateConnector(id: number | string, payload: Partial<ConnectorCreatePayload>): Promise<Connector> {
    return request<Connector>(`/api/admin/connectors/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteConnector(id: number | string): Promise<void> {
    const url = `${API_BASE_URL}/api/admin/connectors/${id}`;
    const token = auth.getToken();
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to delete connector: ${res.statusText}`);
    }
  },

  async toggleConnectorStatus(id: number | string, status: ConnectorStatus): Promise<{ status: string }> {
    return request<{ status: string }>(`/api/admin/connectors/${id}/status?status=${status}`, {
      method: "PATCH",
    });
  },

  async regenerateKey(id: number | string): Promise<ConnectorKeyResponse> {
    return request<ConnectorKeyResponse>(`/api/admin/connectors/${id}/regenerate-key`, {
      method: "POST",
    });
  },

  async getConnectorStats(id: number | string, limit = 50): Promise<ConnectorStats> {
    return request<ConnectorStats>(`/api/admin/connectors/${id}/stats?limit=${limit}`);
  },

  // Documentation (Publicly accessible)
  async getConnectorDocs(slug: string): Promise<ConnectorDocResponse> {
    return request<ConnectorDocResponse>(`/api/connectors/${slug}/docs`);
  },

  // Global Platform Metrics
  async getGlobalStats(): Promise<GlobalStats> {
    return request<GlobalStats>("/api/admin/stats/global");
  },

  // Providers & Models
  async listProviders(): Promise<ProviderInfo[]> {
    return request<ProviderInfo[]>("/api/admin/providers");
  },

  async listModels(provider: string): Promise<ModelInfo[]> {
    return request<ModelInfo[]>(`/api/admin/providers/${provider}/models`);
  },

  async refreshModels(provider: string): Promise<ModelInfo[]> {
    return request<ModelInfo[]>(`/api/admin/providers/${provider}/refresh-models`, {
      method: "POST",
    });
  },

  // Dynamic Invocation (Accepts FormData or JSON, with optional API key or Admin token)
  async invokeConnector(
    slug: string,
    body: FormData | Record<string, any>,
    apiKey?: string
  ): Promise<InvokeResponse> {
    const url = `${API_BASE_URL}/api/connectors/${slug}/invoke`;
    const headers: Record<string, string> = {};

    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    } else {
      const token = auth.getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const isFormData = body instanceof FormData;
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: isFormData ? body : JSON.stringify(body),
    });

    const result = await response.json();
    return result as InvokeResponse;
  }
};
