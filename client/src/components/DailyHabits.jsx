import React, { useCallback, useEffect, useMemo, useState } from "react";
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

const DailyHabits = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitGoal, setNewHabitGoal] = useState(20);
  // const [loading, setLoading] = useState(false);
  // const [saving, setSaving] = useState(false);
  // const metaSaveTimeoutRef = useRef(null);

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

  const daysInMonth = useMemo(() => {
    if (!selectedMonth) return 31;
    const [year, month] = selectedMonth.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMonth]);

  const DAYS = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const weeksCount = useMemo(
    () => Math.ceil(DAYS.length / 7) || 1,
    [DAYS.length]
  );
  const WEEKS = useMemo(
    () => Array.from({ length: weeksCount }, (_, i) => i + 1),
    [weeksCount]
  );

  // Fetch habits for selected month from API (only when user is logged in)
  const monthKey = getMonthKey(selectedMonth);
  useEffect(() => {
    if (!monthKey || !user) return;
    const token = sessionStorage.getItem("token");
    if (!token) return;
    // setLoading(true);
    fetch(`${BASE_API_URL}/api/habits/daily?month=${monthKey}`, {
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
      .finally();
  }, [monthKey, user]);


  const weeklyStats = useMemo(() => {
    const perWeek = WEEKS.map((weekIdx) => {
      const start = (weekIdx - 1) * 7;
      const end = Math.min(start + 7, DAYS.length);
      const daysInWeek = end - start;
      const totalPossible = habits.length * (daysInWeek || 1) || 1;
      const completed = habits.reduce(
        (sum, habit) =>
          sum + habit.checks.slice(start, end).filter(Boolean).length,
        0
      );
      const percent = Math.round((completed / totalPossible) * 100);
      return { week: weekIdx, completed, totalPossible, percent };
    });
    const overallCompleted = perWeek.reduce((s, w) => s + w.completed, 0);
    const overallTotal = perWeek.reduce((s, w) => s + w.totalPossible, 0) || 1;
    const overallPercent = Math.round((overallCompleted / overallTotal) * 100);
    return { perWeek, overallPercent };
  }, [habits, DAYS.length, WEEKS]);

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
        const completedDays = h.checks.filter(Boolean).length;
        const percent = Math.round(
          (completedDays / (DAYS.length || 1)) * 100
        );
        return {
          name: h.name,
          completedDays,
          percent,
        };
      }),
    [habits, DAYS.length]
  );

  const dateStrForDay = useCallback(
    (dayIndex) => {
      if (!selectedMonth) return null;
      const [y, m] = selectedMonth.split("-").map(Number);
      const day = dayIndex + 1;
      return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    },
    [selectedMonth]
  );

  const saveDailyHabitsToApi = useCallback(
    (payloadHabits) => {
      if (!monthKey) return Promise.resolve();
      const token = sessionStorage.getItem("token");
      if (!token) return Promise.resolve();
      // setSaving(true);
      return fetch(`${BASE_API_URL}/api/habits/daily`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({
          monthKey,
          habits: payloadHabits.map((h) => ({
            id: h.id && String(h.id).length > 10 ? h.id : undefined,
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
        .finally();
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
      checks: Array(DAYS.length).fill(false),
    };
    setNewHabitName("");
    // setSaving(true);
    saveDailyHabitsToApi([...habits, newHabit]);
  };

  // const handleHabitMetaChange = (id, field, value) => {
  //   if (metaSaveTimeoutRef.current) clearTimeout(metaSaveTimeoutRef.current);
  //   setHabits((prev) =>
  //     prev.map((h) =>
  //       h.id === id
  //         ? {
  //             ...h,
  //             [field]: field === "goal" ? parseInt(value, 10) || 0 : value,
  //           }
  //         : h
  //     )
  //   );
  //   metaSaveTimeoutRef.current = setTimeout(() => {
  //     setHabits((current) => {
  //       saveDailyHabitsToApi(current);
  //       return current;
  //     });
  //   }, 800);
  // };

  const handleRemoveHabit = (id) => {
    const token = sessionStorage.getItem("token");
    const isServerId = id && String(id).length >= 20;
    if (token && isServerId) {
      // setSaving(true);
      fetch(`${BASE_API_URL}/api/habits/daily/${id}`, {
        method: "DELETE",
        headers: { "x-auth-token": token },
      })
        .then(() => {
          setHabits((prev) => prev.filter((h) => h.id !== id));
        })
        .finally();
    } else {
      setHabits((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const toggleCheck = (habitId, dayIndex) => {
    const habit = habits.find((h) => h.id === habitId);
    const current = habit?.checks?.[dayIndex] ?? false;
    const next = !current;
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? {
              ...h,
              checks: h.checks.map((v, i) => (i === dayIndex ? next : v)),
            }
          : h
      )
    );
    const token = sessionStorage.getItem("token");
    const date = dateStrForDay(dayIndex);
    if (token && date && habitId && String(habitId).length >= 20) {
      fetch(`${BASE_API_URL}/api/habits/daily/completion`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({
          habitDefinitionId: habitId,
          date,
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
              Daily Habits
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
            Track your habits across the month. Click a dot for each day you
            complete a habit.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="uppercase text-xs text-gray-400 tracking-wider">
              Overall Progress
            </div>
            <div className="text-2xl font-semibold text-[#d62e49]">
              {weeklyStats.overallPercent}%
            </div>
          </div>
          <div className="w-40 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#d62e49] transition-all duration-300"
              style={{ width: `${weeklyStats.overallPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Weekly graph */}
      <div className="bg-[#111338] border border-white/5 rounded-2xl px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="uppercase text-xs text-gray-400 tracking-wider">
            Weekly Overview
          </div>
          <div className="text-xs text-gray-500">
            Weeks 1–{weeksCount} • {habits.length} habits • {DAYS.length} days
          </div>
        </div>
        <div
          className="grid gap-3 md:gap-4"
          style={{
            gridTemplateColumns: `repeat(${weeksCount}, minmax(0, 1fr))`,
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
                  className="h-full bg-gradient-to-r from-[#d62e49] to-[#f5a623] transition-all duration-300"
                  style={{ width: `${week.percent}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-500">
                {week.completed}/{week.totalPossible} check-ins
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid header – days & weeks */}
      <div className="bg-[#111338] border border-white/5 rounded-2xl overflow-hidden">
        <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <span className="uppercase text-xs text-gray-400 tracking-wider">
            Daily Habits Matrix
          </span>
          <span className="text-xs text-gray-500">
            Click cells to mark completion for that day.
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Week row */}
            <div
              className="grid text-[10px] text-gray-400 bg-[#161a3d]"
              style={{
                gridTemplateColumns: `220px repeat(${DAYS.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="px-4 py-2 border-r border-white/5 uppercase tracking-wider">
                Goals
              </div>
              {WEEKS.map((week) => {
                const start = (week - 1) * 7;
                const end = Math.min(start + 7, DAYS.length);
                return DAYS.slice(start, end).map((day, idx) => (
                  <div
                    key={`week-${week}-day-label-${day}`}
                    className={
                      "px-1 py-1 text-center border-r border-b border-white/5" +
                      (idx === 0 ? " text-[#f5a623]" : "")
                    }
                  >
                    {idx === 0 ? `W${week}` : ""}
                  </div>
                ));
              })}
            </div>

            {/* Day numbers row */}
            <div
              className="grid text-[10px] text-gray-400 bg-[#14183a]"
              style={{
                gridTemplateColumns: `220px repeat(${DAYS.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="px-4 py-1 border-r border-white/5 uppercase tracking-wider">
                Day
              </div>
              {DAYS.map((day) => (
                <div
                  key={`day-${day}`}
                  className="px-1 py-1 text-center border-r border-b border-white/5"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Habit rows */}
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="grid text-[11px] bg-[#0e1230]"
                style={{
                  gridTemplateColumns: `220px repeat(${DAYS.length}, minmax(0, 1fr))`,
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
                    Goal: {habit.goal} days
                  </div>
                </div>
                {habit.checks.map((checked, dayIndex) => (
                  <button
                    key={dayIndex}
                    type="button"
                    onClick={() => toggleCheck(habit.id, dayIndex)}
                    className={[
                      "flex items-center justify-center border-r border-b border-white/5 h-6 md:h-7 transition-colors duration-150",
                      checked
                        ? "bg-[#d62e49] hover:bg-[#b8253d]"
                        : "bg-transparent hover:bg-white/10",
                    ].join(" ")}
                    aria-pressed={checked}
                  >
                    <span
                      className={
                        "w-2 h-2 rounded-full " +
                        (checked ? "bg-white" : "border border-gray-500")
                      }
                    />
                  </button>
                ))}
              </div>
            ))}

            {/* Inline add habit row */}
            <div
              className="grid text-[11px] bg-[#050816]"
              style={{
                gridTemplateColumns: `220px repeat(${DAYS.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="px-4 py-2 border-r border-white/5 flex items-center gap-2">
                <input
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Add new habit"
                  className="flex-1 rounded-md bg-[#0b1028] border border-white/10 px-2 py-1 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#d62e49]"
                />
                <input
                  type="number"
                  min={0}
                  value={newHabitGoal}
                  onChange={(e) => setNewHabitGoal(e.target.value)}
                  className="w-16 rounded-md bg-[#0b1028] border border-white/10 px-2 py-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-[#d62e49]"
                />
                <button
                  type="button"
                  onClick={handleAddHabit}
                  className="px-2 py-1 rounded-md bg-[#d62e49] text-[11px] font-medium hover:bg-[#b8253d] transition-colors duration-150"
                >
                  Add
                </button>
              </div>
              {DAYS.map((day) => (
                <div
                  key={`add-placeholder-${day}`}
                  className="border-r border-b border-white/5 h-6 md:h-7 bg-transparent"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly habits + monthly analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {/* Weekly habits summary table */}
        <div className="bg-[#111338] border border-white/5 rounded-2xl px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="uppercase text-xs text-gray-400 tracking-wider">
              Weekly Habits Summary
            </span>
            <span className="text-xs text-gray-500">
              Completion by week for selected month
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

        {/* Monthly analysis graphs */}
        <div className="bg-[#111338] border border-white/5 rounded-2xl px-4 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="uppercase text-xs text-gray-400 tracking-wider">
              Monthly Habit Analysis
            </span>
            <span className="text-xs text-gray-500">
              Habit completion for {DAYS.length} days
            </span>
          </div>

          {/* Bar chart: completion % per week */}
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyCompletionData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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

          {/* List: top and low habits by monthly completion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                Top Habits
              </div>
              <ul className="space-y-1 text-xs">
                {habitMonthlyData
                  .slice()
                  .sort((a, b) => b.percent - a.percent)
                  .slice(0, 3)
                  .map((h) => (
                    <li
                      key={`top-habit-${h.name}`}
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
                Needs Attention
              </div>
              <ul className="space-y-1 text-xs">
                {habitMonthlyData
                  .slice()
                  .sort((a, b) => a.percent - b.percent)
                  .slice(0, 3)
                  .map((h) => (
                    <li
                      key={`low-habit-${h.name}`}
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

export default DailyHabits;

