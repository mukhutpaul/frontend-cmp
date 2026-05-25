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

import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

const colorMap: Record<string, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent",
  warning: "text-warning",
  success: "text-success",
  info: "text-info",
  error: "text-error",
};

/* ================= DASHBOARD ================= */

export default function DashboardCards() {
  const { data, loading, error } = useDashboard();

  const total = data?.totalControles ?? 0;
  const present = data?.totalPresent ?? 0;
  const justifie = data?.totalJustifies ?? 0;

  const nonJustifies = Math.abs(total - (present + justifie));


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
      <div className="flex items-start justify-between gap-4">

        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Tableau de bord
          </h1>

          <p className="text-sm text-base-content/60">
            Système de contrôle des effectifs policiers
          </p>
        </div>

        {/* BUTTON EXPORT PDF */}
        {!loading && !error && data && (
          <ReportExporter data={data} />
        )}

      </div>

      {/* PANELS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <Section title="📊 Statistiques générales" color="primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <Card title="Policiers" value={data?.totalPoliciers ?? 0} icon={<Users />} color="primary" />
            <Card title="Unités" value={data?.totalUnites ?? 0} icon={<Building2 />} color="secondary" />
            <Card title="Équipes" value={data?.totalEquipes ?? 0} icon={<ShieldCheck />} color="accent" />
            <Card title="Missions" value={data?.totalMissions ?? 0} icon={<ClipboardCheck />} color="warning" />

          </div>
        </Section>

        <Section title="🧾 Statistiques des contrôles" color="success">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <Card title="Total contrôles" value={total} icon={<ClipboardCheck />} color="primary" />
            <Card title="Présents" value={present} icon={<UserCheck />} color="success" />
            <Card title="Justifiés" value={justifie} icon={<ShieldCheck />} color="info" />
            <Card title="Non justifiés" value={nonJustifies} icon={<UserX />} color="error" />

          </div>
        </Section>

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* PIE */}
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

        {/* BAR */}
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

/* ================= REPORT EXPORTER (INTÉGRÉ ICI) ================= */


function ReportExporter({ data }: { data: any }) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔢 NUMÉRO STABLE OFFICIEL
  const reportNumber = useMemo(() => {
    return `PNC-ABA-RAP-${Date.now().toString().slice(-6)}`;
  }, []);

  const generatePDF = async () => {
    if (!reportRef.current) return;

    setLoading(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(`${reportNumber}.pdf`);
    } finally {
      setLoading(false);
    }
  };
  const policiersNonChargesAuControle =
    (data?.totalPoliciers ?? 0) - (data?.totalControles ?? 0);
  const profile = localStorage.getItem("profile") || "";
  const user = localStorage.getItem("username") || "";

  return (
    <>
      {(profile === "ADMIN" || profile === "MANAGER") && (
        <button
          onClick={() => setOpenPreview(true)}
          className="
      group
      relative
      overflow-hidden
      rounded-xl
      bg-gradient-to-r
      from-slate-800
      via-blue-800
      to-indigo-900
      px-5
      py-3
      text-white
      shadow-lg
      transition-all
      duration-300
      hover:scale-105
      hover:shadow-2xl
      cursor-pointer
      active:scale-95
      flex
      items-center
      gap-3
      border
      border-white/10
    "
        >
          {/* Glow Effect */}
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition duration-300" />

          {/* Icon */}
          <div
            className="
        relative
        z-10
        w-10
        h-10
        rounded-lg
        bg-white/15
        flex
        items-center
        justify-center
        backdrop-blur-sm
      "
          >
            🖨️
          </div>

          {/* Text */}
          <div className="relative z-10 text-left leading-tight">
            <p className="text-sm font-bold uppercase tracking-wide">
              Rapport National
            </p>

            <p className="text-[11px] opacity-80">
              Télécharger et imprimer le rapport
            </p>
          </div>
        </button>
      )}

      {profile === "CHEF_EQUIPE" && (
        <button
          onClick={() => setOpenPreview(true)}
          className="
      group
      relative
      overflow-hidden
      rounded-xl
      bg-gradient-to-r
      from-emerald-700
      via-teal-700
      to-cyan-800
      px-5
      py-3
      text-white
      shadow-lg
      transition-all
      duration-300
      hover:scale-105
      hover:shadow-2xl
      active:scale-95
      flex
      items-center
      gap-3
      border
      border-white/10
    "
        >
          {/* Glow Effect */}
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition duration-300" />

          {/* Icon */}
          <div
            className="
        relative
        z-10
        w-10
        h-10
        rounded-lg
        bg-white/15
        flex
        items-center
        justify-center
        backdrop-blur-sm
      "
          >
            📋
          </div>

          {/* Text */}
          <div className="relative z-10 text-left leading-tight">
            <p className="text-sm font-bold uppercase tracking-wide">
              Rapport Équipe
            </p>

            <p className="text-[11px] opacity-80">
              Équipe de {user}
            </p>
          </div>
        </button>
      )}

      {/* MODAL */}
      {openPreview && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">

          <div className="bg-base-100 w-full max-w-6xl rounded-xl shadow-2xl overflow-hidden">

            {/* HEADER TOOLBAR */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-base-200">

              <div>
                <h3 className="font-bold text-primary text-lg">
                  Aperçu du rapport officiel PNC
                </h3>
                <p className="text-xs text-gray-500">
                  N° {reportNumber}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setOpenPreview(false)}
                  className="btn btn-sm"
                >
                  Fermer
                </button>

                <button
                  onClick={generatePDF}
                  disabled={loading}
                  className="btn btn-success btn-sm"
                >
                  {loading ? "Génération..." : "Télécharger PDF"}
                </button>
              </div>
            </div>

            {/* REPORT */}
            <div className="p-6 bg-base-100 overflow-auto max-h-[80vh]">

              <div
                ref={reportRef}
                className="relative bg-white p-16 border border-gray-300"
              >

                {/* WATERMARK PNC CENTRÉ GRAND */}
                <img
                  src="/pnc.png"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] opacity-10 pointer-events-none"
                />

                {/* HEADER OFFICIEL */}
                <div className="border-b pb-8 mb-12">

                  <div className="flex items-center justify-between">

                    {/* LEFT - ARMES RDC */}
                    <div className="w-24 flex justify-start">
                      <img
                        src="/arm.png"
                        alt="Armoiries RDC"
                        className="h-20 object-contain opacity-90"
                      />
                    </div>

                    {/* CENTER - TEXTES */}
                    <div className="text-center flex-1 px-4">

                      <h1 className="text-lg font-bold tracking-widest text-blue-900 uppercase">
                        RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                      </h1>

                      <h2 className="text-md font-semibold text-red-700 uppercase mt-1">
                        POLICE NATIONALE CONGOLAISE
                      </h2>
                      {(profile === "ADMIN" || profile === "MANAGER") && (
                        <p className="text-sm text-gray-700 mt-4 font-medium uppercase tracking-wide">
                          RAPPORT NATIONAL DES CONTRÔLES DES EFFECTIFS
                        </p>
                      )}

                      {(profile === "CHEF_EQUIPE") && (
                        <p className="text-sm text-gray-700 mt-4 font-medium uppercase tracking-wide">
                          RAPPORT DES CONTRÔLES DES EFFECTIFS DE L'EQUIPE {user}
                        </p>
                      )}
                      <p className="text-xs mt-2 font-bold text-primary tracking-widest">
                        N° {reportNumber}
                      </p>

                    </div>

                    {/* RIGHT - LOGO PNC */}
                    <div className="w-24 flex justify-end">
                      <img
                        src="/pnc.png"
                        alt="PNC"
                        className="h-20 object-contain opacity-90"
                      />
                    </div>

                  </div>

                </div>

                {/* BODY CENTRÉ PRO */}
                {/* BODY CENTRÉ PRO (VERSION OFFICIELLE AMÉLIORÉE) */}
                {/* ================= GRILLE PRINCIPALE ================= */}
                <div className="flex justify-center">
                  <div className="w-full max-w-5xl space-y-10">

                    {/* ================= TOP GRID ================= */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                      {/* ================= STATISTIQUES GÉNÉRALES ================= */}
                      <div className="bg-white border border-blue-200 rounded-lg shadow-sm overflow-hidden">

                        <div className="bg-blue-900 text-white px-5 py-3">
                          <h3 className="text-sm font-bold uppercase tracking-widest">
                            📊 Statistiques générales
                          </h3>
                          <p className="text-[11px] opacity-80">
                            Effectifs et organisation opérationnelle
                          </p>
                        </div>

                        <div className="p-5 space-y-0">
                          <Row label="Policiers" value={data?.totalPoliciers} />
                          <Row label="Unités" value={data?.totalUnites} />
                          <Row label="Équipes" value={data?.totalEquipes} />
                          <Row label="Missions" value={data?.totalMissions} />
                        </div>

                      </div>

                      {/* ================= CONTRÔLES ================= */}
                      <div className="bg-white border border-red-200 rounded-lg shadow-sm overflow-hidden">

                        <div className="bg-red-700 text-white px-5 py-3">
                          <h3 className="text-sm font-bold uppercase tracking-widest">
                            🧾 Contrôles des effectifs
                          </h3>
                          <p className="text-[11px] opacity-80">
                            Suivi de présence et justificatifs
                          </p>
                        </div>

                        <div className="p-5 space-y-0">
                          <Row label="Total contrôles" value={data?.totalControles} />
                          <Row label="Présents" value={data?.totalPresent} highlight="success" />
                          <Row label="Justifiés" value={data?.totalJustifies} highlight="info" />
                          <Row label="Non justifiés" value={data?.totalNonJustifies} highlight="error" />
                        </div>

                      </div>

                    </div>

                    {/* ================= ESPACE VISUEL (IMPORTANT) ================= */}
                    <div className="h-2" />

                    {/* ================= ÉCART AUDIT ================= */}
                    <div className="bg-white border border-gray-300 rounded-xl shadow-md overflow-hidden">

                      {/* HEADER */}
                      <div className="bg-gray-900 text-white px-6 py-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest">
                          📌 Analyse d’écart opérationnel
                        </h3>
                        <p className="text-[11px] opacity-80">
                          Comparaison effectifs vs contrôles réalisés
                        </p>
                      </div>

                      {/* CONTENT */}
                      <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-10">

                        {/* LEFT */}
                        <div className="space-y-3 text-sm text-gray-700">
                          <p>
                            Total policiers :
                            <span className="font-bold text-blue-900 ml-2">
                              {data?.totalPoliciers}
                            </span>
                          </p>

                          <p>
                            Total contrôles :
                            <span className="font-bold text-red-700 ml-2">
                              {data?.totalControles}
                            </span>
                          </p>
                        </div>

                        {/* CENTER */}
                        <div className="text-center">
                          <p className="text-xs text-gray-500 uppercase">
                            Policiers non chargés au contrôle
                          </p>

                          <p
                            className={`text-4xl font-bold mt-2 ${policiersNonChargesAuControle > 0
                              ? "text-red-700"
                              : "text-green-700"
                              }`}
                          >
                            {policiersNonChargesAuControle.toLocaleString()}
                          </p>

                          <p className="text-[11px] text-gray-400 mt-1">
                            Écart structurel détecté
                          </p>
                        </div>

                        {/* RIGHT */}
                        <div className="text-sm text-gray-600 text-right max-w-xs">
                          <p className="font-semibold text-gray-800">
                            Lecture administrative
                          </p>

                          <p className="mt-2">
                            Cet indicateur représente les policiers
                            <span className="font-bold text-gray-900">
                              {" "}non intégrés aux opérations de contrôle
                            </span>.
                          </p>
                        </div>

                      </div>

                    </div>

                  </div>
                </div>
                {/* DIVIDER */}
                <div className="my-14 border-t border-gray-300"></div>

                {/* ================= SIGNATURE + CACHET (VERSION OFFICIELLE) ================= */}
                <div className="mt-14 border-t pt-10">

                  <div className="flex flex-col md:flex-row justify-between items-center gap-12">

                    {/* ================= SIGNATURE ================= */}
                    <div className="flex flex-col items-center text-center w-full md:w-1/2">

                      <p className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                        Chef de Service
                      </p>

                      <p className="text-[11px] text-gray-500 mt-1">
                        Autorité signataire du rapport
                      </p>

                      {/* SIGNATURE BOX */}
                      <div className="mt-6 h-28 w-56 flex items-center justify-center border-b border-gray-300">

                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Commissaire Divisionnaire
                      </p>

                    </div>

                    {/* ================= CACHET ================= */}
                    <div className="flex flex-col items-center text-center w-full md:w-1/2">

                      <p className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                        Cachet Officiel
                      </p>

                      <p className="text-[11px] text-gray-500 mt-1">
                        Validation administrative
                      </p>

                      {/* CACHET CIRCLE PREMIUM */}
                      <div className="mt-6 w-36 h-36 rounded-full border-[5px] border-red-700 shadow-lg flex items-center justify-center bg-white overflow-hidden">

                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Police Nationale Congolaise
                      </p>

                    </div>

                  </div>

                </div>

                {/* FOOTER */}
                <div className="flex flex-col items-center mt-14">
                  <p className="text-[10px] text-center text-blue-900/60 italic tracking-wide">
                    Document officiel généré automatiquement par le Système National de Gestion des Effectifs ABA-PNC
                  </p>

                  <img
                    src="/aba.png"
                    alt="Logo ABA"
                    className="w-12 h-12 mt-2 object-contain"
                  />
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================= SECTION ================= */

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: "success" | "info" | "error";
}) {
  const color =
    highlight === "success"
      ? "text-green-700"
      : highlight === "info"
        ? "text-blue-700"
        : highlight === "error"
          ? "text-red-700"
          : "text-gray-800";

  return (
    <div className="flex justify-between items-center px-2 py-3 border-b last:border-b-0">
      <span className="text-sm text-gray-700">{label}</span>

      <span className={`text-sm font-bold ${color}`}>
        {value?.toLocaleString?.() ?? 0}
      </span>
    </div>
  );
}

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

      <div className="flex justify-between">
        <p className="text-sm text-base-content/60">{title}</p>
        <div className={`p-2 bg-base-200 rounded-lg ${colorMap[color]}`}>
          {icon}
        </div>
      </div>

      <p className="text-2xl font-bold mt-3">
        {(value ?? 0).toLocaleString()}
      </p>

    </div>
  );
}