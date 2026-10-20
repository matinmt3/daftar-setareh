"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { faMinutes, faNum, faPercent } from "@/lib/format";
import { formatShortDate } from "@/lib/dates";

const tick = { fontSize: 10, fill: "#7c758c", fontFamily: "inherit" };
const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid #e6ded1",
  background: "#fffdf8",
  boxShadow: "0 18px 46px -24px rgba(33,27,63,0.4)",
  fontFamily: "inherit",
  direction: "rtl" as const,
  fontSize: 11,
  padding: "8px 10px",
};

export function WeeklyStudyChart({
  data,
}: {
  data: { label: string; minutes: number; plannedMinutes: number }[];
}) {
  return (
    <div className="h-56 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 4, left: 4, bottom: 0 }} barGap={3}>
          <CartesianGrid strokeDasharray="3 6" stroke="#eee7db" vertical={false} />
          <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} reversed />
          <YAxis
            tick={tick}
            axisLine={false}
            tickLine={false}
            width={34}
            tickFormatter={(value) => faNum(Number(value))}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "#4b4560", fontWeight: 700, marginBottom: 4 }}
            formatter={(value, name) => [
              faMinutes(Number(value)),
              name === "minutes" ? "مطالعهٔ ثبت‌شده" : "برنامه‌ریزی‌شده",
            ]}
          />
          <Bar dataKey="plannedMinutes" name="plannedMinutes" fill="#ece5f9" radius={[6, 6, 0, 0]} maxBarSize={22} />
          <Bar dataKey="minutes" name="minutes" fill="#6d5bf6" radius={[6, 6, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GradeTrendChart({
  data,
}: {
  data: { date: string; percent: number; subjectName: string; title: string }[];
}) {
  const chartData = data.map((item) => ({
    ...item,
    label: formatShortDate(item.date),
  }));
  return (
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 6" stroke="#eee7db" vertical={false} />
          <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} reversed />
          <YAxis
            domain={[0, 100]}
            tick={tick}
            axisLine={false}
            tickLine={false}
            width={34}
            tickFormatter={(value) => `${faNum(Number(value))}٪`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "#4b4560", fontWeight: 700, marginBottom: 4 }}
            formatter={(value, _name, item) => {
              const payload = item?.payload as { subjectName?: string; title?: string } | undefined;
              return [
                `${faPercent(Number(value))}${payload?.title ? ` • ${payload.title}` : ""}${payload?.subjectName ? ` (${payload.subjectName})` : ""}`,
                "نمره",
              ];
            }}
          />
          <Line
            type="monotone"
            dataKey="percent"
            stroke="#6d5bf6"
            strokeWidth={2.5}
            dot={{ r: 3.5, strokeWidth: 2, fill: "#fffdf8", stroke: "#6d5bf6" }}
            activeDot={{ r: 5, fill: "#f4c95d", stroke: "#4e3ad8" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SubjectBarsChart({
  data,
}: {
  data: { subjectName: string; averagePercent: number; subjectColor: string }[];
}) {
  const chartData = [...data].reverse();
  return (
    <div className="w-full" style={{ height: Math.max(180, chartData.length * 38) }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 6" stroke="#eee7db" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={tick}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${faNum(Number(value))}٪`}
          />
          <YAxis
            type="category"
            dataKey="subjectName"
            tick={{ ...tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={100}
            orientation="right"
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [faPercent(Number(value)), "میانگین"]}
          />
          <Bar dataKey="averagePercent" radius={[0, 8, 8, 0]} maxBarSize={18}>
            {chartData.map((entry) => (
              <Cell key={entry.subjectName} fill={subjectColorHex(entry.subjectColor)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  return (
    <div className="h-48 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 6" stroke="#eee7db" vertical={false} />
          <XAxis dataKey="label" tick={{ ...tick, fontSize: 9 }} axisLine={false} tickLine={false} reversed />
          <YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} width={24} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${faNum(Number(value))} آزمون`, "تعداد"]} />
          <Bar dataKey="count" radius={[7, 7, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={["#f2748b", "#f6a567", "#e5b23c", "#2dbb8c"][index] ?? "#6d5bf6"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyStudyChart({
  data,
}: {
  data: { label: string; minutes: number }[];
}) {
  return (
    <div className="h-52 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="monthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dbb8c" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2dbb8c" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="#eee7db" vertical={false} />
          <XAxis dataKey="label" tick={{ ...tick, fontSize: 9 }} axisLine={false} tickLine={false} reversed />
          <YAxis
            tick={tick}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(value) => faNum(Math.round(Number(value) / 60))}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [faMinutes(Number(value)), "مطالعه"]}
          />
          <Area
            type="monotone"
            dataKey="minutes"
            stroke="#2dbb8c"
            strokeWidth={2.5}
            fill="url(#monthFill)"
            dot={{ r: 3, fill: "#fffdf8", stroke: "#2dbb8c", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function subjectColorHex(color: string): string {
  const map: Record<string, string> = {
    violet: "#6C5CE7",
    sky: "#2E9BEA",
    teal: "#13B5A6",
    green: "#3DBE72",
    orange: "#F28C3A",
    coral: "#F06E86",
    gold: "#D9A21B",
    indigo: "#4A5AC9",
    plum: "#A04F9E",
    slate: "#5C6B82",
  };
  return map[color] ?? "#6C5CE7";
}
