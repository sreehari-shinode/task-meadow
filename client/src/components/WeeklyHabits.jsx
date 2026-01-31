import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormControl, Select, MenuItem } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BASE_API_URL, useAuth } from "../context/AuthContext";

const getMonthKey = (selectedMonth) =>
  selectedMonth && selectedMonth.length >= 7 ? selectedMonth.slice(0, 7) : null;

const WeeklyHabits = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitGoal, setNewHabitGoal] = useState(3);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const metaSaveTimeoutRef = useRef(null);

  // Set default month to current month (YYYY-MM-01)
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const formattedDate = `${firstDayOfMonth.getFullYear()}-${String(
      firstDayOfMonth.getMonth() + 1
    ).padStart(2, "0")}-01`;
    setSelectedMonth(formattedDate);
  }, []);

  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-01`;
      options.push({
        value,
        label: date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      });
    }
    return options;
  };

  const weeksInMonth = useMemo(() => {
    if (!selectedMonth) return 5;
    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const firstWeekday = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(year, month, 0).getDate();
    // Number of calendar weeks that have at least one day from this month
    return Math.ceil((firstWeekday + daysInMonth) / 7);
  }, [selectedMonth]);

  const WEEK_SLOTS = useMemo(
    () => Array.from({ length: weeksInMonth }, (_, i) => i + 1),
    [weeksInMonth]
  );

  const monthKey = getMonthKey(selectedMonth);
  useEffect(() => {
    if (!monthKey || !user) return;
    const token = sessionStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    fetch(`${BASE_API_URL}/api/habits/weekly?month=${monthKey}`, {
      headers: { "x-auth-token": token },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data.success && data.data && Array.isArray(data.data.habits)) {
          setHabits(
            data.data.habits.map((h) => ({
              id: h.id,
              name: h.name,
              goal: h.goal ?? 0,
              checks: Array.isArray(h.checks) ? h.checks : [],
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [monthKey, user]);

  const weeklyStats = useMemo(() => {
    const perWeek = WEEK_SLOTS.map((weekIdx) => {
      const totalPossible = habits.length || 1;
      const completed = habits.reduce(
        (sum, habit) => sum + (habit.checks[weekIdx - 1] ? 1 : 0),
        0
      );
      const percent = Math.round((completed / totalPossible) * 100);
      return { week: weekIdx, completed, totalPossible, percent };
    });
    const overallCompleted = perWeek.reduce((s, w) => s + w.completed, 0);
    const overallTotal = perWeek.reduce((s, w) => s + w.totalPossible, 0) || 1;
    const overallPercent = Math.round((overallCompleted / overallTotal) * 100);
    return { perWeek, overallPercent };
  }, [habits, WEEK_SLOTS]);

  const weeklyCompletionData = useMemo(
    () =>
      weeklyStats.perWeek.map((w) => ({
        name: `W${w.week}`,
        percent: w.percent,
      })),
    [weeklyStats]
  );

  const habitMonthlyData = useMemo(
    () =>
      habits.map((h) => {
        const completedWeeks = h.checks.filter(Boolean).length;
        const percent = Math.round(
          (completedWeeks / (WEEK_SLOTS.length || 1)) * 100
        );
        return {
          name: h.name,
          completedWeeks,
          percent,
        };
      }),
    [habits, WEEK_SLOTS.length]
  );

  const saveWeeklyHabitsToApi = useCallback(
    (payloadHabits) => {
      if (!monthKey) return Promise.resolve();
      const token = sessionStorage.getItem("token");
      if (!token) return Promise.resolve();
      setSaving(true);
      return fetch(`${BASE_API_URL}/api/habits/weekly`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({
          monthKey,
          habits: payloadHabits.map((h) => ({
            id: h.id && String(h.id).length >= 20 ? h.id : undefined,
            name: h.name,
            goal: h.goal ?? 0,
            checks: h.checks ?? [],
          })),
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && Array.isArray(data.data.habits)) {
            const list = data.data.habits.map((h) => ({
              id: h.id,
              name: h.name,
              goal: h.goal ?? 0,
              checks: Array.isArray(h.checks) ? h.checks : [],
            }));
            const seen = new Set();
            const deduped = list.filter((h) => {
              const key = h.id ? h.id.toString() : h.name;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            setHabits(deduped);
          }
        })
        .catch(() => {})
        .finally(() => setSaving(false));
    },
    [monthKey]
  );

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return;
    const goalNumber = parseInt(newHabitGoal, 10) || 0;
    const newHabit = {
      id: null,
      name: newHabitName.trim(),
      goal: goalNumber,
      checks: Array(WEEK_SLOTS.length).fill(false),
    };
    setNewHabitName("");
    setSaving(true);
    saveWeeklyHabitsToApi([...habits, newHabit]);
  };

  const handleHabitMetaChange = (id, field, value) => {
    if (metaSaveTimeoutRef.current) clearTimeout(metaSaveTimeoutRef.current);
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              [field]: field === "goal" ? parseInt(value, 10) || 0 : value,
            }
          : h
      )
    );
    metaSaveTimeoutRef.current = setTimeout(() => {
      setHabits((current) => {
        saveWeeklyHabitsToApi(current);
        return current;
      });
    }, 800);
  };

  const handleRemoveHabit = (id) => {
    const token = sessionStorage.getItem("token");
    const isServerId = id && String(id).length >= 20;
    if (token && isServerId) {
      setSaving(true);
      fetch(`${BASE_API_URL}/api/habits/weekly/${id}`, {
        method: "DELETE",
        headers: { "x-auth-token": token },
      })
        .then(() => {
          setHabits((prev) => prev.filter((h) => h.id !== id));
        })
        .finally(() => setSaving(false));
    } else {
      setHabits((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const toggleCheck = (habitId, weekIndex) => {
    const habit = habits.find((h) => h.id === habitId);
    const current = habit?.checks?.[weekIndex - 1] ?? false;
    const next = !current;
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? {
              ...h,
              checks: h.checks.map((v, i) =>
                i === weekIndex - 1 ? next : v
              ),
            }
          : h
      )
    );
    const token = sessionStorage.getItem("token");
    if (
      token &&
      monthKey &&
      habitId &&
      String(habitId).length >= 20
    ) {
      fetch(`${BASE_API_URL}/api/habits/weekly/completion`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({
          habitDefinitionId: habitId,
          monthKey,
          weekIndex,
          completed: next,
        }),
      }).catch(() => {});
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col gap-6">
      {/* Header + overall progress */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-semibold tracking-wide">
              Weekly Habits
            </h2>
            <FormControl variant="standard" sx={{ minWidth: 120 }} size="small">
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disableUnderline
                IconComponent={() => null}
                sx={{
                  fontSize: "1.8rem",
                  fontWeight: 500,
                  color: "white",
                  backgroundColor: "transparent",
                  borderRadius: "0.5rem",
                  paddingX: "0.25rem",
                  paddingY: 0,
                  "& .MuiSelect-select": {
                    paddingRight: 0,
                    paddingLeft: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: "rgba(15,23,42,0.95)",
                      color: "white",
                      borderRadius: "0.75rem",
                      "& .MuiMenuItem-root": {
                        fontSize: "0.9rem",
                        paddingY: 0.75,
                      },
                    },
                  },
                }}
              >
                {getMonthOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            Track which weeks you hit your bigger routines and goals.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="uppercase text-xs text-gray-400 tracking-wider">
              Overall Progress
            </div>
            <div className="text-2xl font-semibold text-[#22c55e]">
              {weeklyStats.overallPercent}%
            </div>
          </div>
          <div className="w-40 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#22c55e] transition-all duration-300"
              style={{ width: `${weeklyStats.overallPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Weekly overview */}
      <div className="bg-[#111338] border border-white/5 rounded-2xl px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="uppercase text-xs text-gray-400 tracking-wider">
            Weekly Overview
          </div>
          <div className="text-xs text-gray-500">
            Weeks 1–{WEEK_SLOTS.length} • {habits.length} habits
          </div>
        </div>
        <div
          className="grid gap-3 md:gap-4"
          style={{
            gridTemplateColumns: `repeat(${WEEK_SLOTS.length}, minmax(0, 1fr))`,
          }}
        >
          {weeklyStats.perWeek.map((week) => (
            <div
              key={week.week}
              className="flex flex-col gap-1 bg-white/5 rounded-xl px-3 py-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="uppercase tracking-wide text-gray-300">
                  Week {week.week}
                </span>
                <span className="text-gray-400">{week.percent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1b2148] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#22c55e] to-[#a3e635] transition-all duration-300"
                  style={{ width: `${week.percent}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-500">
                {week.completed}/{week.totalPossible} habits done
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly matrix */}
      <div className="bg-[#111338] border border-white/5 rounded-2xl overflow-hidden">
        <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <span className="uppercase text-xs text-gray-400 tracking-wider">
            Weekly Habits Matrix
          </span>
          <span className="text-xs text-gray-500">
            Click cells to mark completion for that week.
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header row – weeks */}
            <div
              className="grid text-[10px] text-gray-400 bg-[#161a3d]"
              style={{
                gridTemplateColumns: `220px repeat(${WEEK_SLOTS.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="px-4 py-2 border-r border-white/5 uppercase tracking-wider">
                Habits
              </div>
              {WEEK_SLOTS.map((week) => (
                <div
                  key={`week-header-${week}`}
                  className="px-1 py-1 text-center border-r border-b border-white/5 text-[#a5b4fc]"
                >
                  W{week}
                </div>
              ))}
            </div>

            {/* Habit rows */}
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="grid text-[11px] bg-[#0e1230]"
                style={{
                  gridTemplateColumns: `220px repeat(${WEEK_SLOTS.length}, minmax(0, 1fr))`,
                }}
              >
                <div className="px-4 py-2 border-r border-white/5 flex flex-col gap-1 justify-center">
                  <div className="flex items-center gap-1">
                    <span className="flex-1 truncate text-gray-100">
                      {habit.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHabit(habit.id)}
                      className="text-[10px] text-gray-500 hover:text-red-400 px-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Goal: {habit.goal} / week
                  </div>
                </div>
                {habit.checks.map((checked, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleCheck(habit.id, index + 1)}
                    className={[
                      "flex items-center justify-center border-r border-b border-white/5 h-7 md:h-8 transition-colors duration-150",
                      checked
                        ? "bg-[#22c55e] hover:bg-[#16a34a]"
                        : "bg-transparent hover:bg-white/10",
                    ].join(" ")}
                    aria-pressed={checked}
                  >
                    <span
                      className={
                        "w-2.5 h-2.5 rounded-full " +
                        (checked ? "bg-white" : "border border-gray-500")
                      }
                    />
                  </button>
                ))}
              </div>
            ))}

            {/* Inline add weekly habit row */}
            <div
              className="grid text-[11px] bg-[#050816]"
              style={{
                gridTemplateColumns: `220px repeat(${WEEK_SLOTS.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="px-4 py-2 border-r border-white/5 flex items-center gap-2">
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Add weekly habit"
                  className="flex-1 rounded-md bg-[#0b1028] border border-white/10 px-2 py-1 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
                />
                <input
                  type="number"
                  min={0}
                  value={newHabitGoal}
                  onChange={(e) => setNewHabitGoal(e.target.value)}
                  className="w-16 rounded-md bg-[#0b1028] border border-white/10 px-2 py-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
                />
                <button
                  type="button"
                  onClick={handleAddHabit}
                  className="px-2 py-1 rounded-md bg-[#22c55e] text-[11px] font-medium hover:bg-[#16a34a] transition-colors duration-150"
                >
                  Add
                </button>
              </div>
              {WEEK_SLOTS.map((week) => (
                <div
                  key={`add-week-placeholder-${week}`}
                  className="border-r border-b border-white/5 h-7 md:h-8 bg-transparent"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {/* Weekly summary table */}
        <div className="bg-[#111338] border border-white/5 rounded-2xl px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="uppercase text-xs text-gray-400 tracking-wider">
              Weekly Summary
            </span>
            <span className="text-xs text-gray-500">
              How each week performed
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-gray-200">
              <thead>
                <tr className="text-left border-b border-white/10 text-[10px] uppercase tracking-wider text-gray-400">
                  <th className="py-2 pr-3">Week</th>
                  <th className="py-2 px-3 text-right">Completed</th>
                  <th className="py-2 px-3 text-right">Possible</th>
                  <th className="py-2 pl-3 text-right">% Done</th>
                </tr>
              </thead>
              <tbody>
                {weeklyStats.perWeek.map((w) => (
                  <tr
                    key={`weekly-row-${w.week}`}
                    className="border-b border-white/5 last:border-b-0"
                  >
                    <td className="py-2 pr-3 text-sm text-gray-100">
                      Week {w.week}
                    </td>
                    <td className="py-2 px-3 text-right text-[11px]">
                      {w.completed}
                    </td>
                    <td className="py-2 px-3 text-right text-[11px] text-gray-400">
                      {w.totalPossible}
                    </td>
                    <td className="py-2 pl-3 text-right text-[11px]">
                      {w.percent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly analysis graphs for weekly habits */}
        <div className="bg-[#111338] border border-white/5 rounded-2xl px-4 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="uppercase text-xs text-gray-400 tracking-wider">
              Monthly Weekly-Habit Analysis
            </span>
            <span className="text-xs text-gray-500">
              Weeks in period: {WEEK_SLOTS.length}
            </span>
          </div>

          {/* Bar chart: completion % per week */}
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyCompletionData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(15,23,42,0.6)" }}
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderRadius: 8,
                    border: "1px solid #4b5563",
                    fontSize: 11,
                  }}
                  formatter={(value) => [`${value}%`, "Completion"]}
                />
                <Bar dataKey="percent" radius={[4, 4, 0, 0]} fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top and lagging weekly habits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                Strong Weekly Habits
              </div>
              <ul className="space-y-1 text-xs">
                {habitMonthlyData
                  .slice()
                  .sort((a, b) => b.percent - a.percent)
                  .slice(0, 3)
                  .map((h) => (
                    <li
                      key={`top-weekly-habit-${h.name}`}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate pr-2">{h.name}</span>
                      <span className="text-gray-300">{h.percent}%</span>
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                Needs Focus
              </div>
              <ul className="space-y-1 text-xs">
                {habitMonthlyData
                  .slice()
                  .sort((a, b) => a.percent - b.percent)
                  .slice(0, 3)
                  .map((h) => (
                    <li
                      key={`low-weekly-habit-${h.name}`}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate pr-2">{h.name}</span>
                      <span className="text-gray-300">{h.percent}%</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyHabits;

