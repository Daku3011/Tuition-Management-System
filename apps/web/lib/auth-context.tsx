"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, UserRole, TokenResponse } from "@tms/shared-types";
import { apiClient } from "./api-client";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("tms_access_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      try {
        const userData = await apiClient.get<User>("/auth/me");
        setUser(userData);
      } catch (err) {
        console.warn("Session restore failed, clearing storage");
        localStorage.removeItem("tms_access_token");
        localStorage.removeItem("tms_user");
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const resp = await apiClient.post<TokenResponse>("/auth/login", { email, password });
      const { access_token, user: loggedUser } = resp;

      localStorage.setItem("tms_access_token", access_token);
      localStorage.setItem("tms_user", JSON.stringify(loggedUser));
      setUser(loggedUser);
      setToken(access_token);

      // Role-based routing
      if (loggedUser.role === "ADMIN" || loggedUser.role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
      } else if (loggedUser.role === "FACULTY") {
        router.push("/faculty/dashboard");
      } else if (loggedUser.role === "STUDENT") {
        router.push("/student/dashboard");
      } else {
        router.push("/");
      }

      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("tms_access_token");
    localStorage.removeItem("tms_user");
    setUser(null);
    setToken(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
