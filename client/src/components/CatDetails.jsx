import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FormControl, MenuItem, Select } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { BASE_API_URL } from "../context/AuthContext";

const TYPE_OPTIONS = [
  { value: "VARC", label: "VARC" },
  { value: "LRDI", label: "LRDI" },
  { value: "QA", label: "QA" },
  { value: "FULL", label: "Full Length" },
];

function formatYmd(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function monthPeriod(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const CatDetails = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState("");

  const [mockCountsByDate, setMockCountsByDate] = useState({});
  const [dayMocks, setDayMocks] = useState([]);
  const [loadingDay, setLoadingDay] = useState(false);

  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [activeTypeTab, setActiveTypeTab] = useState("ALL");

  // New mock form
  const [form, setForm] = useState({
    type: "VARC",
    attempted: "",
    correct: "",
    wrong: "",
    totalQuestions: "",
    totalMarks: "",
    percentage: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = monthPeriod(new Date());
    setSelectedMonth(p);
  }, []);

  // Sync month when calendar month changes
  useEffect(() => {
    if (!selectedMonth) return;
    // fetch monthly map + summary for the selectedMonth
    fetchMonthlySummary(selectedMonth);
  }, [selectedMonth]);

  // Fetch day mocks when selected date changes
  useEffect(() => {
    fetchDayMocks(selectedDate);
  }, [selectedDate]);

  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      options.push({
        value,
        label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      });
    }
    return options;
  };

  const fetchDayMocks = async (date) => {
    try {
      setLoadingDay(true);
      const ymd = formatYmd(date);
      const resp = await fetch(`${BASE_API_URL}/api/cat/mocks?date=${ymd}`, {
        headers: { "x-auth-token": sessionStorage.getItem("token") },
      });
      const json = await resp.json();
      if (resp.ok && json.success) {
        setDayMocks(json.data || []);
        setMockCountsByDate((prev) => ({
          ...prev,
          [ymd]: (json.data || []).length,
        }));
      } else {
        setDayMocks([]);
      }
    } catch {
      setDayMocks([]);
    } finally {
      setLoadingDay(false);
    }
  };

  const fetchMonthlySummary = async (period) => {
    try {
      setLoadingSummary(true);
      const resp = await fetch(`${BASE_API_URL}/api/cat/summary?period=${period}`, {
        headers: { "x-auth-token": sessionStorage.getItem("token") },
      });
      const json = await resp.json();
      if (resp.ok && json.success) {
        setSummary(json.data);
        setMockCountsByDate(json.data?.dateCounts || {});
      } else {
        setSummary(null);
      }
    } catch {
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleAddMock = async () => {
    try {
      setSaving(true);
      const ymd = formatYmd(selectedDate);
      const payload = {
        date: ymd,
        type: form.type,
        attempted: Number(form.attempted || 0),
        correct: Number(form.correct || 0),
        wrong: Number(form.wrong || 0),
        totalQuestions: Number(form.totalQuestions || 0),
        totalMarks: Number(form.totalMarks || 0),
        percentage: form.percentage === "" ? undefined : Number(form.percentage),
      };

      const resp = await fetch(`${BASE_API_URL}/api/cat/mocks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": sessionStorage.getItem("token"),
        },
        body: JSON.stringify(payload),
      });
      const json = await resp.json();
      if (resp.ok && json.success) {
        await fetchDayMocks(selectedDate);
        await fetchMonthlySummary(selectedMonth || monthPeriod(selectedDate));
        setForm({
          type: "VARC",
          attempted: "",
          correct: "",
          wrong: "",
          totalQuestions: "",
          totalMarks: "",
          percentage: "",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMock = async (id) => {
    await fetch(`${BASE_API_URL}/api/cat/mocks/${id}`, {
      method: "DELETE",
      headers: { "x-auth-token": sessionStorage.getItem("token") },
    });
    await fetchDayMocks(selectedDate);
    await fetchMonthlySummary(selectedMonth || monthPeriod(selectedDate));
  };

  const tileClassName = ({ date }) => {
    const key = date.toISOString().split("T")[0];
    const count = mockCountsByDate[key] || 0;
    if (!count) return "";
    return "react-calendar__tile--has-workout"; // reuse existing calendar highlight class
  };

  const handleActiveStartDateChange = ({ activeStartDate }) => {
    const today = new Date();
    if (activeStartDate > today) return;
    setSelectedMonth(monthPeriod(activeStartDate));
  };

  const weeklyChartData = useMemo(() => {
    const wb = summary?.weeklyBreakdown || [];
    return wb.map((w) => ({
      name: `W${w.weekNumber}`,
      total: w.totalMocks,
      VARC: w.byType?.VARC || 0,
      LRDI: w.byType?.LRDI || 0,
      QA: w.byType?.QA || 0,
      FULL: w.byType?.FULL || 0,
      avg: w.avgPercent || 0,
    }));
  }, [summary]);

  const lineSeries = useMemo(() => {
    const type = activeTypeTab;
    if (!summary?.seriesByType) return [];
    if (type === "ALL") {
      // merge all into one series as avg per day
      const map = new Map();
      Object.entries(summary.seriesByType).forEach(([t, arr]) => {
        arr.forEach((p) => {
          const cur = map.get(p.date) || { date: p.date, sum: 0, count: 0 };
          cur.sum += Number(p.percentage || 0);
          cur.count += 1;
          map.set(p.date, cur);
        });
      });
      return Array.from(map.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => ({ date: d.date.slice(8), percent: Math.round(d.sum / d.count) }));
    }
    return (summary.seriesByType[type] || [])
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({ date: p.date.slice(8), percent: Number(p.percentage || 0) }));
  }, [summary, activeTypeTab]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-3">
        <div>
          <h2 className="text-3xl font-semibold text-white tracking-tight">CAT</h2>
          <p className="text-xs text-white/60 mt-1">
            Log mock tests per day and review weekly performance for the month.
          </p>
        </div>
        <div className="md:min-w-[220px]">
          <FormControl fullWidth variant="standard">
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disableUnderline
              IconComponent={() => null}
              sx={{
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "white",
                backgroundColor: "rgba(15,23,42,0.7)",
                borderRadius: "9999px",
                paddingX: "14px",
                paddingY: "6px",
                "& .MuiSelect-select": { padding: 0 },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: "rgba(15,23,42,0.95)",
                    color: "white",
                    borderRadius: "0.75rem",
                    "& .MuiMenuItem-root": { fontSize: "0.9rem", paddingY: 0.75 },
                  },
                },
              }}
            >
              {getMonthOptions().map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      {/* Monthly analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111338] border border-white/5 rounded-2xl px-4 py-4">
          <div className="text-xs uppercase tracking-wide text-white/60">Monthly mocks</div>
          <div className="text-2xl font-semibold text-white mt-1">
            {loadingSummary ? "…" : summary?.monthlyStats?.totalMocks ?? 0}
          </div>
          <div className="text-[11px] text-white/60 mt-2">
            Avg %: {loadingSummary ? "…" : summary?.monthlyStats?.avgPercent ?? 0} • Best:{" "}
            {loadingSummary ? "…" : summary?.monthlyStats?.bestPercent ?? 0} • Worst:{" "}
            {loadingSummary ? "…" : summary?.monthlyStats?.worstPercent ?? 0}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/70">
            {["VARC", "LRDI", "QA", "FULL"].map((t) => (
              <span key={t} className="px-2 py-1 bg-white/5 rounded-full border border-white/10">
                {t === "FULL" ? "FULL" : t}: {summary?.monthlyStats?.byType?.[t] ?? 0}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-[#111338] border border-white/5 rounded-2xl px-4 py-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wide text-white/60">Weekly mock count</div>
            <div className="text-[11px] text-white/50">Total + by type</div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(15,23,42,0.6)" }}
                  contentStyle={{ backgroundColor: "#020617", borderRadius: 8, border: "1px solid #4b5563", fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 10, color: "#9ca3af" }} />
                <Bar dataKey="VARC" stackId="mocks" fill="#60a5fa" radius={[0, 0, 0, 0]} />
                <Bar dataKey="LRDI" stackId="mocks" fill="#a78bfa" radius={[0, 0, 0, 0]} />
                <Bar dataKey="QA" stackId="mocks" fill="#34d399" radius={[0, 0, 0, 0]} />
                <Bar dataKey="FULL" stackId="mocks" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyChartData} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  cursor={{ fill: "rgba(15,23,42,0.6)" }}
                  contentStyle={{ backgroundColor: "#020617", borderRadius: 8, border: "1px solid #4b5563", fontSize: 11 }}
                  formatter={(v) => [`${v}%`, "Avg %"]}
                />
                <Line type="monotone" dataKey="avg" stroke="#d62e49" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main layout: left form/list, right calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="bg-[#111338] border border-white/5 rounded-2xl overflow-hidden">
          <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
            <span className="uppercase text-xs text-gray-400 tracking-wider">Mock Tests</span>
            <span className="text-xs text-gray-500">{formatYmd(selectedDate)}</span>
          </div>

          <div className="p-4 space-y-4">
            {/* Add mock form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] text-white/60 uppercase tracking-wide">Add mock</div>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                    className="bg-[#0b1028] border border-white/10 rounded-md px-2 py-1 text-[11px] text-white focus:outline-none"
                  >
                    {TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["attempted", "Attempted"],
                    ["correct", "Correct"],
                    ["wrong", "Wrong"],
                    ["totalQuestions", "Total Q"],
                    ["totalMarks", "Marks"],
                    ["percentage", "%"],
                  ].map(([key, label]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-[10px] text-white/50">{label}</span>
                      <input
                        value={form[key]}
                        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                        inputMode="numeric"
                        className="bg-transparent border-0 border-b border-white/20 focus:border-[#d62e49] outline-none text-white text-sm py-1"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddMock}
                  disabled={saving}
                  className="mt-3 w-full px-3 py-2 rounded-lg bg-[#d62e49] text-sm font-medium hover:bg-[#b8253d] disabled:opacity-60 transition-colors"
                >
                  {saving ? "Saving..." : "Add mock"}
                </button>
              </div>

              {/* Day list */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] text-white/60 uppercase tracking-wide">Mocks for day</div>
                  <div className="text-[11px] text-white/50">
                    {loadingDay ? "…" : `${dayMocks.length} entries`}
                  </div>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {dayMocks.length === 0 && !loadingDay ? (
                    <div className="text-[11px] text-white/50">No mocks added.</div>
                  ) : (
                    dayMocks.map((m) => (
                      <div
                        key={m._id}
                        className="flex items-center justify-between bg-[#0b1028] border border-white/10 rounded-lg px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm text-white font-medium">
                            {m.type === "FULL" ? "FULL" : m.type}{" "}
                            <span className="text-white/50 text-[11px]">• {m.percentage}%</span>
                          </div>
                          <div className="text-[11px] text-white/50">
                            A:{m.attempted} C:{m.correct} W:{m.wrong} • Q:{m.totalQuestions} • M:{m.totalMarks}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteMock(m._id)}
                          className="text-[12px] text-white/40 hover:text-red-400 px-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Weekly analysis tabs + chart */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] text-white/60 uppercase tracking-wide">Score variation</div>
                <div className="flex gap-2">
                  {["ALL", "VARC", "LRDI", "QA", "FULL"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setActiveTypeTab(t)}
                      className={[
                        "px-3 py-1 rounded-full text-[11px] border transition-colors",
                        activeTypeTab === t
                          ? "bg-[#d62e49] border-[#d62e49] text-white"
                          : "bg-transparent border-white/10 text-white/60 hover:bg-white/5",
                      ].join(" ")}
                    >
                      {t === "FULL" ? "FULL" : t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineSeries} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      cursor={{ fill: "rgba(15,23,42,0.6)" }}
                      contentStyle={{ backgroundColor: "#020617", borderRadius: 8, border: "1px solid #4b5563", fontSize: 11 }}
                      formatter={(v) => [`${v}%`, "Score"]}
                    />
                    <Line type="monotone" dataKey="percent" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-[#111338] border border-white/5 rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wide text-white/60 mb-3">Calendar</div>
          <Calendar
            onChange={(d) => setSelectedDate(d)}
            value={selectedDate}
            className="custom-calendar"
            tileClassName={tileClassName}
            onActiveStartDateChange={handleActiveStartDateChange}
            formatShortWeekday={(locale, date) =>
              date.toLocaleDateString("en-US", { weekday: "short" })
            }
            formatMonthYear={(locale, date) =>
              date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
            }
            next2Label={null}
            prev2Label={null}
            minDetail="month"
            maxDetail="month"
            showNeighboringMonth={true}
          />
          <div className="mt-3 text-[11px] text-white/50">
            Highlighted days have at least one mock.
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CatDetails;

