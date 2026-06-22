"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Select from "react-select";
import { deleteMissionUnite, getUnitesByMission } from "@/services/mission.service";

import {
    getMissions,
    createMission,
    updateMission,
    deleteMission,
    startMission,
    closeMission,
    Mission
} from "@/services/mission.service";

import { Pencil, Trash2, Play, Square, X, Inbox, Search, Eye } from "lucide-react";
import { getUsers } from "@/services/auth.service";

type FormData = {
    zone: string;
    numero: string;
    chargeMission: {
        id: number;
    };
};

export default function MissionsPage() {

    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(false);

    const [openModal, setOpenModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [openViewUnits, setOpenViewUnits] = useState(false);

    const [selectedMission, setSelectedMission] = useState<any>(null);

    const [unitesMission, setUnitesMission] = useState<any[]>([]);

    const [loadingUnites, setLoadingUnites] = useState(false);
    const [filters, setFilters] = useState({
        search: "",
        status: "",
    });
    const [superviseurs, setSuperviseurs] = useState<any[]>([]);

    const [form, setForm] = useState<FormData>({
        zone: "",
        numero: "",
        chargeMission: {
            id: 0,
        },
    });

    const [editModal, setEditModal] = useState(false);
    const [editingMission, setEditingMission] = useState<Mission | null>(null);

    const [editForm, setEditForm] = useState({
        zone: "",
        numero: "",
        chargeMission: {
            id: 0,
        },
    });

    const openEditMission = (mission: Mission) => {
        setEditingMission(mission);

        setEditForm({
            zone: mission.zone,
            numero: mission.numero,
            chargeMission: {
                id: (mission as any).chargeMission?.id || 0,
            },
        });

        setEditModal(true);
    };

    const [page, setPage] = useState(1);
    const limit = 20;

    const filteredMissions = missions.filter((m) => {

        const matchSearch =
            filters.search === "" ||
            m.zone.toLowerCase().includes(filters.search.toLowerCase()) ||
            m.numero.toLowerCase().includes(filters.search.toLowerCase());

        const matchStatus =
            filters.status === "" ||
            (filters.status === "ACTIVE" && m.isActive) ||
            (filters.status === "INACTIVE" && !m.isActive);

        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filteredMissions.length / limit);

    const paginatedMissions = filteredMissions.slice(
        (page - 1) * limit,
        page * limit
    );
    useEffect(() => {
        setPage(1);
    }, [filters]);

    const fetchMissions = async () => {
        try {
            setLoading(true);

            const data = await getMissions();

            setMissions(data);

        } catch (error) {

            console.error("Erreur fetch missions:", error);
            toast.error("Erreur chargement missions");

        } finally {

            setLoading(false);
        }
    };

    const handleUpdateMission = async () => {
        if (!editingMission) return;

        try {
            await updateMission(editingMission.id, {
                zone: editForm.zone,
                numero: editForm.numero,
                isActive: false,
                chargeMission: {
                    id: editForm.chargeMission.id,
                },
            });

            toast.success("Mission modifiée");

            setEditModal(false);
            setEditingMission(null);

            fetchMissions();

        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Erreur modification");
        }
    };

    const profile =
        typeof window !== "undefined"
            ? localStorage.getItem("profile")
            : null;

    const canAdmin =
        profile === "ADMIN" ||
        profile === "MANAGER";
    const fetchUnitesMission = async (missionId: number) => {

        setLoadingUnites(true);
        setUnitesMission([]);

        try {

            const data = await getUnitesByMission(missionId);

            console.log("UNITES MISSION:", data);

            setUnitesMission(data);

        } catch (error) {

            console.error(error);

            toast.error("Erreur chargement unités");

        } finally {

            setLoadingUnites(false);
        }
    };

    const generateMissionNumber = (zone: string) => {
        if (!zone) return "";

        const prefix = zone
            .trim()
            .toUpperCase()
            .substring(0, 2);

        const unique = Date.now().toString().slice(-5);

        return `${prefix}-${unique}`;
    };

    const fetchSuperviseurs = async () => {
        try {
            const data = await getUsers();

            const filtered = data.filter(
                (u: any) => u.profile?.name === "CHARGE_MISSION"
            );

            setSuperviseurs(filtered);

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchMissions();
        fetchSuperviseurs();
    }, []);

    const resetForm = () => {
        setForm({
            zone: "",
            numero: "",
            chargeMission: {
                id: 0,
            },
        });
    };

    const handleCreate = async () => {
        try {
            await createMission(form);

            toast.success("Mission créée");

            resetForm(); // <- nettoyage

            setOpenModal(false);

            await fetchMissions();

        } catch {
            toast.error("Erreur création");
        }
    };

    /**
     * CREATE
     */
    // const handleCreate = async () => {
    //     try {
    //         await createMission(form);
    //         toast.success("Mission créée");
    //         setOpenModal(false);
    //         fetchMissions();
    //     } catch {
    //         toast.error("Erreur création");
    //     }
    // };

    /**
     * START MISSION
     */
    const handleStart = async (id: number) => {
        try {
            await startMission(id);
            toast.success("Mission activée");
            fetchMissions();
        } catch (error: any) {
            console.error(error);
            toast.error(
                error.response?.data?.message || "Erreur activation"
            );
        }
    };

    const handleDeleteUnite = async (id: number) => {
        const res = await Swal.fire({
            title: "Supprimer cette unité ?",
            text: "Cette action est irréversible",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Oui",
            cancelButtonText: "Non",
        });

        if (!res.isConfirmed) return;

        try {
            await deleteMissionUnite(id);

            toast.success("Unité supprimée");

            // refresh liste après suppression
            if (selectedMission) {
                await fetchUnitesMission(selectedMission.id);
            }

        } catch (error: any) {
            console.error(error);
            toast.error(
                error?.response?.data?.message || "Erreur suppression unité"
            );
        }
    };

    /**
     * CLOSE MISSION
     */
    const handleClose = async (id: number) => {
        try {
            await closeMission(id);
            toast.success("Mission clôturée");
            fetchMissions();
        } catch (error: any) {
            console.error(error);
            toast.error(
                error.response?.data?.message || "Erreur activation"
            );
        }
    };

    /**
     * DELETE
     */
    const handleDelete = async (id: number) => {
        const res = await Swal.fire({
            title: "Supprimer la mission ?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Oui",
            cancelButtonText: "Non",
        });

        if (!res.isConfirmed) return;

        try {
            await deleteMission(id);

            toast.success("Mission supprimée");

            await fetchMissions();

        } catch (error: any) {
            console.error("DELETE ERROR FULL:", error);

            const data = error?.response?.data;

            const message =
                typeof data === "string"
                    ? data
                    : data?.message
                        ? data.message
                        : error?.message || "Erreur suppression";

            if (error?.response?.status === 403) {
                toast.error("Accès refusé (ADMIN requis)");
            } else if (error?.response?.status === 401) {
                toast.error("Session expirée, reconnecte-toi");
            } else {
                toast.error(message);
            }
        }
    };
    return (
        <DashboardLayout>

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Missions</h1>
                        <p className="text-sm opacity-70">
                            Gestion nationale des missions
                        </p>
                    </div>
                    {canAdmin && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setOpenModal(true)}
                        >
                            + Nouvelle mission
                        </button>
                    )}
                </div>

                {/* 🔎 FILTERS */}
                <div className="card bg-base-200 shadow-sm">

                    <div className="card-body">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                            {/* SEARCH GLOBAL */}
                            <label className="input input-bordered flex items-center gap-2">

                                <Search size={16} />

                                <input
                                    type="text"
                                    className="grow"
                                    placeholder="Rechercher mission (zone, numéro...)"
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            search: e.target.value,
                                        })
                                    }
                                />

                            </label>

                            {/* FILTRE STATUS */}
                            <select
                                className="select select-bordered w-full"
                                value={filters.status}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        status: e.target.value,
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
                *{/* TABLE + PAGINATION */}
                <div className="card bg-base-100 shadow-md">

                    <div className="card-body p-0">

                        <div className="overflow-x-auto">

                            <table className="table w-full">

                                <thead className="bg-base-200">
                                    <tr>
                                        <th>ID</th>
                                        <th>Zone</th>
                                        <th>Numéro</th>
                                        <th>Responsable</th>
                                        <th>Statut</th>
                                        <th>Debut</th>
                                        <th>Fin</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {loading && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-10">
                                                <span className="loading loading-spinner loading-md"></span>
                                            </td>
                                        </tr>
                                    )}

                                    {!loading && filteredMissions.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12">
                                                <div className="flex flex-col items-center gap-2 opacity-70">
                                                    <Inbox className="w-8 h-8" />
                                                    <p className="font-semibold">Aucune mission trouvée</p>
                                                    <p className="text-sm">Créez une nouvelle mission pour commencer</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {!loading && paginatedMissions.map((m) => (
                                        <tr key={m.id} className="hover">
                                            <td>{m.id}</td>
                                            <td>{m.zone}</td>
                                            <td>{m.numero}</td>
                                            <td>{m.chargeMission?.username}</td>
                                            <td>
                                                {m.dateFin ? (
                                                    <span className="badge badge-neutral">
                                                        Terminée
                                                    </span>
                                                ) : m.isActive ? (
                                                    <span className="badge badge-success">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-warning">
                                                        En attente
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                {m.dateDebut
                                                    ? new Date(m.dateDebut).toLocaleString("fr-FR", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : "-"}
                                            </td>
                                            <td>
                                                {m.dateFin
                                                    ? new Date(m.dateFin).toLocaleString("fr-FR", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : "-"}
                                            </td>

                                            <td className="flex gap-2">

                                                {/* EN ATTENTE */}
                                                {!m.dateDebut && !m.dateFin && canAdmin && (
                                                    <button
                                                        className="btn btn-xs btn-success"
                                                        onClick={() => handleStart(m.id)}
                                                    >
                                                        Activer
                                                    </button>
                                                )}

                                                {/* ACTIVE */}
                                                {m.dateDebut && !m.dateFin && canAdmin && (
                                                    <button
                                                        className="btn btn-xs btn-warning"
                                                        onClick={() => handleClose(m.id)}
                                                    >
                                                        Clôturer
                                                    </button>
                                                )}
                                                {canAdmin && (
                                                    <div className="tooltip" data-tip="Supprimer la mission">

                                                        <button
                                                            className="btn btn-xs btn-error btn-outline"
                                                            onClick={() => handleDelete(m.id)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>

                                                    </div>


                                                )}
                                                {canAdmin && (
                                                    <div className="tooltip" data-tip="Modifier mission">

                                                        <button
                                                            className="btn btn-xs btn-info btn-outline"
                                                            onClick={() => openEditMission(m)}
                                                        >
                                                            <Pencil size={14} />
                                                        </button>

                                                    </div>
                                                )}

                                                {canAdmin && (
                                                    <div className="tooltip" data-tip="Voir unités de la mission">

                                                        <button
                                                            className="btn btn-xs btn-info btn-outline"
                                                            onClick={async () => {
                                                                setSelectedMission(m);
                                                                await fetchUnitesMission(m.id);
                                                                setOpenViewUnits(true);
                                                            }}
                                                        >
                                                            <Eye size={14} />
                                                        </button>

                                                    </div>
                                                )}

                                            </td>
                                        </tr>
                                    ))}

                                </tbody>

                            </table>

                        </div>

                        {/* ✅ PAGINATION ALIGNÉE */}
                        <div className="flex justify-between items-center px-4 py-3 border-t border-base-300">

                            <p className="text-sm opacity-70">
                                Page {page} / {totalPages || 1} — Total : {filteredMissions.length}
                            </p>

                            <div className="join">

                                <button
                                    className="join-item btn btn-sm"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    « Précédent
                                </button>

                                <button
                                    className="join-item btn btn-sm"
                                    disabled={page === totalPages || totalPages === 0}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Suivant »
                                </button>

                            </div>

                        </div>

                    </div>
                </div>
            </div>

            {/* VIEW UNITES MISSION */}
            {openViewUnits && selectedMission && (

                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

                    <div className="bg-base-100 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-base-300">

                        {/* HEADER */}
                        <div className="bg-base-200 border-b border-base-300 px-5 py-4">

                            <div className="flex items-center justify-between">

                                <div>

                                    <h2 className="text-xl font-bold text-base-content">
                                        Unités affectées
                                    </h2>

                                    <p className="text-xs opacity-60 mt-1">
                                        Mission #{selectedMission.numero}
                                    </p>

                                </div>

                                <button
                                    className="btn btn-sm btn-circle btn-ghost"
                                    onClick={() => setOpenViewUnits(false)}
                                >
                                    ✕
                                </button>

                            </div>

                        </div>

                        {/* CONTENT */}
                        <div className="p-5 space-y-4">

                            {/* INFOS */}
                            <div className="grid grid-cols-2 gap-3">

                                <div className="bg-base-200 rounded-xl px-4 py-3 border border-base-300">

                                    <p className="text-[11px] uppercase opacity-50 mb-1">
                                        Mission
                                    </p>

                                    <p className="font-semibold text-sm">
                                        {selectedMission.numero}
                                    </p>

                                </div>

                                <div className="bg-base-200 rounded-xl px-4 py-3 border border-base-300">

                                    <p className="text-[11px] uppercase opacity-50 mb-1">
                                        Province
                                    </p>

                                    <p className="font-semibold text-sm">
                                        {selectedMission.zone}
                                    </p>

                                </div>

                            </div>

                            {/* TITLE */}
                            <div className="flex items-center justify-between">

                                <div>

                                    <h3 className="font-semibold text-sm">
                                        Liste des unités
                                    </h3>

                                    <p className="text-xs opacity-60">
                                        {unitesMission.length} unité(s)
                                    </p>

                                </div>

                                <div className="flex items-center gap-2">

                                    <div className="badge badge-success badge-sm">
                                        Active
                                    </div>



                                </div>

                            </div>

                            {/* LOADING */}
                            {loadingUnites ? (

                                <div className="flex flex-col items-center justify-center py-10">

                                    <span className="loading loading-spinner loading-md text-primary"></span>

                                    <p className="mt-3 text-xs opacity-70">
                                        Chargement...
                                    </p>

                                </div>

                            ) : unitesMission.length === 0 ? (

                                /* EMPTY */
                                <div className="border border-dashed border-base-300 rounded-xl py-10 flex flex-col items-center justify-center text-center">

                                    <Inbox className="w-7 h-7 opacity-40 mb-2" />

                                    <p className="font-medium text-sm">
                                        Aucune unité affectée
                                    </p>

                                    <p className="text-xs opacity-60 mt-1">
                                        Cette mission ne contient aucune unité.
                                    </p>

                                </div>

                            ) : (

                                /* LIST */
                                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">

                                    {unitesMission.map((u: any) => (

                                        <div
                                            key={u.id}
                                            className="
                                    bg-base-200
                                    hover:bg-base-300
                                    transition-all
                                    rounded-xl
                                    px-4
                                    py-3
                                    border
                                    border-base-300
                                    flex
                                    items-center
                                    justify-between
                                "
                                        >

                                            <div className="flex items-center gap-3">

                                                {/* ICON */}
                                                <div className="
                                        w-10 h-10 rounded-xl
                                        bg-primary/10
                                        text-primary
                                        flex items-center justify-center
                                        font-bold text-sm
                                    ">
                                                    {u.name?.charAt(0)}
                                                </div>

                                                {/* INFOS */}
                                                <div>

                                                    <p className="font-semibold text-sm">
                                                        {u.name}
                                                    </p>

                                                    {u.commandant ? (

                                                        <p className="text-xs opacity-70">
                                                            Cmdt: {u.commandant.name}
                                                        </p>

                                                    ) : (

                                                        <p className="text-xs opacity-50">
                                                            Aucun commandant
                                                        </p>

                                                    )}

                                                </div>

                                            </div>

                                            {/* BADGE */}
                                            <div className="flex items-center gap-2">

                                                <div className="badge badge-success badge-sm">
                                                    Active
                                                </div>

                                                {canAdmin && (
                                                    <button
                                                        className="btn btn-xs btn-error btn-outline"
                                                        onClick={() => handleDeleteUnite(u.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            )}

                        </div>

                        {/* FOOTER */}
                        <div className="border-t border-base-300 bg-base-200 px-5 py-3 flex justify-end">

                            <button
                                className="btn btn-sm btn-primary px-6"
                                onClick={() => setOpenViewUnits(false)}
                            >
                                Fermer
                            </button>

                        </div>

                    </div>

                </div>

            )}
            {/* CREATE MODAL */}
            {openModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

                    <div className="bg-base-100 p-6 rounded-xl w-full max-w-md">

                        <h2 className="text-xl font-bold mb-4">
                            Nouvelle mission
                        </h2>

                        <input
                            className="input input-bordered w-full mb-2"
                            placeholder="Zone"
                            value={form.zone}
                            onChange={(e) => {
                                const zone = e.target.value;

                                setForm((prev) => ({
                                    ...prev,
                                    zone,
                                    numero: generateMissionNumber(zone), // auto update
                                }));
                            }}
                        />

                        <input
                            className="input input-bordered w-full mb-2"
                            placeholder="Numéro mission"
                            value={form.numero}
                            readOnly
                        />


                        <div className="mb-4">

                            <label className="label">
                                <span className="label-text">
                                    Chef mission (SUPERVISEUR)
                                </span>
                            </label>

                            <Select
                                unstyled
                                isSearchable
                                placeholder="Rechercher superviseur..."

                                options={superviseurs
                                    .filter(
                                        (u: any) =>
                                            !missions.some(
                                                (m: any) =>
                                                    m.chargeMission?.id === u.id
                                            )
                                    )
                                    .map((u: any) => ({
                                        value: u.id,
                                        label: u.noms || u.username,
                                    }))
                                }

                                value={
                                    superviseurs
                                        .map((u: any) => ({
                                            value: u.id,
                                            label: u.noms || u.username,
                                        }))
                                        .find(
                                            (opt: any) =>
                                                opt.value === form.chargeMission.id
                                        ) || null
                                }

                                onChange={(selected: any) =>
                                    setForm({
                                        ...form,
                                        chargeMission: {
                                            id: selected?.value || 0,
                                        },
                                    })
                                }

                                classNames={{
                                    control: () =>
                                        "input input-bordered w-full min-h-[48px] flex flex-wrap px-2",

                                    valueContainer: () =>
                                        "flex gap-1 items-center",

                                    input: () =>
                                        "text-sm text-base-content",

                                    placeholder: () =>
                                        "text-base-content/50 text-sm",

                                    menu: () =>
                                        "bg-base-100 border border-base-300 rounded-box shadow-lg mt-2 z-50 overflow-hidden",

                                    option: ({ isFocused, isSelected }) =>
                                        `
            px-4 py-2 cursor-pointer text-sm
            ${isFocused ? "bg-base-200" : ""}
            ${isSelected ? "bg-primary text-primary-content" : ""}
        `,

                                    singleValue: () =>
                                        "text-sm text-base-content",

                                    dropdownIndicator: () =>
                                        "px-2 text-base-content/70",

                                    indicatorSeparator: () =>
                                        "hidden",

                                    menuList: () =>
                                        "max-h-60 overflow-y-auto",
                                }}
                            />

                        </div>

                        <div className="flex justify-end gap-2">

                            <button
                                className="btn"
                                onClick={() => setOpenModal(false)}
                            >
                                Annuler
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={handleCreate}
                            >
                                Créer
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {editModal && editingMission && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                    <div className="bg-base-100 p-6 rounded-xl w-full max-w-md">

                        <h2 className="text-xl font-bold mb-4">
                            Modifier mission
                        </h2>

                        {/* ZONE */}
                        <input
                            className="input input-bordered w-full mb-2"
                            placeholder="Zone"
                            value={editForm.zone}
                            onChange={(e) =>
                                setEditForm({ ...editForm, zone: e.target.value })
                            }
                        />

                        {/* NUMERO */}
                        <input
                            className="input input-bordered w-full mb-2"
                            placeholder="Numéro"
                            value={editForm.numero}
                            onChange={(e) =>
                                setEditForm({ ...editForm, numero: e.target.value })
                            }
                        />

                        {/* CHARGE MISSION */}
                        <Select
                            options={superviseurs.map((u: any) => ({
                                value: u.id,
                                label: u.noms || u.username,
                            }))}
                            value={superviseurs
                                .map((u: any) => ({
                                    value: u.id,
                                    label: u.noms || u.username,
                                }))
                                .find(
                                    (opt: any) =>
                                        opt.value === editForm.chargeMission.id
                                ) || null
                            }
                            onChange={(selected: any) =>
                                setEditForm({
                                    ...editForm,
                                    chargeMission: {
                                        id: selected?.value || 0,
                                    },
                                })
                            }
                        />

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-2 mt-4">

                            <button
                                className="btn"
                                onClick={() => setEditModal(false)}
                            >
                                Annuler
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={handleUpdateMission}
                            >
                                Modifier
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </DashboardLayout>
    );
}