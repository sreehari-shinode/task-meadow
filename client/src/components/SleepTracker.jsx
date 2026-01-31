import React, { useEffect, useMemo, useRef, useState } from "react";
import { BASE_API_URL } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const SLEEP_TYPE = "sleep";
const AUTO_SAVE_DELAY_MS = 700;

const formatYmd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getDaysBack = (n) => {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push({ date: d, dateStr: formatYmd(d) });
  }
  return out.reverse();
};

const SleepTracker = () => {
  const [days] = useState(() => getDaysBack(14));
  const [entries, setEntries] = useState({});
  // const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef(null);

  const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("token") : null;
  const todayStr = formatYmd(new Date());
  const startStr = days[0]?.dateStr;
  const endStr = days[days.length - 1]?.dateStr;

  useEffect(() => {
    if (!token || !startStr || !endStr) return;
    // setLoading(true);
    fetch(
      `${BASE_API_URL}/api/events/range?start=${startStr}&end=${endStr}`,
      { headers: { "x-auth-token": token } }
    )
      .then((r) => r.json())
      .then((data) => {
        if (!data.success || !data.data) return;
        const byDate = {};
        data.data
          .filter((e) => e.type === SLEEP_TYPE)
          .forEach((e) => {
            const key = e.date?.split?.("T")?.[0] || formatYmd(new Date(e.date));
            const hours = typeof e.value === "number" ? e.value : e.value?.hours;
            if (hours != null) byDate[key] = { id: e._id, hours };
          });
        setEntries(byDate);
      })
      .catch(() => {})
      .finally();
  }, [token, startStr, endStr]);

  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const handleSave = (dateStr, hoursVal) => {
    const hours = parseFloat(String(hoursVal).trim(), 10);
    if (Number.isNaN(hours) || hours < 0 || hours > 24) return;
    if (!token) return;
    const existing = entriesRef.current[dateStr];
    setSaving(true);
    const body = {
      date: dateStr,
      type: SLEEP_TYPE,
      value: hours,
      notes: "",
    };
    const method = existing?.id ? "PUT" : "POST";
    const url = existing?.id
      ? `${BASE_API_URL}/api/events/${existing.id}`
      : `${BASE_API_URL}/api/events`;
    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          const key = data.data.date?.split?.("T")?.[0] || dateStr;
          const h = typeof data.data.value === "number" ? data.data.value : data.data.value?.hours;
          setEntries((prev) => ({
            ...prev,
            [key]: { ...(prev[key] || {}), id: data.data._id, hours: h },
          }));
        }
      })
      .finally(() => setSaving(false));
  };

  const scheduleAutoSave = (dateStr, value) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const v = String(value).trim();
    if (v === "" || Number.isNaN(parseFloat(v, 10))) return;
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(dateStr, v);
    }, AUTO_SAVE_DELAY_MS);
  };

  const chartData = useMemo(() => {
    return days.map(({ dateStr }) => {
      const e = entries[dateStr];
      const hours = e?.hours != null && e?.hours !== "" ? Number(e.hours) : null;
      const label = new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
      });
      return { date: dateStr, label, hours: hours != null ? hours : 0, filled: hours != null };
    });
  }, [days, entries]);

  const avg7 = useMemo(() => {
    const last7 = chartData.slice(-7).filter((d) => d.filled && d.hours > 0);
    if (!last7.length) return null;
    return Math.round((last7.reduce((s, d) => s + d.hours, 0) / last7.length) * 10) / 10;
  }, [chartData]);

  const todayEntry = entries[todayStr];
  const todayHours = todayEntry?.hours ?? "";

  return (
    <div className="w-full bg-[#111338] border border-white/5 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
        <span className="text-xs font-medium text-gray-400 tracking-wider uppercase">Sleep</span>
        {avg7 != null && (
          <span className="text-[11px] text-gray-500">Avg 7d: <span className="text-white/80 font-medium">{avg7}h</span></span>
        )}
      </div>
      <div className="p-4 space-y-3">
        {/* Sleep input for today - moved to top like WeightTracker */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Today</span>
          <input
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={todayHours}
            onChange={(e) => {
              const v = e.target.value;
              setEntries((prev) => ({
                ...prev,
                [todayStr]: { ...(prev[todayStr] || {}), hours: v === "" ? "" : (parseFloat(v, 10) || v) },
              }));
              scheduleAutoSave(todayStr, v);
            }}
            onBlur={(e) => {
              const v = e.target.value;
              if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
              if (v !== "" && !Number.isNaN(parseFloat(v, 10))) handleSave(todayStr, v);
            }}
            placeholder="hrs"
            className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1]"
          />
          <span className="text-[11px] text-gray-500">hrs</span>
          {saving && (
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              <span className="animate-spin rounded-full h-2.5 w-2.5 border border-white/30 border-t-white" />
              Saving…
            </span>
          )}
        </div>

        {/* Sleep trend chart - moved below input like WeightTracker */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
            >
              <ReferenceLine y={7} stroke="#4b5563" strokeDasharray="2 2" strokeOpacity={0.6} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6b7280", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                hide
                domain={[0, 10]}
              />
              <Tooltip
                cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 11,
                }}
                formatter={(value, name, props) => [
                  props.payload.filled ? `${value} hrs` : "—",
                  props.payload.label,
                ]}
              />
              <Bar
                dataKey="hours"
                radius={[3, 3, 0, 0]}
                fill="#6366f1"
                fillOpacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SleepTracker;
