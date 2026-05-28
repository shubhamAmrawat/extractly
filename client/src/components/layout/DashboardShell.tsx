"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useApp } from "@/context/AppContext";

interface DashboardShellProps {
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSidebarCollapsed } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Layout Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
        isSidebarCollapsed ? "md:pl-16" : "md:pl-60"
      }`}>
        {/* Navbar */}
        <Navbar setMobileOpen={setMobileOpen} />

        {/* Content Viewport */}
        <main className="flex-1 overflow-x-hidden">
          <div className="w-full max-w-6xl mx-auto px-4 py-8 md:px-8 md:py-10 animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
};
