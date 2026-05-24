"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import {
    Users,
    Shield,
    CheckCircle,
    XCircle,
    Activity,
    FileText,
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

    const equipes = data.filter((e) =>
        selectedZone === "ALL"
            ? true
            : e.zone === selectedZone
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
                                    Filtrer par zone
                                </span>
                            </label>

                            <select
                                className="select select-bordered"
                                value={selectedZone}
                                onChange={(e) =>
                                    setSelectedZone(e.target.value)
                                }
                            >

                                <option value="ALL">
                                    Toutes les zones
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

                        {equipes.map((equipe) => (

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

                                        {/* CONTROLES */}
                                        <div className="stat bg-base-200 rounded-xl">

                                            <div className="stat-title">
                                                Contrôles
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

            </div>

            {/* ================= PDF PREVIEW ================= */}

            {openPreview && selectedEquipe && (

                <div className="
                    fixed
                    inset-0
                    bg-black/60
                    flex
                    items-center
                    justify-center
                    p-4
                    z-50
                ">

                    <div className="
                        bg-base-100
                        w-full
                        max-w-5xl
                        rounded-xl
                        overflow-hidden
                        shadow-2xl
                    ">

                        {/* HEADER */}
                        <div className="
                            flex
                            justify-between
                            items-center
                            p-4
                            border-b
                            bg-base-200
                        ">

                            <div>

                                <h2 className="font-bold text-lg">
                                    📄 Rapport équipe {selectedEquipe.equipe}
                                </h2>

                                <p className="text-xs opacity-60">
                                    Zone : {selectedEquipe.zone}
                                </p>

                            </div>

                            <div className="flex gap-2">

                                <button
                                    className="btn btn-sm"
                                    onClick={() =>
                                        setOpenPreview(false)
                                    }
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

                        {/* BODY */}
                        <div className="
                            p-6
                            bg-base-200
                            max-h-[80vh]
                            overflow-auto
                        ">

                            <div
                                ref={reportRef}
                                className="
                                    bg-white
                                    p-10
                                    border
                                    relative
                                "
                            >

                                {/* WATERMARK */}
                                <img
                                    src="/pnc.png"
                                    className="
                                        absolute
                                        left-1/2
                                        top-1/2
                                        -translate-x-1/2
                                        -translate-y-1/2
                                        w-[450px]
                                        opacity-10
                                        pointer-events-none
                                    "
                                />

                                {/* HEADER */}
                                <div className="
                                    flex
                                    items-center
                                    justify-between
                                    border-b
                                    pb-6
                                    mb-8
                                ">

                                    <img
                                        src="/arm.png"
                                        className="h-14 object-contain"
                                    />

                                    <div className="text-center">

                                        <h1 className="
                                            text-lg
                                            font-bold
                                            text-blue-900
                                            uppercase
                                        ">
                                            République Démocratique du Congo
                                        </h1>

                                        <h2 className="
                                            text-red-700
                                            font-semibold
                                            uppercase
                                        ">
                                            Police Nationale Congolaise
                                        </h2>

                                        <p className="
                                            text-sm
                                            mt-2
                                            font-bold
                                        ">
                                            RAPPORT D’ÉQUIPE
                                        </p>

                                    </div>

                                    <img
                                        src="/pnc.png"
                                        className="h-14 object-contain"
                                    />

                                </div>

                                {/* CONTENT */}
                                <div className="
                                    grid
                                    grid-cols-1
                                    md:grid-cols-2
                                    gap-10
                                ">

                                    <div className="
                                        bg-white
                                        border
                                        border-blue-200
                                        rounded-lg
                                        shadow-sm
                                        overflow-hidden
                                    ">

                                        <div className="
                                            bg-blue-900
                                            text-white
                                            px-5
                                            py-3
                                        ">

                                            <h3 className="
                                                text-sm
                                                font-bold
                                                uppercase
                                            ">
                                                📊 Statistiques générales
                                            </h3>

                                        </div>

                                        <div className="p-5">

                                            <Row
                                                label="Équipe"
                                                value={selectedEquipe.totalPoliciers}
                                            />

                                            <Row
                                                label="Contrôles"
                                                value={selectedEquipe.totalControles}
                                            />

                                            <Row
                                                label="Présents"
                                                value={selectedEquipe.presents}
                                                highlight="success"
                                            />

                                        </div>

                                    </div>

                                    <div className="
                                        bg-white
                                        border
                                        border-red-200
                                        rounded-lg
                                        shadow-sm
                                        overflow-hidden
                                    ">

                                        <div className="
                                            bg-red-700
                                            text-white
                                            px-5
                                            py-3
                                        ">

                                            <h3 className="
                                                text-sm
                                                font-bold
                                                uppercase
                                            ">
                                                🧾 Contrôles
                                            </h3>

                                        </div>

                                        <div className="p-5">

                                            <Row
                                                label="Justifiés"
                                                value={selectedEquipe.justifies}
                                                highlight="info"
                                            />

                                            <Row
                                                label="Non justifiés"
                                                value={selectedEquipe.nonJustifies}
                                                highlight="error"
                                            />

                                        </div>

                                    </div>

                                </div>

                                {/* ANALYSE */}
                                <div className="
                                    mt-10
                                    bg-white
                                    border
                                    rounded-xl
                                    shadow-md
                                    overflow-hidden
                                ">

                                    <div className="
                                        bg-gray-900
                                        text-white
                                        px-6
                                        py-4
                                    ">

                                        <h3 className="
                                            text-sm
                                            font-bold
                                            uppercase
                                        ">
                                            📌 Analyse d’écart
                                        </h3>

                                    </div>

                                    <div className="
                                        p-8
                                        text-center
                                    ">

                                        <p className="
                                            text-xs
                                            text-gray-500
                                            uppercase
                                        ">
                                            Policiers non chargés au contrôle
                                        </p>

                                        <p
                                            className={`
                                                text-5xl
                                                font-bold
                                                mt-4
                                                ${policiersNonChargesAuControle > 0
                                                    ? "text-red-700"
                                                    : "text-green-700"}
                                            `}
                                        >
                                            {policiersNonChargesAuControle}
                                        </p>

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