"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import confetti from "canvas-confetti";

import {
    getSeances,
    createSeance,
    deleteSeance,
    Seance,
    finishSeance,
    startSeance
} from "@/services/seance.service";

import { getMissions } from "@/services/mission.service";
import { getUsers } from "@/services/auth.service";

import { Trash2, Inbox, Search } from "lucide-react";

/**
 * FORM
 */
// type FormData = {
//     dateSeance: string;
//     heureDebut?: string;
//     heureFin?: string;
//     missionId: number;
//     chefEquipeId: number;
// };
type FormData = {
    missionId: number;
};

export default function SeancesPage() {

    const [seances, setSeances] = useState<Seance[]>([]);
    const [missions, setMissions] = useState<any[]>([]);
    const [superviseurs, setSuperviseurs] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);


    const [openModal, setOpenModal] = useState(false);

    const [filters, setFilters] = useState({
        search: "",
        status: "",
    });

    const [page, setPage] = useState(1);
    const limit = 20;

    const [form, setForm] = useState<FormData>({
        missionId: 0,
    });

    const profile =
        typeof window !== "undefined"
            ? localStorage.getItem("profile")
            : null;

    const canManage =
        profile === "CHEF_EQUIPE"

    const canAdmin = profile === "ADMIN" || "MANAGER"
    /**
     * FETCH DATA
     */
    const fetchData = async () => {
        try {
            setLoading(true);

            const [s, m, u] = await Promise.all([
                getSeances(),
                getMissions(),
                getUsers()
            ]);

            setSeances(s);
            setMissions(m);

            const sup = u.filter(
                (x: any) => x.profile?.name === "SUPERVISEUR"
            );

            setSuperviseurs(sup);

        } catch (e) {
            toast.error("Erreur chargement");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    /**
     * FILTER
     */
    const filtered = seances.filter((s) => {

        const search =
            filters.search === "" ||
            s.mission?.zone?.toLowerCase().includes(filters.search.toLowerCase()) ||
            s.mission?.numero?.toLowerCase().includes(filters.search.toLowerCase());

        const status =
            filters.status === "" ||
            (filters.status === "ACTIVE" && s.isActive) ||
            (filters.status === "INACTIVE" && !s.isActive);

        return search && status;
    });

    const totalPages = Math.ceil(filtered.length / limit);

    const data = filtered.slice(
        (page - 1) * limit,
        page * limit
    );

    useEffect(() => {
        setPage(1);
    }, [filters]);

    /**
     * CREATE
     */
    const handleCreate = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            if (!user?.id) {
                toast.error("Utilisateur non connecté");
                return;
            }

            // ✅ vérifier mission sélectionnée
            const mission = missions.find(
                (m) => m.id === form.missionId
            );

            if (!mission) {
                toast.error("Mission introuvable");
                return;
            }

            // ✅ refuser si mission inactive
            if (!mission.isActive) {
                toast.error("Impossible de créer une séance : mission inactive");
                return;
            }

            // ✅ refuser si une séance existe déjà dans la base
            if (seances.length > 0) {
                toast.error("Une séance existe déjà. Impossible d'en créer une autre.");
                return;
            }

            // ✅ création séance
            await createSeance({
                missionId: form.missionId,
                chefEquipeId: user.id,
            });

            toast.success("Séance créée");

            setOpenModal(false);

            setForm({
                missionId: 0,
            });

            fetchData();

        } catch (e) {
            console.error(e);
            toast.error("Erreur création");
        }
    };

    /**
     * DELETE
     */
    const handleDelete = async (id: string) => {
        const res = await Swal.fire({
            title: "Supprimer séance ?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Oui",
            cancelButtonText: "Non",
        });

        if (!res.isConfirmed) return;

        try {
            await deleteSeance(id);

            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ["#ef4444", "#f87171", "#fca5a5"],
            });

            toast.success("Séance supprimée");

            fetchData();

        } catch (error: any) {

            console.error("DELETE SEANCE ERROR:", error?.response || error);

            const data = error?.response?.data;

            const message =
                data?.message ||
                data?.error ||
                (typeof data === "string" ? data : null) ||
                error?.message ||
                "Suppression impossible";

            toast.error(message);
        }
    };

    return (
        <DashboardLayout>

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Séances</h1>
                        <p className="text-sm opacity-70">
                            Gestion des séances opérationnelles
                        </p>
                    </div>
                    {canManage && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setOpenModal(true)}
                        >
                            + Nouvelle séance
                        </button>
                    )}
                </div>

                {/* FILTERS */}
                <div className="card bg-base-200 shadow-sm">
                    <div className="card-body">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                            <label className="input input-bordered flex items-center gap-2">
                                <Search size={16} />
                                <input
                                    className="grow"
                                    placeholder="Rechercher séance..."
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            search: e.target.value
                                        })
                                    }
                                />
                            </label>

                            <select
                                className="select select-bordered"
                                value={filters.status}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        status: e.target.value
                                    })
                                }
                            >
                                <option value="">Tous statuts</option>
                                <option value="ACTIVE">Actives</option>
                                <option value="INACTIVE">En attente</option>
                            </select>

                        </div>

                    </div>
                </div>

                {/* TABLE */}
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body p-0">

                        <table className="table w-full">

                            <thead className="bg-base-200">
                                <tr>
                                    <th>ID</th>
                                    <th>Mission</th>
                                    <th>Chef</th>
                                    <th>Date</th>
                                    <th>Fin</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {loading && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-10">
                                            <span className="loading loading-spinner"></span>
                                        </td>
                                    </tr>
                                )}

                                {!loading && data.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-2 opacity-70">
                                                <Inbox className="w-8 h-8" />
                                                <p>Aucune séance</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {!loading && data.map((s) => (
                                    <tr key={s.id}>
                                        <td>{s.id}</td>
                                        <td>{s.mission?.zone}</td>
                                        <td>{s.chefEquipe?.noms}</td>
                                        <td>
                                            {s.dateSeance
                                                ? new Date(s.dateSeance).toLocaleString("fr-FR")
                                                : "-"}
                                        </td>
                                        <td>
                                            {s.dateFin
                                                ? new Date(s.dateSeance).toLocaleString("fr-FR")
                                                : "-"}
                                        </td>


                                        <td>

                                            {s.dateFin ? (

                                                <span className="badge badge-neutral">
                                                    Terminée
                                                </span>

                                            ) : s.isActive ? (

                                                <span className="badge badge-success">
                                                    Active
                                                </span>

                                            ) : (

                                                <span className="badge badge-warning">
                                                    En attente
                                                </span>

                                            )}

                                        </td>

                                        <td className="flex gap-2">

                                            {!s.dateFin && !s.isActive && canManage && (

                                                <button
                                                    className="btn btn-xs btn-success"
                                                    onClick={async () => {
                                                        const res = await Swal.fire({
                                                            title: "Démarrer la séance ?",
                                                            icon: "question",
                                                            showCancelButton: true,
                                                        });

                                                        if (!res.isConfirmed) return;

                                                        try {
                                                            await startSeance(s.id);

                                                            confetti({
                                                                particleCount: 120,
                                                                spread: 90,
                                                                origin: { y: 0.6 },
                                                            });

                                                            toast.success("Séance démarrée");
                                                            fetchData();

                                                        } catch {
                                                            toast.error("Erreur démarrage");
                                                        }
                                                    }}
                                                >
                                                    Démarrer
                                                </button>

                                            )}

                                            {!s.dateFin && s.isActive && canManage && (
                                                <button
                                                    className="btn btn-xs btn-warning"
                                                    onClick={async () => {
                                                        const res = await Swal.fire({
                                                            title: "Terminer la séance ?",
                                                            icon: "warning",
                                                            showCancelButton: true,
                                                        });

                                                        if (!res.isConfirmed) return;

                                                        try {
                                                            await finishSeance(s.id);

                                                            confetti({
                                                                particleCount: 80,
                                                                spread: 70,
                                                                origin: { y: 0.7 },
                                                            });

                                                            toast.success("Séance terminée");
                                                            fetchData();

                                                        } catch {
                                                            toast.error("Erreur fermeture");
                                                        }
                                                    }}
                                                >
                                                    Terminer
                                                </button>
                                            )}

                                            {/* SUPPRESSION uniquement si pas terminée */}
                                            {!s.dateFin && canAdmin && (
                                                <button
                                                    className="btn btn-xs btn-error btn-outline"
                                                    onClick={() => handleDelete(s.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}

                                        </td>
                                    </tr>
                                ))}

                            </tbody>

                        </table>

                        {/* PAGINATION ALIGNÉE */}
                        <div className="flex justify-between items-center px-4 py-3 border-t">

                            <p className="text-sm opacity-70">
                                Page {page} / {totalPages || 1} — Total {filtered.length}
                            </p>

                            <div className="join">
                                <button
                                    className="btn btn-sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    «
                                </button>

                                <button
                                    className="btn btn-sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    »
                                </button>
                            </div>

                        </div>

                    </div>
                </div>

            </div>

            {/* MODAL */}
            {openModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

                    <div className="bg-base-100 p-6 rounded-xl w-full max-w-md">

                        <h2 className="text-xl font-bold mb-4">
                            Nouvelle séance
                        </h2>

                        {/* MISSION ONLY */}
                        <select
                            className="select select-bordered w-full mb-4"
                            onChange={(e) =>
                                setForm({
                                    missionId: Number(e.target.value)
                                })
                            }
                        >
                            <option value="">Mission</option>
                            {missions.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.zone}
                                </option>
                            ))}
                        </select>

                        <div className="flex justify-end gap-2">

                            <button className="btn" onClick={() => setOpenModal(false)}>
                                Annuler
                            </button>

                            <button className="btn btn-primary" onClick={handleCreate}>
                                Créer
                            </button>

                        </div>

                    </div>

                </div>
            )}


        </DashboardLayout>
    );
}