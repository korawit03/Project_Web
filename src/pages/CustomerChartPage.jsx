import React, { useMemo } from "react";
import { BarChart3 as ChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { COLORS } from "../lib/tokens.js";

const PIE_COLORS = ["#E8951C", "#3E8E5C", "#3B82C4", "#D14343", "#8B6FC0", "#2AA7A0", "#C77A0F", "#6B7078"];

function ChartCard({ title, hint, children }) {
  return (
    <div className="mb-4 rounded-xl border p-5" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
      <p className="text-sm font-semibold" style={{ color: COLORS.charcoal }}>{title}</p>
      {hint && <p className="mb-3 mt-0.5 text-xs" style={{ color: COLORS.textMuted }}>{hint}</p>}
      {children}
    </div>
  );
}

function Empty({ text }) {
  return (
    <p className="py-10 text-center text-sm" style={{ color: COLORS.textMuted }}>{text}</p>
  );
}

// หน้า 2.3 สรุปข้อมูลลูกค้าเป็นกราฟ (คำนวณจากข้อมูลจริง อัปเดตเองเมื่อมีการเพิ่ม/ลบ/แก้ไข)
export default function CustomerChartPage({ customers = [], projects = [], loading }) {
  // กราฟแท่ง: จำนวนโครงงานต่อลูกค้า (Top 10)
  const projectData = useMemo(() => {
    const counts = {};
    projects.forEach((p) => {
      if (p.customerId != null) counts[p.customerId] = (counts[p.customerId] || 0) + 1;
    });
    return customers
      .map((c) => ({ name: c.name, projects: counts[c.customer_id] || 0 }))
      .filter((d) => d.projects > 0)
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 10);
  }, [customers, projects]);

  // กราฟวงกลม: ลูกค้าแยกตามจังหวัด (ใช้สถานที่แห่งแรกที่มีจังหวัด)
  const provinceData = useMemo(() => {
    const counts = {};
    customers.forEach((c) => {
      const prov = (c.locations || []).find((l) => l.province)?.province || "ไม่ระบุ";
      counts[prov] = (counts[prov] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [customers]);

  const totalLocations = customers.reduce((n, c) => n + (c.locations?.length || 0), 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex items-center gap-2.5 border-b pb-4" style={{ borderColor: COLORS.border }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: COLORS.charcoal }}>
          <ChartIcon size={17} color={COLORS.amber} />
        </span>
        <div>
          <h1 className="text-lg font-bold" style={{ color: COLORS.charcoal }}>สรุปลูกค้า</h1>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            ลูกค้า {customers.length} คน · สถานที่ {totalLocations} แห่ง · โครงงาน {projects.length} งาน
          </p>
        </div>
      </div>

      {loading && customers.length === 0 ? (
        <p className="text-sm" style={{ color: COLORS.textMuted }}>กำลังโหลดข้อมูล...</p>
      ) : (
        <>
          <ChartCard title="จำนวนโครงงานต่อลูกค้า" hint="แสดงสูงสุด 10 อันดับแรก">
            {projectData.length === 0 ? (
              <Empty text="ยังไม่มีโครงงานให้สรุป" />
            ) : (
              <div style={{ width: "100%", height: Math.max(220, projectData.length * 38 + 40) }}>
                <ResponsiveContainer>
                  <BarChart data={projectData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`${v} โครงงาน`, "จำนวน"]} />
                    <Bar dataKey="projects" fill={COLORS.amber} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="สัดส่วนลูกค้าแยกตามจังหวัด" hint='ลูกค้าที่ยังไม่มีข้อมูลจังหวัดจัดเป็น "ไม่ระบุ"'>
            {provinceData.length === 0 ? (
              <Empty text="ยังไม่มีข้อมูลลูกค้า" />
            ) : (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={provinceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      label={({ value }) => value}
                    >
                      {provinceData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} คน`, "ลูกค้า"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </>
      )}
    </div>
  );
}