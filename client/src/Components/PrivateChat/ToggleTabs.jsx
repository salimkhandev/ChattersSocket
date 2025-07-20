"use client";
import { MessageCircle, Users } from "lucide-react";
import React from "react";

export default function ToggleTabs({ activeTab, setActiveTab }) {
    return (
        <div className="bg-white border-b p-4 flex items-center justify-center">
            <div className="flex bg-gray-100 p-0.5 rounded-full relative w-full max-w-xs">
                {/* Animated Background Slider */}
                <div
                    className={`absolute inset-0.5 bg-blue-600 rounded-full transition-transform duration-200 ease-in-out ${activeTab === "people" ? "translate-x-0" : "translate-x-full"
                        } w-1/2`}
                />
                {/* People Tab */}
                <button
                    onClick={() => setActiveTab("people")}
                    className={`w-1/2 px-6 py-1.5 rounded-full font-medium transition-colors duration-200 ease-in-out flex items-center justify-center gap-2 relative z-10 ${activeTab === "people" ? "text-white" : "text-gray-700"
                        }`}
                >
                    <Users className="w-4 h-4" />
                    People
                </button>
                {/* Groups Tab */}
                <button
                    onClick={() => setActiveTab("groups")}
                    className={`w-1/2 px-6 py-1.5 rounded-full font-medium transition-colors duration-200 ease-in-out flex items-center justify-center gap-2 relative z-10 ${activeTab === "groups" ? "text-white" : "text-gray-700"
                        }`}
                >
                    <MessageCircle className="w-4 h-4" />
                    Groups
                </button>
            </div>
        </div>
    );
}
