import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// hide the navbar on routes listed here (optional)
const HIDE_ON = ["/login"];

export default function RootLayout() {
  const { pathname } = useLocation();
  const hideNavbar = HIDE_ON.includes(pathname);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {!hideNavbar && <Navbar />}
      {/* All child routes render here */}
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideNavbar && <Footer />}
    </div>
  );
}
