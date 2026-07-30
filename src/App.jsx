import React, { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import MobileTopBar from "./components/MobileTopBar.jsx";
import MobileBottomNav from "./components/MobileBottomNav.jsx";
import SiteWorkForm from "./pages/SiteWorkForm.jsx";
import CustomerListPage from "./pages/CustomerListPage.jsx";
import { COLORS } from "./lib/tokens.js";

export default function App() {
  const [activeView, setActiveView] = useState("form");
  const [projects, setProjects] = useState([]);

  const handleSaved = (project) => {
    setProjects((prev) => [...prev, project]);
  };

  const handleUpdateProject = (projectId, updatedProject) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)));
  };

  const handleDeleteProject = (projectId) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  return (
    <div className="flex min-h-screen w-full" style={{ background: COLORS.bg }}>
      <Sidebar activeView={activeView} onNavigate={setActiveView} />

      <div className="flex-1 min-w-0 flex flex-col">
        <MobileTopBar />

        {/* เว้นพื้นที่ด้านล่าง 64px บนจอมือถือ กันเนื้อหาโดนแถบเมนูล่างบัง */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          {activeView === "form" ? (
            <SiteWorkForm onSaved={handleSaved} />
          ) : (
            <CustomerListPage
              projects={projects}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
            />
          )}
        </main>

        <MobileBottomNav activeView={activeView} onNavigate={setActiveView} />
      </div>
    </div>
  );
}