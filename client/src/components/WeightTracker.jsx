import React, { useEffect, useState, useMemo, useRef } from "react";
import { BASE_API_URL } from "../context/AuthContext";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";

const AUTO_SAVE_DELAY_MS = 700;

const formatYmd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getMonthsBack = (n) => {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    out.push({ 
      date: monthStart, 
      dateStr: formatYmd(monthStart),
      monthEnd: formatYmd(monthEnd),
      label: d.toLocaleDateString("en-US", { month: 'short', year: '2-digit' })
    });
  }
  return out.reverse();
};

const getWeeksInMonth = (date) => {
  const out = [];
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  let currentWeek = 1;
  let weekStart = new Date(firstDay);
  
  // Adjust to Monday start
  const dayOfWeek = weekStart.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  
  while (weekStart <= lastDay) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    out.push({
      date: weekStart,
      dateStr: formatYmd(weekStart),
      weekEnd: formatYmd(weekEnd),
      label: `W${currentWeek}`
    });
    
    weekStart.setDate(weekStart.getDate() + 7);
    currentWeek++;
  }
  
  return out;
};

const WeightTracker = () => {
  const [months] = useState(() => getMonthsBack(12));
  const [weeks, setWeeks] = useState([]);
  const [entries, setEntries] = useState({});
  // const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [canEnterToday, setCanEnterToday] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const saveTimeoutRef = useRef(null);

  const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("token") : null;
  const todayStr = formatYmd(new Date());

  // Generate weeks for current month when period changes to month
  useEffect(() => {
    if (selectedPeriod === 'month') {
      setWeeks(getWeeksInMonth(new Date()));
    }
  }, [selectedPeriod]);

  useEffect(() => {
    if (!token) return;
    fetchAnalytics();
    fetchWeightData();
    checkCanEnterWeight();
  }, [token, selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `${BASE_API_URL}/api/weight-tracking/analytics?period=${selectedPeriod}`,
        { headers: { "x-auth-token": token } }
      );
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchWeightData = async () => {
    if (!token) return;
    // setLoading(true);
    try {
      const response = await fetch(
        `${BASE_API_URL}/api/weight-tracking?period=${selectedPeriod}`,
        { headers: { "x-auth-token": token } }
      );
      const data = await response.json();
      if (data.success && data.data) {
        const byDate = {};
        data.data.forEach((entry) => {
          const key = formatYmd(new Date(entry.date));
          byDate[key] = { 
            id: entry._id, 
            weight: entry.weight,
            date: key // Store date string for filtering
          };
        });
        setEntries(byDate);
      }
    } catch (error) {
      console.error('Error fetching weight data:', error);
    } finally {
      // setLoading(false);
    }
  };

  const checkCanEnterWeight = async () => {
    try {
      const response = await fetch(
        `${BASE_API_URL}/api/weight-tracking/can-enter`,
        { headers: { "x-auth-token": token } }
      );
      const data = await response.json();
      if (data.success) {
        setCanEnterToday(data.data.canEnter);
      }
    } catch (error) {
      console.error('Error checking weight entry permission:', error);
    }
  };

  const handleSaveWeight = async (weightValue) => {
    const weight = parseFloat(String(weightValue).trim(), 10);
    if (Number.isNaN(weight) || weight <= 0 || weight > 500) return;
    if (!token) return;

    setSaving(true);
    try {
      const response = await fetch(`${BASE_API_URL}/api/weight-tracking/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({
          weight,
          date: todayStr,
          notes: ''
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        const key = formatYmd(new Date(data.data.date));
        setEntries((prev) => ({
          ...prev,
          [key]: { id: data.data._id, weight: data.data.weight },
        }));
        setWeightInput('');
        fetchAnalytics(); // Refresh analytics after saving
      }
    } catch (error) {
      console.error('Error saving weight:', error);
    } finally {
      setSaving(false);
    }
  };

  const scheduleAutoSave = (value) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const v = String(value).trim();
    if (v === "" || Number.isNaN(parseFloat(v, 10))) return;
    saveTimeoutRef.current = setTimeout(() => {
      handleSaveWeight(v);
    }, AUTO_SAVE_DELAY_MS);
  };

  const chartData = useMemo(() => {
    if (selectedPeriod === 'year') {
      return months.map(({ dateStr, monthEnd, label }) => {
        // Find all entries within this month
        const monthEntries = Object.values(entries).filter(entry => {
          return entry.date >= dateStr && entry.date <= monthEnd;
        });
        
        // Use the latest weight in the month, or null if no entries
        const weight = monthEntries.length > 0 
          ? Math.max(...monthEntries.map(e => e.weight))
          : null;
          
        return { date: dateStr, label, weight, filled: weight != null };
      });
    } else if (selectedPeriod === 'month') {
      return weeks.map(({ dateStr, weekEnd, label }) => {
        // Find all entries within this week
        const weekEntries = Object.values(entries).filter(entry => {
          return entry.date >= dateStr && entry.date <= weekEnd;
        });
        
        // Use the latest weight in the week, or null if no entries
        const weight = weekEntries.length > 0 
          ? Math.max(...weekEntries.map(e => e.weight))
          : null;
          
        return { date: dateStr, label, weight, filled: weight != null };
      });
    }
    return [];
  }, [months, weeks, entries, selectedPeriod]);

  // const todayEntry = entries[todayStr];
  // const todayWeight = todayEntry?.weight ?? "";

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing':
        return '↗️';
      case 'decreasing':
        return '↘️';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-400';
      case 'decreasing':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="w-full bg-[#111338] border border-white/5 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
        <span className="text-xs font-medium text-gray-400 tracking-wider uppercase">Target Weight</span>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="text-[11px] bg-transparent border border-white/10 rounded px-2 py-1 text-white/80 focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
          >
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {/* Weight progress bar */}
        {analytics && (
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-sm">
                  <div className="text-gray-400 text-xs">Current</div>
                  <div className="text-white font-semibold">
                    {analytics.currentWeight ? `${analytics.currentWeight} kg` : '—'}
                  </div>
                </div>
                <div className="text-gray-500">→</div>
                <div className="text-sm">
                  <div className="text-gray-400 text-xs">Target</div>
                  <div className="text-white font-semibold">
                    {analytics.targetWeight ? `${analytics.targetWeight} kg` : '—'}
                  </div>
                </div>
              </div>
              {analytics.trend && (
                <div className={`text-xs ${getTrendColor(analytics.trend)} flex items-center gap-1`}>
                  {getTrendIcon(analytics.trend)} {analytics.trend}
                </div>
              )}
            </div>
            
            {analytics.currentWeight && analytics.targetWeight && (
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>
                    {analytics.weightDifference > 0 ? `${analytics.weightDifference.toFixed(1)} kg to go` : 
                     analytics.weightDifference < 0 ? `${Math.abs(analytics.weightDifference).toFixed(1)} kg exceeded` : 
                     'Target achieved!'}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 relative overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${Math.min(Math.max((analytics.currentWeight / (analytics.targetWeight * 1.2)) * 100, 0), 100)}%` 
                    }}
                  />
                  <div 
                    className="absolute top-0 h-2 w-1 bg-yellow-400 transform -translate-x-1/2"
                    style={{ 
                      left: `${Math.min(Math.max((analytics.targetWeight / (analytics.targetWeight * 1.2)) * 100, 0), 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Weight input for Monday */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">
            {canEnterToday ? "Today's Weight" : "Next entry: Monday"}
          </span>
          {canEnterToday && (
            <>
              <input
                type="number"
                min={0}
                max={500}
                step={0.1}
                value={weightInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setWeightInput(v);
                  scheduleAutoSave(v);
                }}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                  if (v !== "" && !Number.isNaN(parseFloat(v, 10))) handleSaveWeight(v);
                }}
                placeholder="kg"
                className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1]"
              />
              <span className="text-[11px] text-gray-500">kg</span>
            </>
          )}
          {saving && (
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              <span className="animate-spin rounded-full h-2.5 w-2.5 border border-white/30 border-t-white" />
              Saving…
            </span>
          )}
        </div>

        {/* Weight trend chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
            >
              {analytics?.targetWeight && (
                <ReferenceLine 
                  y={analytics.targetWeight} 
                  stroke="#4b5563" 
                  strokeDasharray="2 2" 
                  strokeOpacity={0.6}
                  label={{ value: "Target", position: "right", fill: "#6b7280", fontSize: 9 }}
                />
              )}
              <XAxis
                dataKey="label"
                tick={{ fill: "#6b7280", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                hide
                domain={['dataMin - 2', 'dataMax + 2']}
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
                  props.payload.filled ? `${value} kg` : "—",
                  props.payload.label,
                ]}
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#weightGradient)"
                connectNulls={false}
              />
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WeightTracker;
