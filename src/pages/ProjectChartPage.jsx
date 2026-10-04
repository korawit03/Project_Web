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
  Legend,
  Cell,
} from "recharts";
import { COLORS } from "../lib/tokens.js";
import { STATUS_OPTIONS, countByStatus } from "../lib/status.js";

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
  return <p className="py-10 text-center text-sm" style={{ color: COLORS.textMuted }}>{text}</p>;
}

export default function ProjectChartPage({ projects = [], workCatalog = {}, loading }) {
  const allItems = useMemo(() => projects.flatMap((p) => p.items || []), [projects]);

  // จำนวนชิ้นงานแต่ละสถานะ (ใช้สีเดียวกับ STATUS_OPTIONS)
  const statusData = useMemo(() => {
    const counts = countByStatus(allItems);
    return STATUS_OPTIONS.map((s) => ({ name: s.label, value: counts[s.value], color: s.color }));
  }, [allItems]);

  // แท่งซ้อน: จำนวนชิ้นงานต่อหมวดหมู่ แยกสีตามสถานะ
  const categoryData = useMemo(() => {
    const map = {};
    allItems.forEach((it) => {
      const cat = workCatalog[it.mainWork]?.category || "ไม่ระบุหมวด";
      if (!map[cat]) map[cat] = { name: cat, pending: 0, in_progress: 0, done: 0, total: 0 };
      const key = map[cat][it.status] !== undefined ? it.status : "pending";
      map[cat][key] += 1;
      map[cat].total += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [allItems, workCatalog]);

  const doneCount = allItems.filter((it) => it.status === "done").length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex items-center gap-2.5 border-b pb-4" style={{ borderColor: COLORS.border }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: COLORS.charcoal }}>
          <ChartIcon size={17} color={COLORS.amber} />
        </span>
        <div>
          <h1 className="text-lg font-bold" style={{ color: COLORS.charcoal }}>สรุปงาน</h1>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            โครงงาน {projects.length} งาน · ชิ้นงาน {allItems.length} ชิ้น · เสร็จแล้ว {doneCount} ชิ้น
          </p>
        </div>
      </div>

      {loading && projects.length === 0 ? (
        <p className="text-sm" style={{ color: COLORS.textMuted }}>กำลังโหลดข้อมูล...</p>
      ) : (
        <>
          <ChartCard title="จำนวนชิ้นงานแยกตามสถานะ" hint="นับจากชิ้นงานทั้งหมดในทุกโครงงาน">
            {allItems.length === 0 ? (
              <Empty text="ยังไม่มีชิ้นงานให้สรุป" />
            ) : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={statusData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`${v} ชิ้น`, "จำนวน"]} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 12 }}>
                      {statusData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="จำนวนชิ้นงานแยกตามหมวดหมู่" hint="แท่งแบ่งสีตามสถานะ · ชิ้นงานที่หมวดถูกปิดใช้งานจะรวมใน “ไม่ระบุหมวด”">
            {categoryData.length === 0 ? (
              <Empty text="ยังไม่มีชิ้นงานให้สรุป" />
            ) : (
              <div style={{ width: "100%", height: 340 }}>
                <ResponsiveContainer>
                  <BarChart data={categoryData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v, name) => [`${v} ชิ้น`, name]} />
                    <Legend verticalAlign="top" />
                    {STATUS_OPTIONS.map((s, i) => (
                      <Bar
                        key={s.value}
                        dataKey={s.value}
                        name={s.label}
                        stackId="status"
                        fill={s.color}
                        radius={i === STATUS_OPTIONS.length - 1 ? [4, 4, 0, 0] : 0}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </>
      )}
    </div>
  );
}