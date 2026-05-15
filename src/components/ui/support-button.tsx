"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const supportNumber = "919999999999"; // Replace with actual number
  const prefillMessage = `Hi, I need help with the Resume Builder. I am currently on the page: ${pathname || "Home"}`;

  const whatsappUrl = `https://wa.me/${supportNumber}?text=${encodeURIComponent(prefillMessage)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4">
      {isOpen && (
        <div className="bg-white border shadow-xl rounded-xl p-4 mb-2 w-72 animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-slate-800">Need Help?</h4>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close support dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Stuck somewhere? Send us a message on WhatsApp and our team will assist you immediately.
          </p>
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
            </svg>
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-105",
          "bg-green-500 hover:bg-green-600 text-white"
        )}
        aria-label="Open Support"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
