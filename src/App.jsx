import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar.jsx";
import MobileTopBar from "./components/MobileTopBar.jsx";
import MobileBottomNav from "./components/MobileBottomNav.jsx";
import SiteWorkForm from "./pages/SiteWorkForm.jsx";
import CustomerListPage from "./pages/CustomerListPage.jsx";
import CustomerCreatePage from "./pages/CustomerCreatePage.jsx";
import { COLORS } from "./lib/tokens.js";
import { supabase } from "./lib/supabase.js";
import { useWorkCatalog } from "./lib/useWorkCatalog.js";
import { useCustomers } from "./lib/useCustomers.js";
import { saveAllWorkItems, updateItemStatus } from "./lib/jobItems.js";
import { DEFAULT_STATUS } from "./lib/status.js";
import { deletePhotos } from "./lib/storage.js";


// แปลงรูปจาก site_photos ให้เป็น shape เดิมที่ PhotoDropzone ใช้ ({ id, url, path, name })
// แยกตาม photo_type ('work' / 'position') แล้วเรียงตาม sort_order
function mapPhotos(sitePhotos, photoType) {
  return (sitePhotos || [])
    .filter((p) => p.photo_type === photoType)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => ({
      id: p.storage_path || `photo-${p.photo_id}`,
      url: p.image_url,
      path: p.storage_path,
      name: p.storage_path,
    }));
}

function mapProjectFromDb(row) {
  return {
    id: row.project_id,
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
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((it) => ({
        id: it.item_id,
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
  const { workCatalog, categoryOrder, loading: catalogLoading } = useWorkCatalog();
  const { customers, findOrCreateCustomer, createCustomer, loadCustomers } = useCustomers();

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
    // หาลูกค้าเดิมจากชื่อที่แก้ไข หรือสร้างลูกค้าใหม่ถ้าเปลี่ยนเป็นชื่อที่ยังไม่เคยมี
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

    // ลบชิ้นงานเดิมทั้งหมดของโปรเจกต์นี้ (site_photos ที่ผูกอยู่จะถูกลบตามไปด้วยอัตโนมัติ
    // เพราะตั้ง FK เป็น ON DELETE CASCADE ไว้แล้ว ไม่ต้องลบเองแยกต่างหาก)
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
    const customerId = projectToDelete?.customerId;

    // ลบรูปทั้งหมดใน Storage ก่อน (ทั้ง positionPhotos และ workPhotos ของทุกชิ้นงาน)
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

    // ถ้าลูกค้าคนนี้ไม่มีโครงการอื่นเหลืออยู่แล้ว ให้ลบข้อมูลลูกค้าออกจาก customers ด้วย
    if (customerId) {
      const hasOtherProjects = projects.some(
        (p) => p.id !== projectId && p.customerId === customerId
      );
      if (!hasOtherProjects) {
        const { data: deletedCustomer, error: customerDeleteError } = await supabase
          .from("customers")
          .delete()
          .eq("customer_id", customerId)
          .select();

        if (customerDeleteError) {
          console.error("Delete customer failed:", customerDeleteError);
        } else if (!deletedCustomer || deletedCustomer.length === 0) {
          // ลบไม่สำเร็จแบบเงียบ ๆ (0 แถวถูกลบ) มักเกิดจาก RLS policy บนตาราง customers ไม่อนุญาตให้ DELETE
          console.warn("Customer delete affected 0 rows — check RLS policy on 'customers' table");
        } else {
          loadCustomers();
        }
      }
    }
  };

  const handleItemStatusChange = async (projectId, itemId, status) => {
    // อัปเดตหน้าจอทันที (optimistic) แล้วค่อยยิงไป Supabase จริง
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
    <CustomerListPage
      projects={projects}
      loading={loading}
      onUpdateProject={handleUpdateProject}
      onDeleteProject={handleDeleteProject}
      onItemStatusChange={handleItemStatusChange}
      workCatalog={workCatalog}
      categoryOrder={categoryOrder}
    />
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
              projects={projects}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
            />
          ) : activeView === "customer-new" ? (
            <CustomerCreatePage createCustomer={createCustomer} />
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