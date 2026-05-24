"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BarChart3, Users, Shield, CheckCircle, XCircle, Activity } from "lucide-react";
import { getStatMissions, StatMission } from "@/services/stats.service";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { useRef } from "react";

export default function StatProvincePage() {

    const [data, setData] = useState<StatMission[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMission, setSelectedMission] = useState<StatMission | null>(null);
    const [openPreview, setOpenPreview] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);
    const [selectedZone, setSelectedZone] = useState("ALL");

    const zones = [...new Set(data.map((m) => m.zone))];

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await getStatMissions();
            setData(res);
        } catch (error) {
            console.error(error);
            toast.error("Erreur chargement statistiques");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // GROUP BY ZONE (PROVINCE)
    const grouped = data.reduce((acc: any, curr) => {

        const zone = curr.zone;

        if (!acc[zone]) {
            acc[zone] = {
                zone,
                missions: [],
                totalPoliciers: 0,
                totalEquipes: 0,
                totalControles: 0,
                presents: 0,
                justifies: 0,
                nonJustifies: 0,
                totalUnites: 0,
            };
        }

        acc[zone].missions.push(curr);

        acc[zone].totalPoliciers += curr.totalPoliciers;
        acc[zone].totalEquipes += curr.totalEquipes;
        acc[zone].totalControles += curr.totalControles;
        acc[zone].presents += curr.presents;
        acc[zone].justifies += curr.justifies;
        acc[zone].nonJustifies += curr.nonJustifies;

        return acc;

    }, {});

    const provinces = Object.values(grouped).filter((p: any) =>
        selectedZone === "ALL" ? true : p.zone === selectedZone
    );
    const policiersNonChargesAuControle =
        (selectedMission?.totalPoliciers ?? 0) - (selectedMission?.totalControles ?? 0);

    const generatePDF = async () => {
        if (!reportRef.current || !selectedMission) return;

        const canvas = await html2canvas(reportRef.current, {
            scale: 3,
            useCORS: true,
            backgroundColor: "#ffffff",
        });

        const img = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = (canvas.height * pageWidth) / canvas.width;

        pdf.addImage(img, "PNG", 0, 0, pageWidth, pageHeight);

        pdf.save(`MISSION-${selectedMission.numero}.pdf`);
    };

    return (
        <DashboardLayout>

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Statistiques par Province</h1>
                    <p className="text-sm opacity-70">
                        Vue globale des missions et effectifs par zone
                    </p>

                    {/* FILTRE PAR ZONE */}
                    <div className="flex justify-end">

                        <div className="form-control w-full max-w-xs">

                            <label className="label">
                                <span className="label-text font-semibold">
                                    Filtrer par province
                                </span>
                            </label>

                            <select
                                className="select select-bordered"
                                value={selectedZone}
                                onChange={(e) => setSelectedZone(e.target.value)}
                            >

                                <option value="ALL">
                                    Toutes les zones
                                </option>

                                {zones.map((zone) => (

                                    <option key={zone} value={zone}>
                                        {zone}
                                    </option>

                                ))}

                            </select>

                        </div>

                    </div>
                </div>

                {/* LOADING */}
                {loading && (
                    <div className="flex justify-center py-10">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                )}

                {/* CONTENT */}
                {!loading && (
                    <div className="space-y-6">

                        {provinces.map((p: any) => (

                            <div
                                key={p.zone}
                                className="card bg-base-100 shadow-md border border-base-300"
                            >

                                <div className="card-body">

                                    {/* HEADER PROVINCE */}
                                    <div className="flex justify-between items-center">

                                        <h2 className="text-xl font-bold">
                                            📍 {p.zone}
                                        </h2>

                                        <span className="badge badge-primary">
                                            {p.missions.length} missions
                                        </span>

                                    </div>

                                    {/* STATS GRID */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">

                                        <div className="stat bg-base-200 rounded-xl">
                                            <div className="stat-title">Policiers</div>
                                            <div className="stat-value text-primary flex items-center gap-2">
                                                <Users size={18} />
                                                {p.totalPoliciers}
                                            </div>
                                        </div>

                                        <div className="stat bg-base-200 rounded-xl">
                                            <div className="stat-title">Unités</div>
                                            <div className="stat-value flex items-center gap-2">
                                                <Shield size={18} />
                                                {p.totalUnites}
                                            </div>
                                        </div>

                                        <div className="stat bg-base-200 rounded-xl">
                                            <div className="stat-title">Équipes</div>
                                            <div className="stat-value flex items-center gap-2">
                                                <Shield size={18} />
                                                {p.totalEquipes}
                                            </div>
                                        </div>

                                        <div className="stat bg-base-200 rounded-xl">
                                            <div className="stat-title">Contrôles</div>
                                            <div className="stat-value text-info flex items-center gap-2">
                                                <Activity size={18} />
                                                {p.totalControles}
                                            </div>
                                        </div>

                                        <div className="stat bg-base-200 rounded-xl">
                                            <div className="stat-title">Présents</div>
                                            <div className="stat-value text-success flex items-center gap-2">
                                                <CheckCircle size={18} />
                                                {p.presents}
                                            </div>
                                        </div>

                                        <div className="stat bg-base-200 rounded-xl">
                                            <div className="stat-title">Justifiés</div>
                                            <div className="stat-value text-success flex items-center gap-2">
                                                <CheckCircle size={18} />
                                                {p.justifies}
                                            </div>
                                        </div>

                                        <div className="stat bg-base-200 rounded-xl">
                                            <div className="stat-title">Non justifiés</div>
                                            <div className="stat-value text-error flex items-center gap-2">
                                                <XCircle size={18} />
                                                {p.nonJustifies}
                                            </div>
                                        </div>

                                        {/* 🔥 NOUVEAU BOUTON PDF */}
                                        <button
                                            className="
                                            group
                                            relative
                                            cursor-pointer
                                            overflow-hidden
                                            rounded-xl
                                            bg-gradient-to-r
                                            from-blue-700
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
                                            active:scale-95
                                            flex
                                            items-center
                                            gap-3
                                        "
                                            onClick={() => {
                                                setSelectedMission(p);
                                                setOpenPreview(true);
                                            }}
                                        >

                                            {/* Glow */}
                                            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition" />

                                            {/* ICON */}
                                            <div className="
                                                    w-9
                                                    h-9
                                                    rounded-lg
                                                    bg-white/15
                                                    flex
                                                    items-center
                                                    justify-center
                                                    backdrop-blur-sm
                                                ">
                                                📄
                                            </div>

                                            {/* TEXT */}
                                            <div className="text-left leading-tight">
                                                <p className="text-sm font-bold uppercase tracking-wide">
                                                    Rapport PDF
                                                </p>

                                                <p className="text-[11px] opacity-80">
                                                    Télécharger le document
                                                </p>
                                            </div>

                                        </button>

                                    </div>

                                    {/* MISSIONS LIST */}
                                    <div className="mt-5">

                                        <h3 className="font-semibold mb-2">
                                            Missions
                                        </h3>

                                        <div className="space-y-2">

                                            {p.missions.map((m: StatMission) => (

                                                <div
                                                    key={m.id}
                                                    className="flex justify-between items-center bg-base-200 p-3 rounded-xl"
                                                >

                                                    <div>
                                                        <p className="font-semibold">
                                                            {m.numero} - {m.mission}
                                                        </p>
                                                        <p className="text-xs opacity-60">
                                                            {m.zone}
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-2 text-xs">

                                                        <span className="badge">
                                                            👮 {m.totalPoliciers}
                                                        </span>

                                                        <span className="badge badge-info">
                                                            🧑‍✈️ {m.totalEquipes}
                                                        </span>

                                                        <span className="badge badge-success">
                                                            ✔ {m.presents}
                                                        </span>

                                                    </div>

                                                </div>

                                            ))}

                                        </div>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>
                )}

            </div>

            {openPreview && selectedMission && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">

                    <div className="bg-base-100 w-full max-w-5xl rounded-xl overflow-hidden shadow-2xl">

                        {/* ================= HEADER ================= */}
                        <div className="flex justify-between items-center p-4 border-b bg-base-200">

                            <div>
                                <h2 className="font-bold text-lg">
                                    📄 Rapport mission {selectedMission?.numero}
                                </h2>
                                <p className="text-xs opacity-60">
                                    Zone : {selectedMission?.zone}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    className="btn btn-sm"
                                    onClick={() => setOpenPreview(false)}
                                >
                                    Fermer
                                </button>

                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={generatePDF}
                                >
                                    Télécharger PDF
                                </button>
                            </div>

                        </div>

                        {/* ================= BODY ================= */}
                        <div className="p-6 bg-base-200 max-h-[80vh] overflow-auto">

                            <div
                                ref={reportRef}
                                className="bg-white p-10 border relative"
                            >

                                {/* WATERMARK */}
                                <img
                                    src="/pnc.png"
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] opacity-10 pointer-events-none"
                                />

                                {/* ================= HEADER OFFICIEL ================= */}
                                <div className="flex items-center justify-between border-b pb-6 mb-8">

                                    <img src="/arm.png" className="h-14 object-contain" />

                                    <div className="text-center">
                                        <h1 className="text-lg font-bold text-blue-900 uppercase">
                                            République Démocratique du Congo
                                        </h1>

                                        <h2 className="text-red-700 font-semibold uppercase">
                                            Police Nationale Congolaise
                                        </h2>

                                        <p className="text-sm mt-2 font-bold">
                                            RAPPORT DE MISSION
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            {selectedMission?.numero} — {selectedMission?.zone}
                                        </p>
                                    </div>

                                    <img src="/pnc.png" className="h-14 object-contain" />

                                </div>

                                {/* ================= STATS ================= */}

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
                                                    <Row label="Policiers" value={selectedMission?.totalPoliciers ?? 0} />
                                                    <Row label="Équipes" value={selectedMission?.totalEquipes ?? 0} />
                                                    <Row label="Contrôles" value={selectedMission?.totalControles ?? 0} />
                                                    <Row label="Missions" value={1} />
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
                                                    <Row label="Total contrôles" value={selectedMission?.totalControles} />
                                                    <Row label="Présents" value={selectedMission?.presents} highlight="success" />
                                                    <Row label="Justifiés" value={selectedMission?.justifies} highlight="info" />
                                                    <Row label="Non justifiés" value={selectedMission?.nonJustifies} highlight="error" />
                                                </div>

                                            </div>

                                        </div>

                                        {/* ================= ESPACE VISUEL (IMPORTANT) ================= */}
                                        <div className="h-2" />



                                    </div>
                                </div>

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
                                                    {selectedMission?.totalPoliciers}
                                                </span>
                                            </p>

                                            <p>
                                                Total contrôles :
                                                <span className="font-bold text-red-700 ml-2">
                                                    {selectedMission?.totalControles}
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

                                {/* ================= FOOTER OFFICIEL ================= */}
                                <div className="mt-10 border-t pt-6 flex justify-center items-center">
                                    <div className="text-center">
                                        <p className="text-xs font-semibold">ABA</p>
                                        <img src="/aba.png" className="h-10 mt-2 mx-auto" />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );

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
                        : "text-gray-900";

        return (
            <div className="flex justify-between items-center px-3 py-3 border-b last:border-b-0">
                <span className="text-sm text-gray-700">{label}</span>

                <span className={`text-sm font-bold ${color}`}>
                    {(value ?? 0).toLocaleString()}
                </span>
            </div>
        );
    }
}