import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar.jsx";
import MobileTopBar from "./components/MobileTopBar.jsx";
import MobileBottomNav from "./components/MobileBottomNav.jsx";
import SiteWorkForm from "./pages/SiteWorkForm.jsx";
import CustomerListPage from "./pages/CustomerListPage.jsx";
import { COLORS } from "./lib/tokens.js";
import { supabase } from "./lib/supabase.js";
import { useWorkCatalog } from "./lib/useWorkCatalog.js";
import { useCustomers } from "./lib/useCustomers.js";

function mapProjectFromDb(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer?.name || "(ไม่ระบุชื่อ)",
    customerPhone: row.customer?.phone || "",
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    savedAt: row.saved_at,
    updatedAt: row.updated_at,
    items: (row.work_items || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((it) => ({
        id: it.id,
        mainWork: it.main_work,
        answers: it.answers || {},
        positionNote: it.position_note || "",
        note: it.note || "",
        positionPhotos: [],
        workPhotos: [],
      })),
  };
}

export default function App() {
  const [activeView, setActiveView] = useState("form");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { workCatalog, categoryOrder, loading: catalogLoading } = useWorkCatalog();
  const { customers, findOrCreateCustomer, loadCustomers } = useCustomers();

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*, customer:customers(*), work_items(*)")
      .order("saved_at", { ascending: false });

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
    // หาลูกค้าเดิมจากชื่อที่แก้ไข หรือสร้างลูกค้าใหม่ถ้าเปลี่ยนเป็นชื่อที่ยังไม่เคยมี
    let customer;
    try {
      customer = await findOrCreateCustomer(updatedProject.customerName);
    } catch (err) {
      console.error("Resolve customer failed:", err);
      alert("บันทึกข้อมูลลูกค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    }

    const { error: projectError } = await supabase
      .from("projects")
      .update({
        customer_id: customer.id,
        location: updatedProject.location,
        latitude: updatedProject.latitude,
        longitude: updatedProject.longitude,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (projectError) {
      console.error("Update project failed:", projectError);
      alert("อัปเดตข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    }

    const { error: deleteError } = await supabase
      .from("work_items")
      .delete()
      .eq("project_id", projectId);

    if (deleteError) {
      console.error("Delete old work_items failed:", deleteError);
      alert("อัปเดตข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    }

    const workItemsPayload = updatedProject.items.map((item, idx) => ({
      project_id: projectId,
      main_work: item.mainWork,
      answers: item.answers,
      position_note: item.positionNote,
      note: item.note,
      sort_order: idx,
    }));

    const { error: insertError } = await supabase.from("work_items").insert(workItemsPayload);

    if (insertError) {
      console.error("Insert updated work_items failed:", insertError);
      alert("อัปเดตข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    }

    await loadProjects();
    return true;
  };

  const handleDeleteProject = async (projectId) => {
    // หา customer_id ของโครงการนี้ไว้ก่อน เผื่อต้องเช็คว่าเหลือโครงการอื่นไหมหลังลบ
    const projectToDelete = projects.find((p) => p.id === projectId);
    const customerId = projectToDelete?.customerId;

    const { error } = await supabase.from("projects").delete().eq("id", projectId);

    if (error) {
      console.error("Delete project failed:", error);
      alert("ลบข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    // ถ้าลูกค้าคนนี้ไม่มีโครงการอื่นเหลืออยู่แล้ว ให้ลบข้อมูลลูกค้าออกจาก customers ด้วย
    if (customerId) {
      const hasOtherProjects = projects.some(
        (p) => p.id !== projectId && p.customerId === customerId
      );
      if (!hasOtherProjects) {
        const { error: customerDeleteError } = await supabase
          .from("customers")
          .delete()
          .eq("id", customerId);

        if (customerDeleteError) {
          console.error("Delete customer failed:", customerDeleteError);
          // ไม่ต้อง alert ซ้ำ เพราะโครงการถูกลบสำเร็จแล้ว แค่ customer เหลือค้างไว้เฉยๆ
        } else {
          loadCustomers(); // รีเฟรช dropdown/datalist ชื่อลูกค้าในฟอร์ม
        }
      }
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
            />
          ) : (
            <CustomerListPage
              projects={projects}
              loading={loading}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              workCatalog={workCatalog}
              categoryOrder={categoryOrder}
            />
          )}
        </main>

        <MobileBottomNav activeView={activeView} onNavigate={setActiveView} />
      </div>
    </div>
  );
}