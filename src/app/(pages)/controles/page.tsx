"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Search, Printer, Box, User } from "lucide-react";
import { toast } from "react-toastify";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import QRCode from "qrcode";

import { Controle, getControles } from "@/services/controle.service";
import { getMissions } from "@/services/mission.service";
import Image from "next/image";

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

            numero:c.uid,
            matricule: c.matricule,
            nom: p?.lastname || "X",
            postnom: p?.postname || "X",
            prenom: p?.firstnames || "X",
            unite: c?.unite || "X",
            sexe: p?.gender || "X",
            groupe: p?.bloodtype || "X",
            dateNaissance: p?.birthDate || "X",
            lieuNaissance: p?.lieu || "X",
            site_controle:c?.equipe?.site || "X",
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

                <h1 className="text-2xl font-bold">Contrôles</h1>

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
                                                            src={c.photoUrl}
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

                                        <td>
                                            {c.present && (
                                                <button
                                                    className="btn btn-sm btn-primary btn-outline"
                                                    onClick={() => setSelectedControle(c)}
                                                >
                                                    <Printer size={16} />
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
                                src={zoomPhoto}
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
        </DashboardLayout>
    );
}