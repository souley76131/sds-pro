"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UrgentBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        // Try settings table first
        let { data } = await supabase.from("settings").select("*").limit(1).maybeSingle();
        let row = data as any;
        if (!row) {
          // Fallback to site_config where key = 'urgence'
          try {
            const res = await supabase.from("site_config").select("value").eq("key", "urgence").maybeSingle();
            const cfg = res.data as any;
            if (cfg && cfg.value) {
              // value may be stored as JSON
              const val = typeof cfg.value === "string" ? JSON.parse(cfg.value) : cfg.value;
              row = val;
            }
          } catch (e) {
            // ignore
          }
        }

        if (row?.boutique_fermee && row?.message_urgence) {
          setMessage(String(row.message_urgence));
        } else {
          setMessage(null);
        }
      } catch {
        setMessage(null);
      }
    })();
  }, []);

  if (!message) return null;

  return (
    <div
      role="alert"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        width: "100%",
        background: "linear-gradient(90deg,#7a0010,#c4001a)",
        color: "#fff",
        textAlign: "center",
        padding: "10px 16px",
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.4,
        borderBottom: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      🔴 {message}
    </div>
  );
}
