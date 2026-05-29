"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Activity, RefreshCw, Database } from "lucide-react";

import { getSyncStats, runSyncBatch, SyncStats } from "@/services/synchro.service";
import { getSeances, Seance } from "@/services/seance.service";

import Swal from "sweetalert2";
import { getControles } from "@/services/controle.service";

export default function SyncPage() {

    const [data, setData] = useState<SyncStats | null>(null);
    const [seance, setSeance] = useState<Seance | null>(null);

    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const [progress, setProgress] = useState(0);
    const [showProgress, setShowProgress] = useState(false);

    /* ================= SEANCE ================= */

    const loadSeance = async () => {
        try {
            const seances = await getSeances();

            if (!seances?.length) {
                toast.error("Aucune séance trouvée");
                return;
            }

            setSeance(seances[0]);

        } catch (error) {
            console.error(error);
            toast.error("Erreur chargement séance");
        }
    };

    /* ================= STATS ================= */
    const handleSync = async () => {

        if (!seance) return;

        const seances = await getSeances();
        const controlesResponse = await getControles();

        const controles = controlesResponse.content ?? controlesResponse;

        const currentSeance = seances.find(s => s.id === seance.id);

        const isActive = currentSeance?.isActive === true;

        const filteredControles = isActive
            ? controles.filter(c => c.present === true)
            : controles;

        const data = {
            serverAddress: "http://10.159.151.164:8090",
            deviceId: localStorage.getItem("username") || "",
            seanceId: seance.id,

            sessions: [],
            seances: seances ?? [],
            controles: filteredControles ?? [],
            documents: [],
        };

        const formData = new FormData();

        formData.append(
            "data",
            new Blob([JSON.stringify(data)], {
                type: "application/json"
            })
        );

        await runSyncBatch(data); // ❌ encore faux
    };

    const fetchStats = async (currentSeance: Seance) => {
        try {
            setLoading(true);

            const res = await getSyncStats(
                currentSeance.id,
                currentSeance.isActive
            );

            setData(res);

        } catch (error) {
            console.error(error);
            toast.error("Erreur chargement sync");

        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        loadSeance();

        const interval = setInterval(() => {
            loadSeance();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!seance) return;
        fetchStats(seance);
    }, [seance]);

    /* ================= SYNC ANIMATION ================= */

    const runProgressAnimation = () => {
        setShowProgress(true);
        setProgress(0);

        let value = 0;

        const interval = setInterval(() => {

            value += Math.floor(Math.random() * 12) + 5; // progression réaliste

            if (value >= 100) {
                value = 100;
                clearInterval(interval);

                setTimeout(async () => {

                    setShowProgress(false);

                    await fetchStats(seance!);

                    Swal.fire({
                        icon: "success",
                        title: "Synchronisation terminée",
                        text: "Toutes les données ont été mises à jour avec succès",
                        confirmButtonColor: "#2563eb"
                    });

                }, 500);
            }

            setProgress(value);

        }, 250);
    };


    return (
        <DashboardLayout>

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Database size={22} />
                        Synchronisation des données
                    </h1>

                    <p className="text-sm opacity-70">
                        Séance : {seance?.isActive ? "Active" : "Fermée"}
                    </p>
                </div>

                {/* BUTTON SYNC */}
                <button
                    onClick={handleSync}

                    disabled={syncing}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <RefreshCw
                        size={18}
                        className={syncing ? "animate-spin" : ""}
                    />
                    Synchroniser
                </button>

                {/* PROGRESS BAR (UNIQUEMENT PENDANT SYNC) */}
                {showProgress && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Synchronisation en cours</span>
                            <span className="font-bold">{progress}%</span>
                        </div>

                        <progress
                            className="progress progress-primary w-full"
                            value={progress}
                            max="100"
                        />
                    </div>
                )}

                {/* DATA */}
                {!loading && data && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">

                        <StatCard label="Sessions" value={data.sessions} />
                        <StatCard label="Séances" value={data.seances} />
                        <StatCard label="Présences" value={data.controlesPresence} />
                        <StatCard label="Justifiés" value={data.controlesJustifies} />
                        <StatCard label="Absences" value={data.controlesAbsence} />
                        <StatCard label="Documents" value={data.documents} />
                        <StatCard label="Fichiers" value={data.fichiers} />
                        <StatCard label="Total" value={data.total} highlight />

                    </div>
                )}

            </div>

        </DashboardLayout>
    );
}

/* ================= STAT CARD ================= */

function StatCard({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value: number;
    highlight?: boolean;
}) {

    return (
        <div className={`
            stat
            bg-base-100
            border
            ${highlight ? "border-primary" : "border-base-300"}
            rounded-xl
        `}>

            <div className="stat-title text-xs">{label}</div>

            <div className={`
                stat-value flex items-center gap-2
                ${highlight ? "text-primary" : ""}
            `}>
                <Activity size={16} />
                {value}
            </div>

        </div>
    );
}