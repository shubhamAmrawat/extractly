"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { LogIn, UserPlus, Sparkles, Mail, Lock, User, ArrowLeft, Sun, Moon } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { isLoggedIn, setIsLoggedIn, theme, toggleTheme } = useApp();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (tab === "signup" && !name)) {
      alert("Please fill in all required fields.");
      return;
    }
    
    setLoading(true);
    // Simulate API authorization
    setTimeout(() => {
      setIsLoggedIn(true);
      setLoading(false);
      router.push("/");
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 transition-colors duration-250 relative overflow-hidden px-4">
      {/* Premium Background Blurs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/5 dark:bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500/5 dark:bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Standalone Header Toolbar (Back button + Theme switch) */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors py-1.5 px-3 rounded-[5px] hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        <button
          onClick={toggleTheme}
          className="rounded-[5px] p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-850 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 transition-all cursor-pointer"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[420px] z-10 py-12 flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center space-y-3 mb-8 flex flex-col items-center">
          <Link href="/" className="inline-flex hover:scale-105 transition-transform">
            <img src="/logo_light.png" alt="Extractly Logo" className="h-10 w-10 object-contain rounded-[5px] bg-white p-1 shadow-md" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white pt-2">
            {tab === "login" ? "Welcome back to Extractly" : "Create your Extractly account"}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto font-medium">
            {tab === "login" 
              ? "Access your dashboard, history, and advanced cloud utilities." 
              : "Get started with advanced tools and workspace customizations."}
          </p>
        </div>

        {/* Card Component */}
        <div className="w-full bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/80 rounded-[5px] p-8 shadow-xl dark:shadow-2xl/40 backdrop-blur-md space-y-6 animate-fade-in">
          
          {/* Tab Switcher */}
          <div className="flex rounded-[5px] border border-neutral-200/80 p-1 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 rounded-[5px] py-2 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === "login"
                  ? "bg-neutral-950 text-white dark:bg-white dark:text-black shadow-sm"
                  : "text-neutral-500 hover:text-neutral-850 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Login</span>
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 rounded-[5px] py-2 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === "signup"
                  ? "bg-neutral-950 text-white dark:bg-white dark:text-black shadow-sm"
                  : "text-neutral-500 hover:text-neutral-855 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Social login option */}
          <button
            type="button"
            onClick={() => {
              setIsLoggedIn(true);
              router.push("/");
            }}
            className="flex items-center justify-center gap-2.5 w-full rounded-[5px] border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800/80 transition-all shadow-sm cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Separator */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800/80"></div>
            <span className="flex-shrink mx-4 text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800/80"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "signup" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-450 dark:text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Rivers"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-[5px] border border-neutral-200 bg-white pl-9 pr-4 py-2 text-xs outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-700 text-neutral-800 dark:text-neutral-100 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-450 dark:text-neutral-500" />
                <input
                  type="email"
                  required
                  placeholder="alex@extractly.design"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[5px] border border-neutral-200 bg-white pl-9 pr-4 py-2 text-xs outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-700 text-neutral-800 dark:text-neutral-100 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Password</label>
                {tab === "login" && (
                  <button type="button" onClick={() => alert("Password reset link sent to your email!")} className="text-[9px] font-bold text-neutral-450 hover:text-neutral-800 dark:text-neutral-450 dark:hover:text-neutral-200 transition-colors cursor-pointer">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-450 dark:text-neutral-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[5px] border border-neutral-200 bg-white pl-9 pr-4 py-2 text-xs outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-700 text-neutral-800 dark:text-neutral-100 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full rounded-[5px] bg-neutral-950 py-2.5 text-xs font-bold text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 transition-all disabled:opacity-50 cursor-pointer shadow-md mt-2"
            >
              {loading ? (
                <span>Authorizing...</span>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-violet-500 fill-violet-500 dark:text-violet-400 dark:fill-violet-400" />
                  <span>{tab === "login" ? "Sign In to Account" : "Create Account"}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Mock Mode bypass helper */}
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 text-center">
            <button
              onClick={() => {
                setIsLoggedIn(true);
                router.push("/");
              }}
              className="text-[9px] font-bold text-neutral-400 hover:text-neutral-800 dark:text-neutral-500 dark:hover:text-neutral-300 uppercase tracking-widest transition-colors cursor-pointer"
            >
              Bypass Auth (Quick Demo Mode)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
