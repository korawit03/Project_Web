import React from "react";
import Sidebar from "./components/Sidebar.jsx";
import SiteWorkForm from "./pages/SiteWorkForm.jsx";
import { COLORS } from "./lib/tokens.js";

export default function App() {
  return (
    <div className="flex min-h-screen w-full" style={{ background: COLORS.bg }}>
      <Sidebar />
      <main className="flex-1 min-w-0">
        <SiteWorkForm />
      </main>
    </div>
  );
}
