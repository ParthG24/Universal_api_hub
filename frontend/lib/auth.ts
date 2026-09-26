"use client";

const TOKEN_KEY = "universal_hub_admin_token";
const EMAIL_KEY = "universal_hub_admin_email";

export const auth = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string, email: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EMAIL_KEY, email);
  },

  getEmail(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(EMAIL_KEY);
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
