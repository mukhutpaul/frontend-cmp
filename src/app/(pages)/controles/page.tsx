"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Search, Printer, Box, User, Ban } from "lucide-react";
import { toast } from "react-toastify";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import QRCode from "qrcode";

import { Controle, ControlesStatsToday, getControles, getControlesStats, getControlesStatsToday, invalidateControle } from "@/services/controle.service";
import { getMissions } from "@/services/mission.service";
import Image from "next/image";
import { FileText } from "lucide-react";
import Swal from "sweetalert2";

/* ========================= STYLE SELECT ========================= */

type Mission = {
    id: string | number;
    zone: string;
    chargeMission?: {
        id: string;
    };
};

export const selectStyles = {
    control: () =>
        "input input-bordered w-full min-h-[48px] flex flex-wrap px-2",
    menu: () =>
        "bg-base-100 border border-base-300 rounded-box shadow-lg mt-2 z-50",
    option: ({ isFocused, isSelected }: any) =>
        `
        px-4 py-2 cursor-pointer text-sm
        ${isFocused ? "bg-base-200" : ""}
        ${isSelected ? "bg-primary text-primary-content" : ""}
    `,
};

/* ========================= PAGE ========================= */

export default function ControlePage() {

    const [controles, setControles] = useState<Controle[]>([]);
    const [search, setSearch] = useState("");
    const [selectedUnite, setSelectedUnite] = useState<string | null>(null);
    const [docRotate, setDocRotate] = useState(0);

    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const [initialLoading, setInitialLoading] = useState(true);

    const [selectedControle, setSelectedControle] = useState<Controle | null>(null);


    const [missions, setMissions] = useState<any[]>([]);
    const [filterPresent, setFilterPresent] = useState<string | null>(null);
    const [filterJustifie, setFilterJustifie] = useState<string | null>(null);

    const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [start, setStart] = useState({ x: 0, y: 0 });
    const [selectedDocuments, setSelectedDocuments] = useState<Controle | null>(null);
    const [docZoom, setDocZoom] = useState<string | null>(null);
    const [docScale, setDocScale] = useState(1);

    const [stats, setStats] = useState<ControlesStatsToday | null>(null);
    const [openStats, setOpenStats] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);

    const [globalStats, setGlobalStats] = useState<ControlesStatsToday | null>(null);
    const [openGlobalStats, setOpenGlobalStats] = useState(false);
    const [loadingGlobalStats, setLoadingGlobalStats] = useState(false);

    const loadGlobalStats = async () => {
        try {
            setLoadingGlobalStats(true);

            const res = await getControlesStats();

            setGlobalStats(res);
            setOpenGlobalStats(true);

        } catch (error) {

            console.error(error);
            toast.error("Erreur chargement statistiques générales");

        } finally {
            setLoadingGlobalStats(false);
        }
    };

    /* ========================= PHOTO ZOOM ========================= */
    useEffect(() => {
        if (zoomPhoto) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [zoomPhoto]);

    useEffect(() => {
        const stop = () => setDragging(false);
        window.addEventListener("mouseup", stop);
        return () => window.removeEventListener("mouseup", stop);
    }, []);

    const loadStats = async () => {
        try {
            setLoadingStats(true);
            const res = await getControlesStatsToday();
            setStats(res);
            setOpenStats(true);
        } catch (e) {
            console.error(e);
            toast.error("Erreur chargement statistiques");
        } finally {
            setLoadingStats(false);
        }
    };
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();

        setScale((prev) => {
            const next = prev - e.deltaY * 0.001;
            return Math.min(Math.max(next, 1), 4);
        });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        setStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging) return;

        setPosition({
            x: e.clientX - start.x,
            y: e.clientY - start.y,
        });
    };

    const handleMouseUp = () => {
        setDragging(false);
    };





    /* ========================= QR DATA ========================= */



    const buildQRData = (c: Controle) => {

        const p = c.policier;

        return JSON.stringify({

            numero: c.uid,
            matricule: c.matricule,
            nom: p?.lastname || "X",
            postnom: p?.postname || "X",
            prenom: p?.firstnames || "X",
            unite: c?.unite || "X",
            sexe: p?.gender || "X",
            groupe: p?.bloodtype || "X",
            dateNaissance: p?.birthDate || "X",
            lieuNaissance: p?.lieu || "X",
            site_controle: c?.equipe?.site || "X",
            // ✅ username chef équipe
            equipe: c?.chefEquipe?.username || "X",
            // ✅ zone mission
            province: c?.seance?.mission?.zone || ""
        });
    };

    /* ========================= LOAD ========================= */

    const loadData = async () => {
        try {
            const res = await getControles();
            const m = await getMissions();
            setMissions(m);
            setControles(Array.isArray(res) ? res : []);
        } catch (err) {
            console.error(err);
            toast.error("Erreur chargement contrôles");
        } finally {
            setInitialLoading(false);
        }
    };

    /* ========================= INIT AUTO REFRESH ========================= */

    useEffect(() => {
        loadData();

        const interval = setInterval(() => {
            loadData();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    /* ========================= FILTER UNITE ========================= */

    const uniqueUnites = useMemo(() => {
        return Array.from(
            new Set(
                controles
                    .map((c) => c.unite)
                    .filter((u) => u && u.trim() !== "" && u !== "null")
            )
        );
    }, [controles]);

    /* ========================= FILTER DATA ========================= */

    const normalize = (v: any) =>
        (v ?? "")
            .toString()
            .toLowerCase()
            .trim();

    const filteredControles = useMemo(() => {
        const searchValue = normalize(search);

        return controles.filter((c) => {
            const p = c.policier;

            const matchSearch =
                !searchValue ||
                normalize(c.uid).includes(searchValue) ||
                normalize(c.matricule).includes(searchValue) ||
                normalize(c.grade).includes(searchValue) ||
                normalize(c.unite).includes(searchValue) ||
                normalize(c.noms).includes(searchValue) ||   // OK si existe
                normalize(p?.lastname).includes(searchValue) ||
                normalize(p?.postname).includes(searchValue) ||
                normalize(p?.firstnames).includes(searchValue);

            const matchUnite =
                !selectedUnite || c.unite === selectedUnite;

            const matchPresent =
                filterPresent === null
                    ? true
                    : filterPresent === "true"
                        ? c.present === true
                        : c.present === false;

            const matchJustifie =
                filterJustifie === null
                    ? true
                    : filterJustifie === "true"
                        ? c.justifie === true
                        : c.justifie === false;

            return matchSearch && matchUnite && matchPresent && matchJustifie;
        });
    }, [controles, search, selectedUnite, filterPresent, filterJustifie]);

    /* ========================= PAGINATION ========================= */

    const totalPages = Math.ceil(filteredControles.length / ITEMS_PER_PAGE);

    /* ========================= INVALIDER CONTROLE ========================= */

    const handleInvalidateControle = async (controle: Controle) => {

        const result = await Swal.fire({
            title: "Invalider ce contrôle ?",
            text: `Le contrôle de ${controle.noms} sera annulé.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Oui, invalider",
            cancelButtonText: "Annuler",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {

            await invalidateControle(controle.id);

            Swal.fire({
                title: "Succès",
                text: "Le contrôle a été invalidé.",
                icon: "success",
                timer: 1800,
                showConfirmButton: false,
            });

            loadData();

        } catch (error) {

            console.error(error);

            Swal.fire({
                title: "Erreur",
                text: "Impossible d'invalider le contrôle.",
                icon: "error",
            });
        }
    };

    const paginatedControles = useMemo(() => {
        return filteredControles.slice(
            (page - 1) * ITEMS_PER_PAGE,
            page * ITEMS_PER_PAGE
        );
    }, [filteredControles, page]);

    /* ========================= PDF PRINT ========================= */

    const handlePrintPDF = async (c: Controle) => {
        if (!c) return;

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [74, 105],
        });

        const p = c.policier;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("CONTRÔLE PNC", 37, 10, { align: "center" });

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text("Police Nationale Congolaise", 37, 15, { align: "center" });

        doc.line(5, 18, 69, 18);

        doc.setFontSize(8);
        doc.text("IDENTITE", 5, 25);

        doc.setFontSize(7);
        doc.text(`Nom: ${p?.lastname ?? "-"}`, 5, 32);
        doc.text(`Postnom: ${p?.postname ?? "-"}`, 5, 37);
        doc.text(`Matricule: ${c.matricule}`, 5, 45);

        const qrString = buildQRData(c);

        const qrData = await QRCode.toDataURL(buildQRData(c), {
            errorCorrectionLevel: "H",
            margin: 2,
            width: 250,
        });

        doc.addImage(qrData, "PNG", 20, 50, 35, 35);

        doc.setTextColor(c.present ? 0 : 200, c.present ? 140 : 0, 0);
        doc.text(c.present ? "PRESENT" : "ABSENT", 37, 95, { align: "center" });

        const blob = doc.output("blob");
        const url = URL.createObjectURL(blob);

        // 🔥 iframe print (PLUS STABLE QUE window.open)
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";

        iframe.src = url;

        document.body.appendChild(iframe);

        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            }, 300);
        };
    };

    /* ========================= UI ========================= */

    return (
        <DashboardLayout>



            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">
                        Contrôles
                    </h1>

                    <p className="text-sm opacity-70">
                        {filteredControles.length} élément(s) trouvé(s)
                    </p>
                    <div className="mt-3 flex justify-center gap-3">

                        <button
                            onClick={loadStats}
                            className="btn btn-primary btn-sm"
                            disabled={loadingStats}
                        >
                            <Box size={16} />
                            Statistiques du jour
                        </button>

                        <button
                            onClick={loadGlobalStats}
                            className="btn btn-secondary btn-sm"
                            disabled={loadingGlobalStats}
                        >
                            <Box size={16} />
                            Statistiques générales
                        </button>

                    </div>
                </div>

                {/* SEARCH */}


                <div className="card bg-base-200 shadow mb-4">
                    <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* SEARCH */}
                        <div className="relative">
                            <Search className="absolute left-3 top-3 opacity-50" />
                            <input
                                className="input input-bordered w-full pl-10"
                                placeholder="Recherche matricule, nom..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        {/* UNITE */}
                        <Select
                            placeholder="Filtrer unité"
                            unstyled
                            isClearable
                            classNames={selectStyles}
                            options={[
                                { value: "", label: "Toutes les unités" },
                                ...uniqueUnites.map((u) => ({
                                    value: u,
                                    label: u,
                                }))
                            ]}
                            onChange={(opt: any) => {
                                setSelectedUnite(opt?.value || null);
                                setPage(1);
                            }}
                        />

                        {/* STATUS QUICK FILTER */}
                        <div className="flex gap-2">

                            <select
                                className="select select-bordered w-full"
                                value={filterPresent ?? ""}
                                onChange={(e) => {
                                    setFilterPresent(e.target.value || null);
                                    setPage(1);
                                }}
                            >
                                <option value="">Présence</option>
                                <option value="true">Présent</option>
                                <option value="false">Absent</option>
                            </select>

                            <select
                                className="select select-bordered w-full"
                                value={filterJustifie ?? ""}
                                onChange={(e) => {
                                    setFilterJustifie(e.target.value || null);
                                    setPage(1);
                                }}
                            >
                                <option value="">Justif</option>
                                <option value="true">Oui</option>
                                <option value="false">Non</option>
                            </select>

                        </div>

                    </div>
                </div>

                {/* TOTAL */}
                <div className="flex items-center justify-between mb-2">
                    <div className="text-sm opacity-70">
                        Total résultats :
                        <span className="font-bold text-primary">
                            {filteredControles.length}
                        </span>
                    </div>

                    <div className="text-sm opacity-60">

                    </div>
                </div>
                {/* TABLE */}
                <div className="card bg-base-100 shadow-md">

                    <div className="card-body p-0 overflow-x-auto">

                        <table className="table">

                            <thead className="bg-base-200">
                                <tr>
                                    <th>Id</th>
                                    <th>Matricule</th>
                                    <th>Noms</th>
                                    <th>Unité</th>
                                    <th>Grade</th>
                                    <th>Présent</th>
                                    <th>Justifié</th>
                                    <th>Photo</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                {/* LOADING */}
                                {initialLoading && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10">
                                            <div className="flex flex-col items-center gap-2">

                                                <span className="loading loading-spinnerer loading-lg text-primary"></span>

                                                <span className="text-sm text-gray-500">
                                                    Chargement des contrôles...
                                                </span>

                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* EMPTY */}
                                {!initialLoading && paginatedControles.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center py-10 text-gray-500"
                                        >

                                            Aucun contrôle trouvé
                                        </td>
                                    </tr>
                                )}

                                {/* DATA */}
                                {!initialLoading && paginatedControles.map((c) => (
                                    <tr key={c.id}>
                                        <td>{c.uid}</td>
                                        <td>{c.matricule}</td>

                                        <td>{c.noms}</td>

                                        <td>{c.unite}</td>

                                        <td>{c.grade}</td>

                                        <td>
                                            <span
                                                className={`badge ${c.present
                                                    ? "badge-success"
                                                    : "badge-error"
                                                    }`}
                                            >
                                                {c.present ? "Oui" : "Non"}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`badge ${c.justifie
                                                    ? "badge-info"
                                                    : "badge-ghost"
                                                    }`}
                                            >
                                                {c.justifie ? "Oui" : "Non"}
                                            </span>
                                        </td>

                                        <td>
                                            {c.photoUrl && c.photoUrl !== "null" ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setZoomPhoto(c.photoUrl!)}
                                                    className="cursor-pointer"
                                                >
                                                    <div className="w-12 h-12 rounded-full overflow-hidden border bg-base-200 flex items-center justify-center cursor-pointer">

                                                        <Image
                                                            src={`LOCAL` + c.photoUrl}
                                                            alt="photo"
                                                            width={48}
                                                            height={48}
                                                            className="w-full h-full object-cover"
                                                            unoptimized
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = "none";
                                                            }}
                                                        />

                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center border">
                                                    <User size={22} className="text-gray-400" />
                                                </div>
                                            )}
                                        </td>

                                        <td className="flex gap-2">

                                            {/* PRINT */}
                                            {c.present && (
                                                <button
                                                    className="btn btn-sm btn-primary btn-outline"
                                                    onClick={() => setSelectedControle(c)}
                                                >
                                                    <Printer size={16} />
                                                </button>
                                            )}

                                            {/* DOCUMENT ICON (ONLY IF JUSTIFIE) */}
                                            {c.justifie && c.documents && c.documents.length > 0 && (
                                                <button
                                                    className="btn btn-sm btn-secondary btn-outline"
                                                    onClick={() => setSelectedDocuments(c)}
                                                >
                                                    <FileText size={16} />
                                                </button>
                                            )}


                                            {(c.present === true || c.justifie === true) && (

                                                <button
                                                    className="
                                                            btn
                                                            btn-sm
                                                            btn-error
                                                            btn-outline
                                                            hover:scale-105
                                                            transition-all
                                                            duration-200"
                                                    onClick={() => handleInvalidateControle(c)}
                                                    title="Invalider le contrôle"
                                                >
                                                    <Ban size={16} />
                                                </button>
                                            )}

                                        </td>

                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>

                    {/* PAGINATION */}
                    {/* PAGINATION SIMPLE */}
                    {!initialLoading && filteredControles.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-4 border-t border-base-200">

                            <div className="text-sm text-gray-500">
                                Page <span className="font-bold">{page}</span> / {totalPages}
                            </div>

                            <div className="join">

                                <button
                                    className="join-item btn btn-sm"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                >
                                    « Précédent
                                </button>

                                <button
                                    className="join-item btn btn-sm"
                                    disabled={page === totalPages}
                                    onClick={() =>
                                        setPage((p) => Math.min(p + 1, totalPages))
                                    }
                                >
                                    Suivant »
                                </button>

                            </div>

                        </div>
                    )}

                </div>

                {/* MODAL QR */}
                {selectedControle && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">

                        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

                            {/* HEADER */}
                            <div className="bg-blue-900 text-white p-4 text-center">
                                <h2 className="text-lg font-bold tracking-wide">
                                    PNC - CONTRÔLE
                                </h2>
                                <p className="text-xs opacity-80">
                                    Police Nationale Congolaise
                                </p>
                            </div>

                            {/* BODY */}
                            <div className="p-5 space-y-4">

                                {/* NOM PRINCIPAL */}
                                <div className="text-center">
                                    <p className="text-xl font-extrabold uppercase text-gray-800">
                                        {selectedControle?.policier?.lastname}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        {selectedControle?.policier?.postname} {selectedControle?.policier?.firstnames}
                                    </p>
                                </div>

                                {/* INFOS + QR */}
                                <div className="grid grid-cols-2 gap-4 items-center">

                                    {/* INFOS */}
                                    <div className="text-xs space-y-1 bg-gray-50 p-3 rounded-lg">
                                        <p><span className="font-semibold">Mat:</span> {selectedControle.matricule}</p>
                                        <p><span className="font-semibold">Grade:</span> {selectedControle.grade}</p>
                                        <p><span className="font-semibold">Unité:</span> {selectedControle.unite}</p>

                                        <p className="mt-2">
                                            <span className={`px-2 py-1 rounded text-white text-[10px]
                                ${selectedControle.present ? "bg-green-600" : "bg-red-600"}`}>
                                                {selectedControle.present ? "PRESENT" : "ABSENT"}
                                            </span>
                                        </p>
                                    </div>

                                    {/* QR */}
                                    <div className="flex justify-center">
                                        <div className="p-2 bg-white border rounded-xl shadow">
                                            <QRCodeCanvas
                                                value={buildQRData(selectedControle)}
                                                size={140}
                                                level="H"
                                                includeMargin={true}
                                            />
                                        </div>
                                    </div>

                                </div>

                                {/* ACTIONS */}
                                <div className="flex gap-2 pt-3">

                                    <button
                                        className="btn btn-outline w-1/2"
                                        onClick={() => setSelectedControle(null)}
                                    >
                                        Fermer
                                    </button>

                                    <button
                                        className="btn btn-primary w-1/2"
                                        onClick={() => handlePrintPDF(selectedControle)}
                                    >
                                        Imprimer PDF
                                    </button>

                                </div>

                            </div>

                        </div>
                    </div>
                )}

            </div>

            {zoomPhoto && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

                    <div className="relative bg-base-100 p-4 rounded-xl shadow-xl max-w-3xl w-full">

                        {/* CLOSE */}
                        <button
                            className="btn btn-sm btn-circle btn-error absolute top-2 right-2 z-50"
                            onClick={() => setZoomPhoto(null)}
                        >
                            ✕
                        </button>

                        {/* IMAGE AREA */}
                        <div
                            className="w-full h-[500px] overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <img
                                src={`http://localhost:8090/` + zoomPhoto}
                                alt="zoom"
                                className="select-none max-w-none"
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                    transition: dragging ? "none" : "transform 0.1s ease",
                                    cursor: dragging ? "grabbing" : "grab"
                                }}
                                draggable={false}
                                onError={() => {
                                    console.log("Image zoom failed:", zoomPhoto);
                                }}
                            />
                        </div>

                        {/* CONTROLS */}
                        <div className="flex justify-center gap-2 mt-3">
                            <button
                                className="btn btn-sm"
                                onClick={() => setScale((s) => Math.min(s + 0.2, 4))}
                            >
                                Zoom +
                            </button>

                            <button
                                className="btn btn-sm"
                                onClick={() => setScale((s) => Math.max(s - 0.2, 1))}
                            >
                                Zoom -
                            </button>

                            <button
                                className="btn btn-sm"
                                onClick={() => {
                                    setScale(1);
                                    setPosition({ x: 0, y: 0 });
                                }}
                            >
                                Reset
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {selectedDocuments && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">

                    {/* BACKDROP (click outside DOES NOT close) */}
                    <div className="absolute inset-0 bg-black/70"></div>

                    {/* MODAL */}
                    <div className="relative bg-base-100 w-full max-w-4xl rounded-xl shadow-xl p-4 z-10">

                        {/* CLOSE BUTTON ONLY */}
                        <button
                            className="btn btn-sm btn-circle btn-error absolute top-2 right-2"
                            onClick={() => {
                                setSelectedDocuments(null);
                                setDocZoom(null);
                                setDocScale(1);
                            }}
                        >
                            ✕
                        </button>

                        <h2 className="text-lg font-bold mb-4">
                            Documents du contrôle
                        </h2>

                        {/* LIST SCROLL */}
                        <div className="flex gap-4 overflow-x-auto p-2">

                            {selectedDocuments.documents?.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="min-w-[250px] bg-base-200 rounded-lg p-2 shadow"
                                >

                                    <p className="font-semibold text-sm">{doc.title}</p>
                                    <p className="text-xs opacity-70">{doc.description}</p>

                                    {/* IMAGE */}
                                    <img
                                        src={`http://localhost:8090/documents/${doc.imageUrl}`}
                                        className="w-full h-40 object-cover rounded mt-2 cursor-zoom-in"
                                        onClick={() => {
                                            setDocZoom(`http://localhost:8090/documents/${doc.imageUrl}`);
                                            setDocScale(1);
                                            setDocRotate(0);
                                        }}
                                    />
                                </div>
                            ))}

                        </div>
                    </div>
                </div>
            )}

            {docZoom && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">

                    {/* MODAL WRAPPER */}
                    <div className="relative bg-base-100 w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">

                        {/* HEADER (FIXED + SAFE BUTTON) */}
                        <div className="relative px-4 py-3 border-b bg-base-200 flex items-center justify-between shrink-0">

                            <h3 className="font-semibold text-sm">
                                Aperçu document
                            </h3>

                            {/* CLOSE BUTTON (SAFE INSIDE HEADER) */}
                            <button
                                className="btn btn-sm btn-circle btn-error"
                                onClick={() => {
                                    setDocZoom(null);
                                    setDocScale(1);
                                    setDocRotate(0);
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* SCROLLABLE VIEWPORT */}
                        <div className="flex-1 overflow-auto bg-black/10">
                            <div className="min-w-full min-h-full flex justify-center items-start p-4">
                                <img
                                    src={docZoom}
                                    draggable={false}
                                    className="select-none block mx-auto"
                                    style={{
                                        transform: `scale(${docScale}) rotate(${docRotate}deg)`,
                                        transformOrigin: "center top",
                                        maxWidth: "100%",
                                        maxHeight: "none",
                                    }}
                                />
                            </div>
                        </div>

                        {/* CONTROLS */}
                        <div className="shrink-0 px-4 py-3 border-t bg-base-200 flex justify-center gap-2">

                            <button
                                className="btn btn-sm"
                                onClick={() => setDocScale((s) => Math.min(s + 0.2, 4))}
                            >
                                Zoom +
                            </button>

                            <button
                                className="btn btn-sm"
                                onClick={() => setDocScale((s) => Math.max(s - 0.2, 1))}
                            >
                                Zoom -
                            </button>

                            <button
                                className="btn btn-sm btn-outline"
                                onClick={() => setDocScale(1)}
                            >
                                Reset
                            </button>

                            <button
                                className="btn btn-sm"
                                onClick={() => setDocRotate((r) => r - 90)}
                            >
                                ↺ -90°
                            </button>

                            <button
                                className="btn btn-sm"
                                onClick={() => setDocRotate((r) => r + 90)}
                            >
                                ↻ +90°
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {openStats && stats && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

                    <div className="bg-base-100 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">

                        {/* HEADER */}
                        <div className="bg-primary text-primary-content p-4 flex justify-between items-center">
                            <h2 className="text-lg font-bold">
                                Statistiques des contrôles (Aujourd’hui)
                            </h2>

                            <button
                                className="btn btn-sm btn-circle btn-ghost"
                                onClick={() => setOpenStats(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">

                            <StatBox label="Total contrôles" value={stats.totalControles} />
                            <StatBox label="Présents" value={stats.totalPresent} color="text-success" />
                            <StatBox label="Justifiés" value={stats.totalJustifie} color="text-info" />

                            <StatBox label="Hommes présents" value={stats.totalHommesPresent} />
                            <StatBox label="Femmes présentes" value={stats.totalFemmesPresent} />

                            <StatBox label="Hommes justifiés" value={stats.totalHommesJustifies} />
                            <StatBox label="Femmes justifiées" value={stats.totalFemmesJustifies} />

                            <StatBox
                                label="Total présent + justifié"
                                value={stats.totalGlobalPresentEtJustifie}
                                highlight
                            />

                            <StatBox label="Unités" value={stats.totalUnites} />

                        </div>

                        {/* UNITS BREAKDOWN */}
                        {/* ===================== REPARTITION PAR UNITE ===================== */}
                        <div className="p-5 border-t bg-base-200">

                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">
                                    Répartition par unité
                                </h3>

                                <div className="badge badge-primary badge-lg">
                                    {stats.totalUnites} unité(s)
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">

                                {Object.entries(
                                    stats.statsParUnite as Record<string, number>
                                )
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([unite, total], index) => {

                                        const percentage =
                                            stats.totalControles > 0
                                                ? (total / stats.totalControles) * 100
                                                : 0;

                                        const badgeClass =
                                            total >= 5
                                                ? "badge-success"
                                                : total >= 3
                                                    ? "badge-warning"
                                                    : "badge-primary";

                                        return (
                                            <div
                                                key={unite}
                                                className="
                                                    bg-base-100
                                                    border
                                                    border-base-300
                                                    rounded-xl
                                                    p-4
                                                    shadow-sm
                                                    hover:shadow-md
                                                    transition-all"
                                            >

                                                {/* HEADER */}
                                                <div className="flex justify-between items-start gap-3 mb-2">

                                                    <div className="flex items-center gap-2">

                                                        <div className="
                                                            w-8 h-8
                                                            rounded-full
                                                            bg-primary
                                                            text-primary-content
                                                            flex items-center justify-center
                                                            text-xs font-bold
                                                        ">
                                                            #{index + 1}
                                                        </div>

                                                        <div>
                                                            <p className="font-semibold text-sm leading-tight">
                                                                {unite}
                                                            </p>

                                                            <p className="text-xs opacity-60">
                                                                {percentage.toFixed(1)}% des contrôles
                                                            </p>
                                                        </div>

                                                    </div>

                                                    <div className={`badge badge-lg ${badgeClass}`}>
                                                        Reste à Controler : {total}
                                                    </div>

                                                </div>

                                                {/* PROGRESS */}
                                                <progress
                                                    className="progress progress-primary w-full"
                                                    value={total}
                                                    max={stats.totalControles}
                                                />

                                            </div>
                                        );
                                    })}

                            </div>

                        </div>

                    </div>
                </div>
            )}

            {openGlobalStats && globalStats && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

                    <div className="bg-base-100 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden">

                        {/* HEADER */}
                        <div className="bg-secondary text-secondary-content p-4 flex justify-between items-center">

                            <div>
                                <h2 className="text-xl font-bold">
                                    Statistiques Générales
                                </h2>

                                <p className="text-sm opacity-80">
                                    Toutes les données enregistrées
                                </p>
                            </div>

                            <button
                                className="btn btn-sm btn-circle btn-ghost"
                                onClick={() => setOpenGlobalStats(false)}
                            >
                                ✕
                            </button>

                        </div>

                        {/* STATS */}
                        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">

                            <StatBox
                                label="Total contrôles"
                                value={globalStats.totalControles}
                            />

                            <StatBox
                                label="Présents"
                                value={globalStats.totalPresent}
                                color="text-success"
                            />

                            <StatBox
                                label="Justifiés"
                                value={globalStats.totalJustifie}
                                color="text-info"
                            />

                            <StatBox
                                label="Hommes présents"
                                value={globalStats.totalHommesPresent}
                            />

                            <StatBox
                                label="Femmes présentes"
                                value={globalStats.totalFemmesPresent}
                            />

                            <StatBox
                                label="Hommes justifiés"
                                value={globalStats.totalHommesJustifies}
                            />

                            <StatBox
                                label="Femmes justifiées"
                                value={globalStats.totalFemmesJustifies}
                            />

                            <StatBox
                                label="Présents + Justifiés"
                                value={globalStats.totalGlobalPresentEtJustifie}
                                highlight
                            />

                            <StatBox
                                label="Total unités"
                                value={globalStats.totalUnites}
                            />

                        </div>

                        {/* REPARTITION */}
                        <div className="p-5 border-t bg-base-200">

                            <div className="flex items-center justify-between mb-4">

                                <h3 className="text-lg font-bold">
                                    Répartition par unité
                                </h3>

                                <div className="badge badge-secondary badge-lg">
                                    {globalStats.totalUnites} unité(s)
                                </div>

                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto">

                                {Object.entries(
                                    globalStats.statsParUnite as Record<string, number>
                                )
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([unite, total], index) => {

                                        const percentage =
                                            globalStats.totalControles > 0
                                                ? (total / globalStats.totalControles) * 100
                                                : 0;

                                        return (
                                            <div
                                                key={unite}
                                                className="
                                        bg-base-100
                                        rounded-xl
                                        border
                                        border-base-300
                                        p-4
                                        shadow-sm
                                    "
                                            >

                                                <div className="flex justify-between mb-2">

                                                    <div className="flex gap-3 items-center">

                                                        <div
                                                            className="
                                                    w-8 h-8
                                                    rounded-full
                                                    bg-secondary
                                                    text-secondary-content
                                                    flex items-center justify-center
                                                    text-xs font-bold
                                                "
                                                        >
                                                            #{index + 1}
                                                        </div>

                                                        <div>

                                                            <p className="font-semibold">
                                                                {unite}
                                                            </p>

                                                            <p className="text-xs opacity-60">
                                                                {percentage.toFixed(1)}%
                                                                du total
                                                            </p>

                                                        </div>

                                                    </div>

                                                    <div className="badge badge-secondary badge-lg">
                                                        Reste à contrôler : {total}
                                                    </div>

                                                </div>

                                                <progress
                                                    className="progress progress-secondary w-full"
                                                    value={total}
                                                    max={globalStats.totalControles}
                                                />

                                            </div>
                                        );
                                    })}

                            </div>

                        </div>

                    </div>

                </div>
            )}
        </DashboardLayout>
    );

}

function StatBox({
    label,
    value,
    color = "",
    highlight = false,
}: {
    label: string;
    value: number;
    color?: string;
    highlight?: boolean;
}) {
    return (
        <div className={`
            p-3 rounded-xl border bg-base-100 shadow-sm
            ${highlight ? "border-primary" : "border-base-300"}
        `}>
            <p className="text-xs opacity-60">{label}</p>
            <p className={`text-xl font-bold ${color}`}>
                {value}
            </p>
        </div>
    );
}

