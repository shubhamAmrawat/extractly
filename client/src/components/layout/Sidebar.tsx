"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { TOOLS, CATEGORIES, getIcon } from "@/data/tools";
import { 
  Search, 
  Settings, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Clock, 
  Sun, 
  Moon, 
  LayoutDashboard,
  LogIn,
  LogOut,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    theme, 
    toggleTheme, 
    setCommandPaletteOpen, 
    recentTools,
    isSidebarCollapsed,
    toggleSidebar,
    isLoggedIn,
    setIsLoggedIn,
    user
  } = useApp();
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "PDF Tools": true,
    "Image Tools": true,
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "PDF Tools":
        return "text-red-500 dark:text-red-400";
      case "Image Tools":
        return "text-blue-500 dark:text-blue-400";
      case "Video Tools":
        return "text-indigo-500 dark:text-indigo-400";
      case "Audio Tools":
        return "text-emerald-500 dark:text-emerald-400";
      case "Document & Text":
        return "text-amber-500 dark:text-amber-400";
      case "Developer Utilities":
        return "text-cyan-500 dark:text-cyan-400";
      case "Creator & Media":
        return "text-fuchsia-500 dark:text-fuchsia-400";
      default:
        return "text-neutral-600 dark:text-neutral-300";
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryIconName = category === "PDF Tools" ? "FilePlus" 
                          : category === "Image Tools" ? "ImageIcon"
                          : category === "Video Tools" ? "Video"
                          : category === "Audio Tools" ? "Music"
                          : category === "Document & Text" ? "PenTool"
                          : category === "Developer Utilities" ? "Code"
                          : "Palette";
    return getIcon(categoryIconName);
  };

  const toggleCategory = (category: string) => {
    if (isSidebarCollapsed) {
      toggleSidebar(); // Auto-expand if category clicked when collapsed
      return;
    }
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const navItemClass = (path: string, ignoreActive: boolean = false) => {
    const isActive = !ignoreActive && pathname === path;
    return `flex items-center rounded-lg text-[11px] font-semibold transition-all ${
      isSidebarCollapsed ? "justify-center h-8 w-8 mx-auto" : "px-3 py-1.5 gap-2.5 w-full"
    } ${
      isActive
        ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-950 font-bold"
        : "text-neutral-600 hover:bg-neutral-105 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
    }`;
  };

  const sidebarContent = (
    <div className={`flex h-full flex-col bg-neutral-50/50 border-r border-neutral-200/80 py-5 dark:bg-neutral-900/30 dark:border-neutral-900/60 transition-all duration-205 ${
      isSidebarCollapsed ? "px-2" : "px-4"
    }`}>
      
      {/* Brand Header */}
      <div className={`flex items-center mb-6 ${
        isSidebarCollapsed ? "flex-col gap-3 justify-center" : "justify-between"
      }`}>
        <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <img src="/logo_light.png" alt="Extractly Logo" className="h-7 w-7 object-contain rounded-[5px] bg-white p-0.5 shadow-sm" />
          {!isSidebarCollapsed && (
            <span className="text-sm font-bold tracking-tight font-sans text-neutral-850 dark:text-neutral-100">Extractly</span>
          )}
        </Link>
        
        <button
          onClick={toggleSidebar}
          className={`rounded-lg p-1 text-neutral-500 hover:bg-neutral-150 hover:text-neutral-850 dark:text-neutral-450 dark:hover:bg-neutral-900 dark:hover:text-neutral-200 transition-colors ${
            isSidebarCollapsed ? "mx-auto" : ""
          }`}
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Raycast-style search trigger */}
      <button
        onClick={() => {
          setMobileOpen(false);
          setCommandPaletteOpen(true);
        }}
        className={`flex items-center rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:border-neutral-700 transition-colors mb-4 ${
          isSidebarCollapsed ? "h-8 w-8 justify-center mx-auto" : "px-3 py-2 w-full"
        }`}
        title="Search tools (Cmd+K)"
      >
        <Search className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
        {!isSidebarCollapsed && (
          <>
            <span className="text-[11px] flex-1 text-left text-neutral-500 ml-2 dark:text-neutral-400">Search tools...</span>
            <div className="flex items-center gap-0.5 rounded border border-neutral-200/80 bg-neutral-50 px-1 py-0.5 text-[8px] font-bold text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400">
              <span>⌘</span>
              <span>K</span>
            </div>
          </>
        )}
      </button>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 -mr-2 scrollbar-none">
        
        {/* Dashboard Link */}
        <div className="space-y-1">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={navItemClass("/")}
            title="Dashboard"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-white-600 dark:text-black-300" />
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </Link>
        </div>

        {/* Recently Used Tools */}
        {recentTools.length > 0 && (
          <div className="space-y-1">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                <Clock className="h-3 w-3" />
                <span>Recent Utilities</span>
              </div>
            ) : (
              <div className="h-[1px] bg-neutral-200 dark:bg-neutral-850 my-2 mx-2" />
            )}
            {recentTools.map((tool) => {
              const Icon = getIcon(tool.iconName);
              return (
                <Link
                  key={tool.id}
                  href={tool.path}
                  onClick={() => setMobileOpen(false)}
                  className={navItemClass(tool.path, true)}
                  title={tool.name}
                >
                  <Icon className={`h-3.5 w-3.5 ${getCategoryColor(tool.category)}`} />
                  {!isSidebarCollapsed && <span className="truncate">{tool.name}</span>}
                </Link>
              );
            })}
          </div>
        )}

        {/* Categories and Tools */}
        <div className="space-y-3">
          {!isSidebarCollapsed ? (
            <div className="px-3 py-1 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              <span>Utilities</span>
            </div>
          ) : (
            <div className="h-[1px] bg-neutral-200 dark:bg-neutral-850 my-2 mx-2" />
          )}

          {CATEGORIES.map((category) => {
            const isExpanded = !!expandedCategories[category];
            const categoryTools = TOOLS.filter((t) => t.category === category);
            const CategoryIcon = getCategoryIcon(category);
            
            if (isSidebarCollapsed) {
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-805 mx-auto"
                  title={`Expand ${category}`}
                >
                  <CategoryIcon className={`h-4 w-4 ${getCategoryColor(category)}`} />
                </button>
              );
            }

            return (
              <div key={category} className="space-y-1">
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center justify-between w-full rounded-md px-3 py-1 text-[11px] font-semibold text-neutral-700 dark:text-neutral-355 hover:bg-neutral-150 dark:hover:bg-neutral-800/40"
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon className={`h-3.5 w-3.5 ${getCategoryColor(category)}`} />
                    <span>{category}</span>
                  </div>
                  <ChevronRight className={`h-3 w-3 text-neutral-500 dark:text-neutral-400 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`} />
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden pl-5 space-y-0.5"
                    >
                      {categoryTools.map((tool) => {
                        const Icon = getIcon(tool.iconName);
                        return (
                          <Link
                            key={tool.id}
                            href={tool.path}
                            onClick={() => setMobileOpen(false)}
                            className={navItemClass(tool.path)}
                            title={tool.name}
                          >
                            <Icon className={`h-3.5 w-3.5 ${getCategoryColor(tool.category)}`} />
                            <span className="truncate">{tool.name}</span>
                            {tool.status === "new" && (
                              <span className="ml-auto text-[7px] font-bold text-violet-500 bg-violet-500/10 px-1 py-0.2 rounded">
                                NEW
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="pt-4 border-t border-neutral-200/80 dark:border-neutral-900/60 mt-auto space-y-3">
        
        {/* Dynamic Auth & Profile Block */}
        {isLoggedIn ? (
          // Logged In State
          isSidebarCollapsed ? (
            <div className="flex flex-col gap-2 items-center">
              <Link 
                href="/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-white font-semibold text-xs shadow-sm hover:scale-105 transition-transform"
                title={`${user?.name} (${user?.email})`}
              >
                {user?.name.split(" ").map(n => n[0]).join("")}
              </Link>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-900 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-neutral-100/50 p-2.5 rounded-xl border border-neutral-200/50 dark:bg-neutral-900/40 dark:border-neutral-800/80">
              <Link href="/profile" className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-500 text-white font-semibold text-xs shadow-sm">
                  {user?.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="text-left min-w-0">
                  <div className="text-[10px] font-bold text-neutral-850 dark:text-neutral-200 truncate leading-tight">{user?.name}</div>
                  <div className="text-[8px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5 leading-none">{user?.email}</div>
                </div>
              </Link>
              <div className="flex gap-0.5">
                <button
                  onClick={() => router.push("/profile")}
                  className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
                  title="Profile Settings"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-200 hover:text-red-550 dark:hover:bg-neutral-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        ) : (
          // Logged Out State
          isSidebarCollapsed ? (
            <button
              onClick={() => router.push("/auth")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-350 hover:text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 mx-auto"
              title="Sign In / Register"
            >
              <LogIn className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => router.push("/auth")}
              className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-neutral-950 border border-neutral-850 px-3 py-2 text-xs font-bold text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:border-neutral-200 dark:hover:bg-neutral-100 transition-colors shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Login / Signup</span>
            </button>
          )
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent toggleable panel) */}
      <aside className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 z-20 transition-all duration-200 ${
        isSidebarCollapsed ? "md:w-16" : "md:w-60"
      }`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Collapsible slide-out) */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            {/* Slide drawer panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="relative w-64 max-w-xs flex-1 flex flex-col z-50 h-full"
            >
              {/* Close Button Inside Drawer */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 z-50 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
