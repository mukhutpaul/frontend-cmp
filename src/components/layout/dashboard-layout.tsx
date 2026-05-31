"use client";

import { useState } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="h-screen overflow-hidden bg-base-100">

      {/* SIDEBAR */}
      <Sidebar isOpen={isOpen} />

      {/* MAIN AREA */}
      <div
        className={`flex flex-col h-full transition-all duration-300`}
        style={{
          marginLeft: isOpen ? "18rem" : "5rem",
        }}
      >

        {/* NAVBAR */}
        <Navbar 
        toggleSidebar={toggleSidebar}  
        isOpen={isOpen}
        />

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 pt-20">
          {children}
        </main>

      </div>

    </div>
  );
}