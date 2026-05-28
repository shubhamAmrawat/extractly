"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { User, Mail, Shield, HardDrive, LogOut, Key, Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const router = useRouter();
  const { isLoggedIn, setIsLoggedIn, user } = useApp();
  const [name, setName] = useState(user?.name || "Alex Rivers");
  const [email, setEmail] = useState(user?.email || "alex@extractly.design");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    router.push("/");
  };

  if (!isLoggedIn) {
    return (
      <DashboardShell>
        <div className="max-w-md mx-auto py-16 text-center bg-white border border-neutral-200 rounded-2xl p-6 dark:border-neutral-850 dark:bg-neutral-900/30">
          <AlertCircle className="h-10 w-10 text-neutral-400 dark:text-neutral-500 mx-auto stroke-[1.5] mb-3" />
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Access Restricted</h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-[280px] mx-auto">
            You must be logged in to view your profile settings dashboard.
          </p>
          <button 
            onClick={() => router.push("/auth")} 
            className="mt-5 rounded-lg bg-neutral-950 px-5 py-2 text-xs font-semibold text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100"
          >
            Go to Login
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Profile Title Header */}
        <div className="flex items-center gap-4 border-b border-neutral-100 dark:border-neutral-900 pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500 text-white font-bold text-sm shadow">
            {user?.name.split(" ").map(n => n[0]).join("") || "AR"}
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Account Dashboard</h1>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-semibold">
              PRO ACCOUNT • ACTIVE USER
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Settings Options Panel Column */}
          <div className="md:col-span-2 space-y-4">
            <form onSubmit={handleSave} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-850 dark:bg-neutral-900/30 space-y-4">
              <h2 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-4.5 w-4.5 text-neutral-400" />
                <span>Profile Credentials</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-700"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-700"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 transition-colors shadow-sm"
                >
                  {isSaved ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Changes Saved!</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>

            {/* Change Password Block */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-850 dark:bg-neutral-900/30 space-y-4">
              <h2 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Key className="h-4.5 w-4.5 text-neutral-400" />
                <span>Security Credentials</span>
              </h2>

              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-700"
                    />
                  </div>
                </div>
                <button
                  onClick={() => alert("Password changes updated successfully!")}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Right Info Column (Plan Details & Storage info) */}
          <div className="space-y-4">
            
            {/* Plan Info Card */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-left dark:border-neutral-850 dark:bg-neutral-900/40">
              <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-violet-500" />
                <span>Subscription</span>
              </div>
              <div className="mt-3">
                <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Developer Pro Plan</div>
                <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-1 leading-normal">
                  Enjoy unlimited local conversions, priority support, and multi-file processing pipelines.
                </p>
                <div className="mt-4 text-[9px] font-bold text-violet-500 bg-violet-500/10 px-2 py-1 rounded text-center uppercase tracking-wider">
                  Renews June 28, 2026
                </div>
              </div>
            </div>

            {/* Local Storage metrics */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-left dark:border-neutral-850 dark:bg-neutral-900/40">
              <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-neutral-400" />
                <span>Local Buffer Storage</span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-[9px] font-semibold text-neutral-400 mb-1.5">
                  <span>STORAGE SPACE USED</span>
                  <span>14.2 MB / 100 MB</span>
                </div>
                {/* Visual storage meter bar */}
                <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden dark:bg-neutral-800">
                  <div className="h-full bg-neutral-900 dark:bg-white rounded-full" style={{ width: "14.2%" }} />
                </div>
                <p className="text-[8px] text-neutral-400 dark:text-neutral-500 mt-2 leading-relaxed">
                  Cached files are saved strictly in your local browser sandbox to enable fast offline conversion.
                </p>
                <button
                  onClick={() => alert("Local client cache database cleared!")}
                  className="mt-3 text-[9px] font-bold text-neutral-400 hover:text-red-500 uppercase tracking-wider transition-colors block"
                >
                  Clear Cached Workspace
                </button>
              </div>
            </div>

            {/* Red Sign Out action */}
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-red-550/20 bg-red-500/5 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors shadow-sm dark:bg-red-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out of Account</span>
            </button>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
