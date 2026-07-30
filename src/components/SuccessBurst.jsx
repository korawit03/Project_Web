import React, { useEffect, useState } from "react";
import { PartyPopper } from "lucide-react";
import { COLORS } from "../lib/tokens.js";

// การ์ดฉลองเล็กๆ ที่โผล่มาสั้นๆ ตอนบันทึกสำเร็จ พร้อมอีโมจิเด้งกระจาย
export default function SuccessBurst({ message, trigger }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    // สุ่มตำแหน่ง/ความเร็วของอีโมจิแต่ละตัว ให้กระจายไม่ซ้ำกันทุกครั้ง
    const emojis = ["✨", "🎉", "🔧", "✅", "⭐"];
    const list = Array.from({ length: 10 }, (_, i) => ({
      id: `${trigger}-${i}`,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      left: 10 + Math.random() * 80,
      delay: Math.random() * 0.15,
      drift: (Math.random() - 0.5) * 60,
    }));
    setParticles(list);
    const t = setTimeout(() => setParticles([]), 1200);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!message) return null;

  return (
    <div className="relative mb-6 overflow-hidden rounded-lg border p-3" style={{ borderColor: COLORS.green, background: "#EAF6EF" }}>
      <p className="relative z-10 flex items-center gap-1.5 text-sm font-medium" style={{ color: COLORS.green }}>
        <PartyPopper size={16} />
        {message}
      </p>

      {particles.map((p) => (
        <span
          key={p.id}
          className="pointer-events-none absolute bottom-0 text-lg"
          style={{
            left: `${p.left}%`,
            animation: `burst-rise 1.1s ease-out ${p.delay}s forwards`,
            "--drift": `${p.drift}px`,
          }}
        >
          {p.emoji}
        </span>
      ))}

      <style>{`
        @keyframes burst-rise {
          0% { transform: translate(0, 10px) scale(0.6); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(var(--drift), -60px) scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}