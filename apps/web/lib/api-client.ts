const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  errorCode: string;
  details?: any[];
  status: number;

  constructor(message: string, errorCode: string = "API_ERROR", status: number = 400, details?: any[]) {
    super(message);
    this.name = "ApiError";
    this.errorCode = errorCode;
    this.status = status;
    this.details = details;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  }

  private getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tms_access_token");
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers = {}, ...restOptions } = options;

    let url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes("?") ? "&" : "?") + qs;
      }
    }

    const token = this.getToken();
    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string>),
    };

    const res = await fetch(url, {
      headers: defaultHeaders,
      ...restOptions,
    });

    if (res.status === 401 && typeof window !== "undefined") {
      // Clear token and redirect to login if session invalidated
      localStorage.removeItem("tms_access_token");
      localStorage.removeItem("tms_user");
    }

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.detail || json?.message || "An unexpected error occurred";
      const errorCode = json?.error_code || "REQUEST_FAILED";
      const details = json?.details;
      throw new ApiError(errorMsg, errorCode, res.status, details);
    }

    return json?.data !== undefined ? json.data : json;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", params });
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  getDownloadUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  }
}

export const apiClient = new ApiClient(BASE_URL);
