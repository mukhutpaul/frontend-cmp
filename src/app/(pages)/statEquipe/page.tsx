"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import {
    Users,
    Shield,
    CheckCircle,
    XCircle,
    Activity,
    FileText,
    Building2,
} from "lucide-react";

import {
    getStatEquipes,
    StatEquipe,
} from "@/services/stats.service";

import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export default function StatEquipePage() {

    const [data, setData] = useState<StatEquipe[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedEquipe, setSelectedEquipe] =
        useState<StatEquipe | null>(null);

    const [openPreview, setOpenPreview] = useState(false);

    const reportRef = useRef<HTMLDivElement>(null);

    const [selectedZone, setSelectedZone] = useState("ALL");
    const ITEMS_PER_PAGE = 35;

    const [currentPage, setCurrentPage] = useState(1);

    const zones = [...new Set(data.map((m) => m.zone))];

    const fetchStats = async () => {
        try {

            setLoading(true);

            const res = await getStatEquipes();

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

    // 🔢 NUMÉRO STABLE OFFICIEL
    const reportNumber = useMemo(() => {
        return `PNC-ABA-RAP-${Date.now().toString().slice(-6)}`;
    }, []);

    const printDate = useMemo(() => {
        return new Date().toLocaleString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }, []);

    const equipes = data.filter((e) =>
        selectedZone === "ALL"
            ? true
            : e.zone === selectedZone
    );

    const totalPages = Math.ceil(
        equipes.length / ITEMS_PER_PAGE
    );

    const paginatedEquipes = equipes.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const policiersNonChargesAuControle =
        (selectedEquipe?.totalPoliciers ?? 0) -
        (selectedEquipe?.totalControles ?? 0);

    const generatePDF = async () => {

        if (!reportRef.current || !selectedEquipe) return;

        const canvas = await html2canvas(reportRef.current, {
            scale: 3,
            useCORS: true,
            backgroundColor: "#ffffff",
        });

        const img = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");

        const pageWidth = pdf.internal.pageSize.getWidth();

        const pageHeight =
            (canvas.height * pageWidth) / canvas.width;

        pdf.addImage(img, "PNG", 0, 0, pageWidth, pageHeight);

        pdf.save(`EQUIPE-${selectedEquipe.equipe}.pdf`);
    };

    return (
        <DashboardLayout>

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div>

                    <h1 className="text-2xl font-bold">
                        Statistiques des Équipes
                    </h1>

                    <p className="text-sm opacity-70">
                        Vue globale des équipes et contrôles
                    </p>

                    {/* FILTRE */}
                    <div className="flex justify-end mt-4">

                        <div className="form-control w-full max-w-xs">

                            <label className="label">
                                <span className="label-text font-semibold">
                                    Filtrer par province
                                </span>
                            </label>

                            <select
                                className="select select-bordered"
                                value={selectedZone}
                                onChange={(e) => {
                                    setSelectedZone(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >

                                <option value="ALL">
                                    Toutes les provinces
                                </option>

                                {zones.map((zone) => (

                                    <option
                                        key={zone}
                                        value={zone}
                                    >
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

                        {paginatedEquipes.map((equipe) => (

                            <div
                                key={equipe.equipeId}
                                className="
                                    card
                                    bg-base-100
                                    shadow-md
                                    border
                                    border-base-300
                                "
                            >

                                <div className="card-body">

                                    {/* HEADER */}
                                    <div className="flex justify-between items-center">

                                        <div>

                                            <h2 className="text-xl font-bold">
                                                👮 {equipe.equipe}
                                            </h2>

                                            <p className="text-sm opacity-60 mt-1">
                                                Mission :
                                                {" "}
                                                {equipe.missionNumero}
                                            </p>

                                        </div>

                                        <span className="badge badge-primary">
                                            {equipe.zone}
                                        </span>

                                    </div>

                                    {/* GRID */}
                                    <div className="
                                        grid
                                        grid-cols-2
                                        md:grid-cols-5
                                        gap-4
                                        mt-6
                                    ">

                                        {/* POLICIERS */}
                                        <div className="stat bg-base-200 rounded-xl">

                                            <div className="stat-title">
                                                Policiers
                                            </div>

                                            <div className="
                                                stat-value
                                                text-primary
                                                flex
                                                items-center
                                                gap-2
                                            ">
                                                <Users size={18} />
                                                {equipe.totalPoliciers}
                                            </div>

                                        </div>
                                        {/* UNITES */}
                                        <div className="stat bg-base-200 rounded-xl">

                                            <div className="stat-title">
                                                Unités
                                            </div>

                                            <div className="
                                                stat-value
                                                text-primary
                                                flex
                                                items-center
                                                gap-2
                                            ">
                                                <Building2 size={18} />
                                                {equipe.totalUnites}
                                            </div>

                                        </div>


                                        {/* CONTROLES */}
                                        <div className="stat bg-base-200 rounded-xl">

                                            <div className="stat-title">
                                                Total à contrôler
                                            </div>

                                            <div className="
                                                stat-value
                                                text-info
                                                flex
                                                items-center
                                                gap-2
                                            ">
                                                <Activity size={18} />
                                                {equipe.totalControles}
                                            </div>

                                        </div>

                                        {/* PRESENTS */}
                                        <div className="stat bg-base-200 rounded-xl">

                                            <div className="stat-title">
                                                Présents
                                            </div>

                                            <div className="
                                                stat-value
                                                text-success
                                                flex
                                                items-center
                                                gap-2
                                            ">
                                                <CheckCircle size={18} />
                                                {equipe.presents}
                                            </div>

                                        </div>

                                        {/* JUSTIFIES */}
                                        <div className="stat bg-base-200 rounded-xl">

                                            <div className="stat-title">
                                                Justifiés
                                            </div>

                                            <div className="
                                                stat-value
                                                text-blue-700
                                                flex
                                                items-center
                                                gap-2
                                            ">
                                                <Shield size={18} />
                                                {equipe.justifies}
                                            </div>

                                        </div>

                                        {/* NON JUSTIFIES */}
                                        <div className="stat bg-base-200 rounded-xl">

                                            <div className="stat-title">
                                                Non justifiés
                                            </div>

                                            <div className="
                                                stat-value
                                                text-error
                                                flex
                                                items-center
                                                gap-2
                                            ">
                                                <XCircle size={18} />
                                                {equipe.nonJustifies}
                                            </div>

                                        </div>

                                    </div>

                                    {/* BUTTON PDF */}
                                    <div className="mt-6 flex justify-end">

                                        <button
                                            className="
                                                cursor-pointer
                                                group
                                                relative
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
                                                setSelectedEquipe(equipe);
                                                setOpenPreview(true);
                                            }}
                                        >

                                            <span className="
                                                absolute
                                                inset-0
                                                bg-white/10
                                                opacity-0
                                                group-hover:opacity-100
                                                transition
                                            " />

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
                                                <FileText size={18} />
                                            </div>

                                            <div className="text-left leading-tight">

                                                <p className="
                                                    text-sm
                                                    font-bold
                                                    uppercase
                                                    tracking-wide
                                                ">
                                                    Rapport PDF
                                                </p>

                                                <p className="text-[11px] opacity-80">
                                                    Télécharger le document
                                                </p>

                                            </div>

                                        </button>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>


                )}
                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">

                        <button
                            className="btn btn-sm"
                            disabled={currentPage === 1}
                            onClick={() =>
                                setCurrentPage((prev) => prev - 1)
                            }
                        >
                            Précédent
                        </button>

                        {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                        ).map((page) => (
                            <button
                                key={page}
                                className={`btn btn-sm ${currentPage === page
                                        ? "btn-primary"
                                        : "btn-ghost"
                                    }`}
                                onClick={() => setCurrentPage(page)}
                            >
                           
                            </button>
                        ))}

                        <button
                            className="btn btn-sm"
                            disabled={currentPage === totalPages}
                            onClick={() =>
                                setCurrentPage((prev) => prev + 1)
                            }
                        >
                            Suivant
                        </button>

                    </div>
                )}

            </div>

            {/* ================= PDF PREVIEW ================= */}
            {openPreview && selectedEquipe && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">

                    <div className="bg-base-100 w-full max-w-5xl rounded-xl overflow-hidden shadow-2xl">

                        {/* ================= HEADER ================= */}
                        <div className="flex justify-between items-center p-4 border-b bg-base-200">

                            <div>
                                <h2 className="font-bold text-lg">
                                    📄 Rapport mission : Equipe {selectedEquipe?.equipe}
                                </h2>
                                <p className="text-xs opacity-60">
                                    Province : {selectedEquipe?.zone}
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
                                            RAPPORT DE MISSION {selectedEquipe?.missionNumero}-{selectedEquipe?.zone}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            EQUIPE — {selectedEquipe?.equipe}
                                        </p>
                                        <p className="text-xs mt-2 font-bold text-primary tracking-widest">
                                            N° {reportNumber}
                                        </p>
                                        <p className="text-[11px] text-gray-500 mt-2">
                                            Date d’impression : {printDate}
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
                                                    <Row label="Policiers" value={selectedEquipe?.totalPoliciers ?? 0} />

                                                    <Row label="Unités" value={selectedEquipe?.totalUnites ?? 0} />

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
                                                    <Row label="Total à contrôler" value={selectedEquipe?.totalControles} />
                                                    <Row label="Présents" value={selectedEquipe?.presents} highlight="success" />
                                                    <Row label="Justifiés" value={selectedEquipe?.justifies} highlight="info" />
                                                    <Row label="Non justifiés" value={selectedEquipe?.nonJustifies} highlight="error" />
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
                                                    {selectedEquipe?.totalPoliciers}
                                                </span>
                                            </p>

                                            <p>
                                                Total à contrôler :
                                                <span className="font-bold text-red-700 ml-2">
                                                    {selectedEquipe?.totalControles}
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
                                        <p className="text-xs font-semibold">Document officiel généré automatiquement par le Système National de Gestion des Effectifs ABA-PNC</p>
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

            <div className="
                flex
                justify-between
                items-center
                px-3
                py-3
                border-b
                last:border-b-0
            ">

                <span className="text-sm text-gray-700">
                    {label}
                </span>

                <span className={`
                    text-sm
                    font-bold
                    ${color}
                `}>
                    {(value ?? 0).toLocaleString()}
                </span>

            </div>

        );
    }
}