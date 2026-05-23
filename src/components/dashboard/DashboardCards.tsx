"use client";

import {
  Users,
  Building2,
  ShieldCheck,
  ClipboardCheck,
  UserCheck,
  UserX,
} from "lucide-react";

import { useDashboard } from "@/hooks/useDashboard";
import type { ReactNode } from "react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const colorMap: Record<string, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent",
  warning: "text-warning",
  success: "text-success",
  info: "text-info",
  error: "text-error",
};

export default function DashboardCards() {
  const { data, loading, error } = useDashboard();

  const total = data?.totalControles ?? 0;
  const present = data?.totalPresent ?? 0;
  const justifie = data?.totalJustifies ?? 0;

  const nonJustifies = Math.abs(
    total - (present + justifie)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 space-y-3">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="text-sm opacity-70">Chargement dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-error space-y-2">
        <p className="font-semibold">❌ Erreur chargement dashboard</p>
        <p className="text-xs opacity-70 max-w-md mx-auto">{error}</p>

        <button
          onClick={() => window.location.reload()}
          className="btn btn-sm btn-error mt-3"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* HEADER */}
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">

        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Tableau de bord
          </h1>

          <p className="text-sm text-base-content/60">
            Système de contrôle des effectifs policiers
          </p>
        </div>

        {/* ACTION BUTTON */}
        <button
          onClick={() => window.print()}
          className="btn btn-primary btn-sm gap-2 shadow-md"
        >
          🖨️ Imprimer rapport national
        </button>

      </div>

      {/* ================= PANELS ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ================= GENERAL ================= */}
        <Section title="📊 Statistiques générales" color="primary">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <Card title="Policiers" value={data?.totalPoliciers ?? 0} icon={<Users />} color="primary" />
            <Card title="Unités" value={data?.totalUnites ?? 0} icon={<Building2 />} color="secondary" />
            <Card title="Équipes" value={data?.totalEquipes ?? 0} icon={<ShieldCheck />} color="accent" />
            <Card title="Missions" value={data?.totalMissions ?? 0} icon={<ClipboardCheck />} color="warning" />

          </div>

        </Section>

        {/* ================= CONTROLES ================= */}
        <Section title="🧾 Statistiques des contrôles" color="success">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <Card title="Total contrôles" value={total} icon={<ClipboardCheck />} color="primary" />
            <Card title="Présents" value={present} icon={<UserCheck />} color="success" />
            <Card title="Justifiés" value={justifie} icon={<ShieldCheck />} color="info" />
            <Card title="Non justifiés" value={nonJustifies} icon={<UserX />} color="error" />

          </div>

        </Section>

      </div>

      {/* ================= GRAPHIQUES ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* PIE CHART CONTROLES */}
        <div className="card bg-base-100 border border-base-300 shadow-sm p-5">

          <h2 className="text-lg font-semibold mb-4 text-success">
            📊 Répartition des contrôles
          </h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">

              <PieChart>

                <Pie
                  data={[
                    { name: "Présents", value: present },
                    { name: "Justifiés", value: justifie },
                    { name: "Non justifiés", value: nonJustifies },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#ef4444" />
                </Pie>

                <Tooltip />
                <Legend />

              </PieChart>

            </ResponsiveContainer>
          </div>

        </div>

        {/* BAR CHART GENERAL */}
        <div className="card bg-base-100 border border-base-300 shadow-sm p-5">

          <h2 className="text-lg font-semibold mb-4 text-primary">
            📊 Statistiques générales
          </h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">

              <BarChart
                data={[
                  { name: "Policiers", value: data?.totalPoliciers ?? 0 },
                  { name: "Unités", value: data?.totalUnites ?? 0 },
                  { name: "Équipes", value: data?.totalEquipes ?? 0 },
                  { name: "Missions", value: data?.totalMissions ?? 0 },
                ]}
              >

                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />

                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />

              </BarChart>

            </ResponsiveContainer>
          </div>

        </div>

      </div>

    </div>
  );
}

/* ================= SECTION ================= */
function Section({
  title,
  children,
  color,
}: {
  title: string;
  children: ReactNode;
  color?: keyof typeof colorMap;
}) {
  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm p-5">
      <h2 className={`text-lg font-semibold mb-4 ${color ? colorMap[color] : ""}`}>
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ================= CARD ================= */
function Card({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  color: keyof typeof colorMap;
}) {
  return (
    <div className="group bg-base-100 border border-base-300 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">

      <div className="flex items-center justify-between">
        <p className="text-sm text-base-content/60">{title}</p>
        <div className={`p-2 rounded-lg bg-base-200 ${colorMap[color]}`}>
          {icon}
        </div>
      </div>

      <p className="text-2xl font-bold mt-3">
        {(value ?? 0).toLocaleString()}
      </p>

      <div className="h-1 mt-3 bg-base-200 rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color]} w-2/3 group-hover:w-full transition-all duration-500`} />
      </div>

    </div>
  );
}