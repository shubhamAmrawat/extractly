"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Tool, TOOLS } from "@/data/tools";

interface UserType {
  name: string;
  email: string;
}

interface AppContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  recentTools: Tool[];
  addRecentTool: (id: string) => void;
  clearRecentTools: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  user: UserType | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<"light" | "dark">("dark"); // Default to dark for premium SaaS style
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    // Check local storage for theme
    const savedTheme = localStorage.getItem("extractly-theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      document.documentElement.classList.add("dark");
    }

    // Check local storage for recent tools
    const savedRecent = localStorage.getItem("extractly-recent-tools");
    if (savedRecent) {
      try {
        setRecentToolIds(JSON.parse(savedRecent));
      } catch (e) {
        console.error("Failed to parse recent tools", e);
      }
    }

    // Check local storage for sidebar state
    const savedSidebar = localStorage.getItem("extractly-sidebar-collapsed");
    if (savedSidebar) {
      setIsSidebarCollapsed(savedSidebar === "true");
    }

    // Check local storage for login status
    const savedLogin = localStorage.getItem("extractly-logged-in");
    if (savedLogin === "true") {
      setIsLoggedIn(true);
      setUser({ name: "Alex Rivers", email: "alex@extractly.design" });
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextTheme = prev === "light" ? "dark" : "light";
      localStorage.setItem("extractly-theme", nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      return nextTheme;
    });
  }, []);

  const addRecentTool = useCallback((id: string) => {
    setRecentToolIds((prev) => {
      const filtered = prev.filter((item) => item !== id);
      const updated = [id, ...filtered].slice(0, 4); // Keep top 4
      localStorage.setItem("extractly-recent-tools", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentTools = useCallback(() => {
    setRecentToolIds([]);
    localStorage.removeItem("extractly-recent-tools");
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const nextVal = !prev;
      localStorage.setItem("extractly-sidebar-collapsed", String(nextVal));
      return nextVal;
    });
  }, []);

  const handleSetIsLoggedIn = useCallback((loggedIn: boolean) => {
    setIsLoggedIn(loggedIn);
    localStorage.setItem("extractly-logged-in", String(loggedIn));
    if (loggedIn) {
      setUser({ name: "Alex Rivers", email: "alex@extractly.design" });
    } else {
      setUser(null);
    }
  }, []);

  // Map IDs to actual Tool definitions
  const recentTools = recentToolIds
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter((t): t is Tool => !!t);

  // Command palette shortcut keys helper (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen]);

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        searchQuery,
        setSearchQuery,
        recentTools,
        addRecentTool,
        clearRecentTools,
        isSidebarCollapsed,
        toggleSidebar,
        isLoggedIn,
        setIsLoggedIn: handleSetIsLoggedIn,
        user,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
