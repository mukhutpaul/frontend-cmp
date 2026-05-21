"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useState } from "react";
import { Search, Printer, ShieldCheck, User } from "lucide-react";
import { toast } from "react-toastify";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import QRCode from "qrcode";

import { api } from "@/lib/axios";
import { getPolicierByMatricule } from "@/services/policier.service";
import {
    Controle,
    searchControleByIdentite,
    searchControleByMatricule,
} from "@/services/controle.service";

/* ========================= TYPES ========================= */

type Policier = {
    id: string;
    matricule: string;
    nom: string;
    postnom: string;
    prenom: string;
    sexe: string;
    telephone?: string;
    grade?: string;
    unite?: string;
    uniteMere?: string;
    dateNaissance: string;
};

/* ========================= PAGE ========================= */

export default function RecherchePage() {

    /* ========================= STATES ========================= */

    // controle matricule
    const [controleMatricule, setControleMatricule] = useState("");
    const [controleLoading, setControleLoading] = useState(false);
    const [controle, setControle] = useState<Controle | null>(null);

    // policier matricule
    const [policierMatricule, setPolicierMatricule] = useState("");
    const [policierLoading, setPolicierLoading] = useState(false);
    const [policier, setPolicier] = useState<Policier | null>(null);

    // panneau controle identité
    const [controleNom, setControleNom] = useState("");
    const [controlePostnom, setControlePostnom] = useState("");
    const [controlePrenom, setControlePrenom] = useState("");
    const [controleDateNaissance, setControleDateNaissance] = useState("");

    const [controleIdentiteLoading, setControleIdentiteLoading] = useState(false);
    const [controleError, setControleError] = useState<string | null>(null);

    // panneau policier identité
    const [identiteNom, setIdentiteNom] = useState("");
    const [identitePostnom, setIdentitePostnom] = useState("");
    const [identitePrenom, setIdentitePrenom] = useState("");
    const [identiteDateNaissance, setIdentiteDateNaissance] = useState("");

    const [identiteLoading, setIdentiteLoading] = useState(false);
    const [identite, setIdentite] = useState<Policier | null>(null);

    /* ========================= RESET ========================= */

    const buildQRData = (c: Controle) => {

        const p = c.policier;

        return JSON.stringify({

            matricule: c.matricule,

            nom: p?.nom || "",

            postnom: p?.postnom || "",
            grade: c?.grade || "",
            unite: c?.unite || "",

            genre: p?.sexe || "",

            groupe: p?.groupeSanguin || "",

            dateNaissance: p?.dateNaissance || "",

            lieuNaissance: p?.lieuNaissance || "",

            // ✅ username chef équipe
            equipe: c?.chefEquipe?.username || "",

            // ✅ zone mission
            province: c?.seance?.mission?.zone || ""
        });
    };

    const resetAll = () => {

        setControleMatricule("");
        setControle(null);

        setPolicierMatricule("");
        setPolicier(null);

        setControleNom("");
        setControlePostnom("");
        setControlePrenom("");
        setControleDateNaissance("");

        setIdentiteNom("");
        setIdentitePostnom("");
        setIdentitePrenom("");
        setIdentiteDateNaissance("");

        setIdentite(null);

        setControleError(null);
    };

    /* ========================= FORMAT DATE ========================= */

    const formatDateInput = (value: string) => {

        let cleaned = value.replace(/\D/g, "");

        if (cleaned.length > 4) {
            cleaned =
                cleaned.slice(0, 4) +
                "-" +
                cleaned.slice(4);
        }

        if (cleaned.length > 7) {
            cleaned =
                cleaned.slice(0, 7) +
                "-" +
                cleaned.slice(7);
        }

        return cleaned.slice(0, 10);
    };

    const formatToISO = (value: string) => {

        if (!value) return undefined;

        const regex = /^\d{4}-\d{2}-\d{2}$/;

        if (!regex.test(value)) {
            return undefined;
        }

        return value;
    };

    /* ========================= SEARCH CONTROLE IDENTITE ========================= */

    const handleSearchIdentiteControle = async () => {
        try {
            setControleIdentiteLoading(true);
            setControleError(null);

            const formattedDate = formatToISO(controleDateNaissance);

            const res = await searchControleByIdentite({
                nom: controleNom.trim() || undefined,
                postnom: controlePostnom.trim() || undefined,
                prenom: controlePrenom.trim() || undefined,
                dateNaissance: formattedDate,
            });

            console.log("CONTROLE IDENTITE RESPONSE :", res);

            // ================= CAS TABLEAU =================
            if (Array.isArray(res)) {

                if (res.length > 0) {

                    setControle(res[0]);
                    return;
                }

                setControle(null);
                setControleError("Aucun contrôle trouvé");
                return;
            }

            // ================= CAS OBJET UNIQUE =================
            if (res && typeof res === "object") {

                setControle(res);
                return;
            }

            // ================= AUCUN RESULTAT =================
            setControle(null);
            setControleError("Aucun contrôle trouvé");

        } catch (err) {

            console.error("ERREUR CONTROLE IDENTITE :", err);

            setControle(null);

            setControleError(
                "Erreur lors de la recherche"
            );

        } finally {

            setControleIdentiteLoading(false);
        }
    };

    /* ========================= SEARCH CONTROLE ========================= */
    /* ========================= SEARCH CONTROLE ========================= */

    const handleSearchControle = async () => {

        if (!controleMatricule.trim()) {

            toast.warning("Entrez un matricule");
            return;
        }

        try {

            setControleLoading(true);

            const data = await searchControleByMatricule(
                controleMatricule.trim()
            );

            if (!data) {

                toast.error("Contrôle introuvable");
                setControle(null);
                return;
            }

            setControle(data);

        } catch (error) {

            console.error(error);

            setControle(null);

            toast.error("Erreur recherche contrôle");

        } finally {

            setControleLoading(false);
        }
    };

    /* ========================= SEARCH IDENTITE ========================= */

    const handleSearchIdentite = async () => {
        try {
            setIdentiteLoading(true);

            const formattedDate = formatToISO(identiteDateNaissance);

            const res = await api.get("/policiers/identite", {
                params: {
                    nom: identiteNom.trim() || undefined,
                    postnom: identitePostnom.trim() || undefined,
                    prenom: identitePrenom.trim() || undefined,
                    dateNaissance: formattedDate || undefined,
                },
            });

            setIdentite(res.data);
        } catch (error: any) {
            console.log("IDENTITE ERROR:", error?.response?.data || error);

            setIdentite(null);

            toast.error(
                error?.response?.data?.message || "Policier introuvable"
            );
        } finally {
            setIdentiteLoading(false);
        }
    };

    /* ========================= SEARCH POLICIER ========================= */

    const handleSearchPolicier = async () => {

        if (!policierMatricule.trim()) {

            toast.warning("Entrez un matricule");

            return;
        }

        try {

            setPolicierLoading(true);

            const data =
                await getPolicierByMatricule(
                    policierMatricule
                );

            setPolicier(data);

        } catch (error) {

            console.error(error);

            setPolicier(null);

            toast.error(
                "Policier introuvable"
            );

        } finally {

            setPolicierLoading(false);
        }
    };

    /* ========================= PRINT PDF ========================= */

    const handlePrintPDF = async () => {

        if (!controle) return;

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [74, 105],
        });

        const p = controle.policier;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);

        doc.text(
            "QR CODE DU CONTROLE",
            37,
            10,
            {
                align: "center",
            }
        );

        doc.setFontSize(7);
        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.text(
            "Police Nationale Congolaise",
            37,
            15,
            {
                align: "center",
            }
        );

        doc.line(5, 18, 69, 18);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(8);

        doc.text(
            "INFORMATIONS",
            5,
            25
        );

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.text(
            `Nom : ${p?.nom ?? "-"}`,
            5,
            32
        );

        doc.text(
            `Postnom : ${p?.postnom ?? "-"}`,
            5,
            37
        );

        doc.text(
            `Prenom : ${p?.prenom ?? "-"}`,
            5,
            42
        );

        doc.text(
            `Matricule : ${controle.matricule ?? "-"}`,
            5,
            50
        );

        doc.text(
            `Grade : ${controle.grade ?? "-"}`,
            5,
            55
        );

        doc.text(
            `Unité : ${controle.unite ?? "-"}`,
            5,
            60
        );

        const qrData =
            await QRCode.toDataURL(
                JSON.stringify(controle)
            );

        doc.addImage(
            qrData,
            "PNG",
            20,
            65,
            35,
            35
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(10);

        doc.setTextColor(
            controle.present ? 0 : 255,
            controle.present ? 140 : 0,
            0
        );

        doc.text(
            controle.present
                ? "PRESENT"
                : "ABSENT",
            37,
            103,
            {
                align: "center",
            }
        );

        doc.setTextColor(0, 0, 0);

        const pdfBlobUrl =
            doc.output("bloburl");

        const printWindow =
            window.open(pdfBlobUrl);

        if (printWindow) {

            printWindow.onload = () => {

                printWindow.focus();

                printWindow.print();
            };
        }
    };

    /* ========================= UI ========================= */

    return (
        <DashboardLayout>

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div className="flex justify-between items-center">

                    <div>
                        <h1 className="text-3xl font-bold">
                            Centre de Recherche
                        </h1>

                        <p className="text-sm opacity-70">
                            Recherche des contrôles et policiers
                        </p>
                    </div>

                    <button
                        className="btn btn-secondary"
                        onClick={resetAll}
                    >
                        Réinitialiser tout
                    </button>

                </div>

                {/* TOP PANELS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* CONTROLE */}
                    <div className="card bg-base-100 shadow-xl border">

                        <div className="card-body space-y-4">

                            <div className="flex items-center gap-2">
                                <ShieldCheck className="text-primary" />

                                <h2 className="card-title">
                                    Recherche Contrôle
                                </h2>
                            </div>

                            <div className="flex gap-2">

                                <input
                                    type="text"
                                    placeholder="Matricule contrôle..."
                                    className="input input-bordered w-full"
                                    value={controleMatricule}
                                    onChange={(e) =>
                                        setControleMatricule(
                                            e.target.value
                                        )
                                    }
                                />

                                <button
                                    className="btn btn-primary"
                                    onClick={handleSearchControle}
                                    disabled={controleLoading}
                                >
                                    {controleLoading ? (
                                        <span className="loading loading-spinner loading-sm"></span>
                                    ) : (
                                        <Search size={18} />
                                    )}
                                </button>

                            </div>

                            {controle && (

                                <div className="bg-base-200 rounded-xl p-4 space-y-4">

                                    <div className="flex justify-between items-start gap-4">

                                        <div className="space-y-1 text-sm">

                                            <h3 className="text-lg font-bold">
                                                {
                                                    controle
                                                        .policier
                                                        ?.nom
                                                }{" "}
                                                {
                                                    controle
                                                        .policier
                                                        ?.postnom
                                                }
                                            </h3>

                                            <p>
                                                <b>Prénom :</b>{" "}
                                                {
                                                    controle
                                                        .policier
                                                        ?.prenom
                                                }
                                            </p>

                                            <p>
                                                <b>Matricule :</b>{" "}
                                                {
                                                    controle.matricule
                                                }
                                            </p>

                                            <p>
                                                <b>Grade :</b>{" "}
                                                {
                                                    controle.grade
                                                }
                                            </p>

                                            <p>
                                                <b>Unité :</b>{" "}
                                                {
                                                    controle.unite
                                                }
                                            </p>

                                        </div>

                                        <div className="bg-white p-2 rounded-xl border shadow flex items-center justify-center w-[170px] h-[170px]">

                                            {controle.present ? (

                                                <QRCodeCanvas
                                                    value={buildQRData(controle)}
                                                    size={150}
                                                    level="H"
                                                    includeMargin={true}
                                                />
                                            ) : (

                                                <div className="flex items-center justify-center w-full h-full text-center text-sm font-semibold text-gray-500 border-2 border-dashed rounded-lg">
                                                    Pas QR Code
                                                </div>
                                            )}

                                        </div>

                                    </div>

                                    <button
                                        className="btn btn-primary w-full"
                                        onClick={handlePrintPDF}
                                    >
                                        <Printer size={18} />
                                        Imprimer QR Code PDF
                                    </button>

                                </div>
                            )}

                        </div>

                    </div>

                    {/* POLICIER */}
                    <div className="card bg-base-100 shadow-xl border">

                        <div className="card-body space-y-4">

                            <div className="flex items-center gap-2">
                                <User className="text-secondary" />

                                <h2 className="card-title">
                                    Recherche Policier
                                </h2>
                            </div>

                            <div className="flex gap-2">

                                <input
                                    type="text"
                                    placeholder="Matricule policier..."
                                    className="input input-bordered w-full"
                                    value={policierMatricule}
                                    onChange={(e) =>
                                        setPolicierMatricule(
                                            e.target.value
                                        )
                                    }
                                />

                                <button
                                    className="btn btn-secondary"
                                    onClick={
                                        handleSearchPolicier
                                    }
                                    disabled={
                                        policierLoading
                                    }
                                >
                                    {policierLoading ? (
                                        <span className="loading loading-spinner loading-sm"></span>
                                    ) : (
                                        <Search size={18} />
                                    )}
                                </button>

                            </div>
                            {policier && (

                                <div className="bg-base-200 rounded-xl p-4">

                                    <div className="flex gap-4 items-start">

                                        {/* ================= INFOS ================= */}
                                        <div className="flex-1 space-y-2 text-sm">

                                            <h3 className="text-xl font-bold text-primary">
                                                {policier.nom} {policier.postnom}
                                            </h3>

                                            <p>
                                                <b>Prénom :</b> {policier.prenom}
                                            </p>

                                            <p>
                                                <b>Matricule :</b> {policier.matricule}
                                            </p>

                                            <p>
                                                <b>Sexe :</b> {policier.sexe}
                                            </p>

                                            <p>
                                                <b>Date Naissance :</b> {policier.dateNaissance}
                                            </p>

                                            <p>
                                                <b>Téléphone :</b> {policier.telephone || "-"}
                                            </p>

                                            <p>
                                                <b>Grade :</b>{" "}
                                                <span className="badge badge-primary">
                                                    {policier.grade || "-"}
                                                </span>
                                            </p>

                                            <p>
                                                <b>Unité :</b>{" "}
                                                <span className="badge badge-secondary">
                                                    {policier.unite || "-"}
                                                </span>
                                            </p>

                                        </div>

                                        {/* ================= PHOTO FRAME FUTURE ================= */}
                                        <div className="w-32 h-32 rounded-xl border-2 border-dashed border-primary/50 bg-white shadow flex items-center justify-center">

                                            <span className="text-xs text-gray-400 text-center">
                                                Photo<br />Policier
                                            </span>

                                        </div>

                                    </div>

                                </div>
                            )}

                        </div>

                    </div>

                </div>

                {/* BOTTOM PANELS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* CONTROLE IDENTITE */}
                    <div className="card bg-base-100 shadow-xl border">

                        <div className="card-body space-y-4">

                            <h2 className="card-title">
                                Policier - Contrôle
                            </h2>

                            <div className="grid grid-cols-2 gap-2">

                                <input
                                    className="input input-bordered"
                                    placeholder="Nom"
                                    value={controleNom}
                                    onChange={(e) =>
                                        setControleNom(
                                            e.target.value
                                        )
                                    }
                                />

                                <input
                                    className="input input-bordered"
                                    placeholder="Postnom"
                                    value={controlePostnom}
                                    onChange={(e) =>
                                        setControlePostnom(
                                            e.target.value
                                        )
                                    }
                                />

                                <input
                                    className="input input-bordered"
                                    placeholder="Prénom"
                                    value={controlePrenom}
                                    onChange={(e) =>
                                        setControlePrenom(
                                            e.target.value
                                        )
                                    }
                                />

                                <input
                                    type="text"
                                    placeholder="YYYY-MM-DD"
                                    className="input input-bordered"
                                    value={
                                        controleDateNaissance
                                    }
                                    onChange={(e) =>
                                        setControleDateNaissance(
                                            formatDateInput(
                                                e.target.value
                                            )
                                        )
                                    }
                                />

                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={
                                    handleSearchIdentiteControle
                                }
                                disabled={
                                    controleIdentiteLoading
                                }
                            >
                                {controleIdentiteLoading
                                    ? "Recherche..."
                                    : "Rechercher"}
                            </button>

                            {controleError && (

                                <div className="alert alert-error">
                                    {controleError}
                                </div>
                            )}

                        </div>

                    </div>

                    {/* POLICIER IDENTITE */}
                    <div className="card bg-base-100 shadow-xl border">

                        <div className="card-body space-y-4">

                            <h2 className="card-title">
                                Policier - Identité
                            </h2>

                            <div className="grid grid-cols-2 gap-2">

                                <input
                                    className="input input-bordered"
                                    placeholder="Nom"
                                    value={identiteNom}
                                    onChange={(e) =>
                                        setIdentiteNom(
                                            e.target.value
                                        )
                                    }
                                />

                                <input
                                    className="input input-bordered"
                                    placeholder="Postnom"
                                    value={identitePostnom}
                                    onChange={(e) =>
                                        setIdentitePostnom(
                                            e.target.value
                                        )
                                    }
                                />

                                <input
                                    className="input input-bordered"
                                    placeholder="Prénom"
                                    value={identitePrenom}
                                    onChange={(e) =>
                                        setIdentitePrenom(
                                            e.target.value
                                        )
                                    }
                                />

                                <input
                                    type="text"
                                    placeholder="YYYY-MM-DD"
                                    className="input input-bordered"
                                    value={
                                        identiteDateNaissance
                                    }
                                    onChange={(e) =>
                                        setIdentiteDateNaissance(
                                            formatDateInput(
                                                e.target.value
                                            )
                                        )
                                    }
                                />

                            </div>

                            <button
                                className="btn btn-secondary"
                                onClick={
                                    handleSearchIdentite
                                }
                                disabled={
                                    identiteLoading
                                }
                            >
                                {identiteLoading
                                    ? "Recherche..."
                                    : "Rechercher"}
                            </button>

                            {identite && (
                                <div className="bg-base-200 rounded-xl p-4">

                                    <div className="flex gap-4 items-start">

                                        {/* ================= INFOS ================= */}
                                        {/* ================= INFOS ================= */}
                                        <div className="flex-1 space-y-2 text-sm">

                                            <h3 className="text-xl font-bold text-primary">
                                                {identite.nom} {identite.postnom}
                                            </h3>

                                            <p>
                                                <b>Prénom :</b> {identite.prenom}
                                            </p>

                                            <p>
                                                <b>Matricule :</b> {identite.matricule}
                                            </p>

                                            <p>
                                                <b>Sexe :</b> {identite.sexe}
                                            </p>

                                            <p>
                                                <b>Date Naissance :</b> {identite.dateNaissance}
                                            </p>

                                            <p>
                                                <b>Téléphone :</b> {identite.telephone || "-"}
                                            </p>

                                            <p>
                                                <b>Grade :</b>{" "}
                                                <span className="badge badge-primary">
                                                    {identite.grade || "-"}
                                                </span>
                                            </p>

                                            <p>
                                                <b>Unité :</b>{" "}
                                                <span className="badge badge-secondary">
                                                    {identite.unite || "-"}
                                                </span>
                                            </p>

                                        </div>

                                        {/* ================= PHOTO FRAME ================= */}
                                        <div className="w-32 h-32 rounded-xl border-2 border-dashed border-primary/40 bg-white shadow flex items-center justify-center overflow-hidden relative">
                                            {/* 
                                            {identite.photoUrl ? (
                                                <img
                                                    src={identite.photoUrl}
                                                    alt="Policier"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <User size={28} className="opacity-70" />
                                                    <span className="text-[11px] mt-1 text-center">
                                                        Photo non disponible
                                                    </span>
                                                </div>
                                            )} */}

                                            {/* badge caméra */}
                                            <div className="absolute bottom-1 right-1 bg-primary text-white p-1 rounded-full shadow">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M9 2l1.5 2H13l1.5-2H17a2 2 0 0 1 2 2v2h-3l-1.5-2h-5L8 6H5V4a2 2 0 0 1 2-2h2z" />
                                                    <path d="M5 8h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8z" />
                                                    <circle cx="12" cy="14" r="3" />
                                                </svg>
                                            </div>

                                        </div>

                                    </div>

                                </div>
                            )}
                        </div>

                    </div>

                </div>

            </div>

        </DashboardLayout>
    );
}