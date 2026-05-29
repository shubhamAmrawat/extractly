"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { TOOLS } from "@/data/tools";
import { Menu, Search, GitBranch, HelpCircle, ArrowLeft, Home, Sun, Moon } from "lucide-react";

interface NavbarProps {
  setMobileOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setMobileOpen }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { setCommandPaletteOpen, theme, toggleTheme } = useApp();

  // Find active tool from route to render breadcrumbs
  const activeTool = TOOLS.find((t) => t.path === pathname);

  const handleBack = () => {
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-neutral-900 dark:bg-neutral-950/80 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900 md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Navigation Breadcrumb / Path */}
        <nav className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>
          
          {activeTool && (
            <>
              <span>/</span>
              <span className="text-neutral-300 dark:text-neutral-700">{activeTool.category.replace(" Tools", "")}</span>
              <span>/</span>
              <span className="font-semibold text-neutral-950 dark:text-neutral-100">{activeTool.name}</span>
            </>
          )}
        </nav>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          title="Search utilities (Cmd+K)"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Back button when on detail page */}
        {pathname !== "/" && (
          <button
            onClick={handleBack}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-[10px] font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-300 cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Dashboard</span>
          </button>
        )}

        <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-850 mx-1" />

        {/* Platform Wide Theme Switch */}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-150 hover:text-neutral-700 dark:hover:bg-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-205 transition-colors cursor-pointer"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Github Link / Docs */}
        {/* <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 transition-colors"
          title="View Source on GitHub"
        >
          <GitBranch className="h-4 w-4" />
        </a> */}

        {/* <a
          href="#"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 transition-colors"
          title="Help & FAQ"
        >
          <HelpCircle className="h-4 w-4" />
        </a> */}
      </div>
    </header>
  );
};
