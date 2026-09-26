import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar.jsx";
import MobileTopBar from "./components/MobileTopBar.jsx";
import MobileBottomNav from "./components/MobileBottomNav.jsx";
import SiteWorkForm from "./pages/SiteWorkForm.jsx";
import CustomerCreatePage from "./pages/CustomerCreatePage.jsx";
import { COLORS } from "./lib/tokens.js";
import { supabase } from "./lib/supabase.js";
import { useWorkCatalog } from "./lib/useWorkCatalog.js";
import { useCustomers } from "./lib/useCustomers.js";
import { saveAllWorkItems, updateItemStatus } from "./lib/jobItems.js";
import { DEFAULT_STATUS } from "./lib/status.js";
import { deletePhotos } from "./lib/storage.js";
import CustomerDetailPage from "./pages/CustomerdetailPage.jsx";
import ProjectDetailPage from "./pages/ProjectDetailPage.jsx";
import CatalogTypesPage from "./pages/CatalogTypesPage.jsx";

// แปลงรูปจาก site_photos ให้เป็น shape เดิมที่ใช้งาน ({ id, url, path, name })
// ปรับปรุงให้รองรับทั้ง image_url และ url เพื่อป้องกันปัญหารูปไม่ขึ้น
function mapPhotos(sitePhotos, photoType) {
  return (sitePhotos || [])
    .filter((p) => p.photo_type === photoType)
    .slice()
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((p) => ({
      id: p.storage_path || `photo-${p.photo_id}`,
      url: p.image_url || p.url || "",
      path: p.storage_path,
      name: p.storage_path || "photo",
    }));
}

function mapProjectFromDb(row) {
  return {
    id: row.project_id,
    projectName: row.project_name || "",
    customerId: row.customer_id,
    customerName: row.customer?.name || "(ไม่ระบุชื่อ)",
    customerPhone: row.customer?.phone || "",
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    savedAt: row.created_date,
    updatedAt: row.updated_at,

    items: (row.job_items || [])
      .slice()
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((it) => ({
        id: it.item_id,
        itemName: it.item_name || "",
        mainWork: it.sub_type,
        answers: it.details || {},
        positionNote: it.position_note || "",
        note: it.note || "",
        status: it.status || DEFAULT_STATUS,
        positionPhotos: mapPhotos(it.site_photos, "position"),
        workPhotos: mapPhotos(it.site_photos, "work"),
      })),
  };
}

export default function App() {
  const [activeView, setActiveView] = useState("form");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { workCatalog, categoryOrder, loading: catalogLoading, reload: reloadCatalog } = useWorkCatalog();
  const { customers, loading: customersLoading, findOrCreateCustomer, createCustomer,
    updateCustomerPhone, updateCustomer } = useCustomers();

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*, customer:customers(*), job_items(*, site_photos(*))")
      .order("created_date", { ascending: false });

    if (error) {
      console.error("Load projects failed:", error);
      setLoading(false);
      return;
    }

    setProjects(data.map(mapProjectFromDb));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleSaved = () => {
    loadProjects();
  };

  const handleUpdateProject = async (projectId, updatedProject) => {
    let customer;
    try {
      customer = await findOrCreateCustomer(updatedProject.customerName, updatedProject.customerPhone);
    } catch (err) {
      console.error("Resolve customer failed:", err);
      alert("บันทึกข้อมูลลูกค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    }

    const { error: projectError } = await supabase
      .from("projects")
      .update({
        customer_id: customer.customer_id,
        location: updatedProject.location,
        latitude: updatedProject.latitude,
        longitude: updatedProject.longitude,
      })
      .eq("project_id", projectId);

    if (projectError) {
      console.error("Update project failed:", projectError);
      alert("อัปเดตข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    }

    const { error: deleteError } = await supabase
      .from("job_items")
      .delete()
      .eq("project_id", projectId);

    if (deleteError) {
      console.error("Delete old job_items failed:", deleteError);
      alert("อัปเดตข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    }

    try {
      await saveAllWorkItems(updatedProject.items, projectId, workCatalog);
    } catch (err) {
      console.error("Insert updated job_items failed:", err);
      alert("อัปเดตข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    }

    await loadProjects();
    return true;
  };

  const handleDeleteProject = async (projectId) => {
    const projectToDelete = projects.find((p) => p.id === projectId);

    if (projectToDelete) {
      const allPhotos = projectToDelete.items.flatMap((it) => [
        ...(it.positionPhotos || []),
        ...(it.workPhotos || []),
      ]);
      if (allPhotos.length > 0) {
        await deletePhotos(allPhotos);
      }
    }

    const { error } = await supabase.from("projects").delete().eq("project_id", projectId);

    if (error) {
      console.error("Delete project failed:", error);
      alert("ลบข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const handleItemStatusChange = async (projectId, itemId, status) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== projectId
          ? p
          : { ...p, items: p.items.map((it) => (it.id === itemId ? { ...it, status } : it)) }
      )
    );
    try {
      await updateItemStatus(itemId, status);
    } catch (err) {
      console.error("Update item status failed:", err);
      alert("อัปเดตสถานะไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      loadProjects();
    }
  };

  return (
    <div className="flex min-h-screen w-full" style={{ background: COLORS.bg }}>
      <Sidebar activeView={activeView} onNavigate={setActiveView} />

      <div className="flex-1 min-w-0 flex flex-col">
        <MobileTopBar />

        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          {activeView === "form" ? (
            <SiteWorkForm
              onSaved={handleSaved}
              workCatalog={workCatalog}
              categoryOrder={categoryOrder}
              catalogLoading={catalogLoading}
              customers={customers}
              findOrCreateCustomer={findOrCreateCustomer}
              updateCustomerPhone={updateCustomerPhone}
              projects={projects}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
            />
          ) : activeView === "customer-list" ? (
            <CustomerDetailPage
              customers={customers}
              loading={customersLoading}
              updateCustomer={updateCustomer}
              onCustomerUpdated={loadProjects}
            />
          ) : activeView === "customer-new" ? (
            <CustomerCreatePage createCustomer={createCustomer} />
          ) : activeView === "project-detail" ? (
            <ProjectDetailPage
              projects={projects}
              loading={loading}
              onItemStatusChange={handleItemStatusChange}
              workCatalog={workCatalog}
            />
          ) : activeView === "catalog-types" ? (
            <CatalogTypesPage onChanged={reloadCatalog} />
          ) : null}
        </main>

        <MobileBottomNav activeView={activeView} onNavigate={setActiveView} />
      </div>
    </div>
  );
}