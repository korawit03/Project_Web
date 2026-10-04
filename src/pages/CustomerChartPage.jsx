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
} from "recharts";
import { COLORS } from "../lib/tokens.js";

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

// กราฟแท่งแนวตั้ง ใช้ซ้ำได้ (data = [{ name, value }])
function VBar({ data, color, unit, label }) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
          <XAxis
            dataKey="name"
            interval={0}
            angle={-35}
            textAnchor="end"
            height={70}
            tick={{ fontSize: 12 }}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [`${v} ${unit}`, label]} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 12 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function CustomerChartPage({ customers = [], projects = [], loading }) {
  // จำนวนโครงงานต่อลูกค้า (Top 10)
  const projectData = useMemo(() => {
    const counts = {};
    projects.forEach((p) => {
      if (p.customerId != null) counts[p.customerId] = (counts[p.customerId] || 0) + 1;
    });
    return customers
      .map((c) => ({ name: c.name, value: counts[c.customer_id] || 0 }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [customers, projects]);

  // จำนวนลูกค้าแยกตามจังหวัด (Top 10, ใช้สถานที่แห่งแรกที่มีจังหวัด)
  const provinceData = useMemo(() => {
    const counts = {};
    customers.forEach((c) => {
      const prov = (c.locations || []).find((l) => l.province)?.province || "ไม่ระบุ";
      counts[prov] = (counts[prov] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
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
              <VBar data={projectData} color={COLORS.amber} unit="โครงงาน" label="จำนวน" />
            )}
          </ChartCard>

          <ChartCard title="จำนวนลูกค้าแยกตามจังหวัด" hint='แสดงสูงสุด 10 อันดับแรก · ลูกค้าที่ยังไม่มีข้อมูลจังหวัดจัดเป็น "ไม่ระบุ"'>
            {provinceData.length === 0 ? (
              <Empty text="ยังไม่มีข้อมูลลูกค้า" />
            ) : (
              <VBar data={provinceData} color={COLORS.green} unit="คน" label="ลูกค้า" />
            )}
          </ChartCard>
        </>
      )}
    </div>
  );
}