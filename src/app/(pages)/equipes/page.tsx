// app/dashboard/equipes/page.tsx

"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Select from "react-select";

import equipeService, { addControleurToEquipe, Equipe, getDetailEquipeByEquipe, removeControleurFromEquipe } from "@/services/equipe.service";
import { getUsers } from "@/services/auth.service";
import { getMissions } from "@/services/mission.service";
import { Eye } from "lucide-react";
import { getUnitesByEquipe } from "@/services/equipe.service";
import {
    UserPlus,
    ShieldX,
} from "lucide-react";

import {
    Trash2,
    Pencil,
    Inbox,
    Search,
    Users,
    X,
} from "lucide-react";

type FormData = {
    userId: number;
    missionId: number;
    site: string; // 👈 AJOUT
    isActive: boolean;
};


// ✅ AJOUTE ÇA AU-DESSUS DU COMPONENT EquipeModal
export const selectStyles = {
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

    menuList: () =>
        "max-h-60 overflow-y-auto",

    option: ({ isFocused, isSelected }: any) =>
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
};


export default function EquipesPage() {
    const [equipes, setEquipes] = useState<Equipe[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [missions, setMissions] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);

    const [openModal, setOpenModal] = useState(false);
    const [editModal, setEditModal] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [openViewUnits, setOpenViewUnits] = useState(false);
    const [selectedEquipe, setSelectedEquipe] = useState<any>(null);
    const [unitesEquipe, setUnitesEquipe] = useState<any[]>([]);
    const [loadingUnites, setLoadingUnites] = useState(false);

    const [openControleurModal, setOpenControleurModal] = useState(false);

    const [selectedEquipeControleur, setSelectedEquipeControleur] = useState<any>(null);

    const [controleurs, setControleurs] = useState<any[]>([]);

    const [selectedControleur, setSelectedControleur] = useState<any>(null);

    const [detailEquipeList, setDetailEquipeList] = useState<any[]>([]);

    const [filters, setFilters] = useState({
        search: "",
        status: "",
    });

    const [form, setForm] = useState<FormData>({
        userId: 0,
        missionId: 0,
        site: "", // 👈 AJOUT
        isActive: true,
    });
    const fetchUnitesEquipe = async (equipeId: number) => {
        setLoadingUnites(true);
        setUnitesEquipe([]);

        try {
            const data = await getUnitesByEquipe(equipeId);

            console.log("UNITS API:", data);

            setUnitesEquipe(data);

        } catch (error) {
            console.error(error);
            toast.error("Erreur chargement unités");
        } finally {
            setLoadingUnites(false);
        }
    };

    const fetchControleurs = async () => {
        try {

            const data = await getUsers();

            const filtered = data.filter(
                (u: any) => u.profile?.name === "CONTROLEUR"
            );

            setControleurs(filtered);

        } catch (error) {
            console.error(error);
        }
    };

    const handleViewUnits = (equipe: any) => {
        setSelectedEquipe(equipe);
        setOpenViewUnits(true);
    };

    const [page, setPage] = useState(1);

    const limit = 10;

    /**
     * FETCH EQUIPES
     */
    const fetchEquipes = async () => {
        try {
            setLoading(true);

            const data = await equipeService.getAll();

            setEquipes(data);
        } catch (error) {
            console.error(error);
            toast.error("Erreur chargement équipes");
        } finally {
            setLoading(false);
        }
    };

    /**
     * FETCH USERS
     */
    const fetchUsers = async () => {
        try {
            const data = await getUsers();

            const superviseurs = data.filter(
                (u: any) => u.profile?.name === "CHEF_EQUIPE"
            );

            setUsers(superviseurs);

        } catch (error) {
            console.error(error);
        }
    };

    /**
     * FETCH MISSIONS
     */
    const fetchMissions = async () => {
        try {
            const data = await getMissions();
            setMissions(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchDetailEquipe = async (equipeId: number) => {
        try {

            const data = await getDetailEquipeByEquipe(equipeId);

            setDetailEquipeList(data);

        } catch (error) {
            console.error(error);
            toast.error("Erreur chargement contrôleurs");
        }
    };

    const handleAddControleur = async () => {

        if (!selectedControleur) {
            toast.error("Sélectionnez un contrôleur");
            return;
        }

        try {

            await addControleurToEquipe(
                selectedEquipeControleur.id,
                selectedControleur.value
            );

            toast.success("Contrôleur ajouté");

            fetchDetailEquipe(selectedEquipeControleur.id);

            setSelectedControleur(null);

        } catch (error) {
            console.error(error);
            toast.error("Erreur ajout");
        }
    };

    const handleDeleteControleur = async (id: number) => {

        try {

            await removeControleurFromEquipe(id);

            toast.success("Contrôleur supprimé");

            fetchDetailEquipe(selectedEquipeControleur.id);

        } catch (error) {
            console.error(error);
            toast.error("Erreur suppression");
        }
    };

    useEffect(() => {
        fetchEquipes();
        fetchUsers();
        fetchMissions();
        fetchControleurs();
    }, []);

    /**
     * FILTERS
     */
    const filteredEquipes = equipes.filter((e: any) => {
        const search = filters.search.toLowerCase();

        const matchSearch =
            filters.search === "" ||
            e.user?.noms?.toLowerCase().includes(search) ||
            e.user?.username?.toLowerCase().includes(search) ||
            e.mission?.numero?.toLowerCase().includes(search) ||
            e.mission?.zone?.toLowerCase().includes(search);

        const matchStatus =
            filters.status === "" ||
            (filters.status === "ACTIVE" && e.isActive) ||
            (filters.status === "INACTIVE" && !e.isActive);

        return matchSearch && matchStatus;
    });

    /**
     * PAGINATION
     */
    const totalPages = Math.ceil(filteredEquipes.length / limit);

    const paginatedEquipes = filteredEquipes.slice(
        (page - 1) * limit,
        page * limit
    );

    useEffect(() => {
        setPage(1);
    }, [filters]);

    /**
     * CREATE
     */
    // ✅ CREATE
    const handleCreate = async () => {
        try {
            await equipeService.create({
                user: {
                    id: form.userId,
                },
                mission: {
                    id: form.missionId,
                },
                site: form.site, // 👈 AJOUT
                isActive: true, // force actif
            });

            toast.success("Équipe créée");

            setOpenModal(false);

            fetchEquipes();

            resetForm();

        } catch (error) {
            console.error(error);
            toast.error("Erreur création");
        }
    };

    /**
     * EDIT OPEN
     */
    const handleEditOpen = (equipe: any) => {
        setEditingId(equipe.id);

        setForm({
            userId: equipe.user?.id,
            missionId: equipe.mission?.id,
            site: form.site, // 👈 AJOUT
            isActive: equipe.isActive,
        });

        setEditModal(true);
    };

    /**
     * UPDATE
     */
    // ✅ UPDATE
    const handleUpdate = async () => {
        if (!editingId) return;

        try {
            await equipeService.update(editingId, {
                user: {
                    id: form.userId,
                },
                mission: {
                    id: form.missionId,
                },
                site: form.site, // 👈 AJOUT
                isActive: true, // toujours actif
            });

            toast.success("Équipe modifiée");

            setEditModal(false);

            fetchEquipes();


            resetForm();

        } catch (error) {
            console.error(error);
            toast.error("Erreur modification");
        }
    };

    /**
     * DELETE
     */
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: "Supprimer cette équipe ?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Oui",
        });

        if (result.isConfirmed) {
            try {
                await equipeService.delete(id);

                toast.success("Équipe supprimée");

                fetchEquipes();
            } catch (error) {
                console.error(error);
                toast.error("Erreur suppression");
            }
        }
    };

    /**
     * RESET FORM
     */
    const resetForm = () => {
        setForm({
            userId: 0,
            missionId: 0,
            site: "",
            isActive: true,
        });

        setEditingId(null);
    };


return (
    <DashboardLayout>
        <div className="p-6 space-y-6">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Équipes</h1>

                    <p className="text-sm opacity-70">
                        Gestion des équipes opérationnelles
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => setOpenModal(true)}
                >
                    + Nouvelle équipe
                </button>
            </div>

            {/* FILTERS */}
            <div className="card bg-base-200 shadow-sm">
                <div className="card-body">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                        {/* SEARCH */}
                        <label className="input input-bordered flex items-center gap-2">

                            <Search size={16} />

                            <input
                                type="text"
                                className="grow"
                                placeholder="Rechercher équipe..."
                                value={filters.search}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        search: e.target.value,
                                    })
                                }
                            />
                        </label>

                        {/* STATUS */}
                        <select
                            className="select select-bordered"
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
                            <option value="INACTIVE">Inactives</option>
                        </select>

                    </div>

                </div>
            </div>

            {/* TABLE */}
            <div className="card bg-base-100 shadow-md">

                <div className="card-body p-0">

                    <div className="overflow-x-auto">

                        <table className="table">

                            <thead className="bg-base-200">
                                <tr>
                                    <th>ID</th>
                                    <th>Equipe</th>
                                    <th>Mission</th>
                                    <th>Zone</th>
                                     <th>Site</th>
                                    <th>Date création</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>

                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10">
                                            <span className="loading loading-spinner"></span>
                                        </td>
                                    </tr>
                                )}

                                {!loading && paginatedEquipes.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10">

                                            <div className="flex flex-col items-center gap-2 opacity-70">

                                                <Inbox className="w-8 h-8" />

                                                <p className="font-semibold">
                                                    Aucune équipe trouvée
                                                </p>

                                            </div>

                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    paginatedEquipes.map((e: any) => (
                                        <tr key={e.id} className="hover">

                                            <td>{e.id}</td>

                                            <td>
                                                Equipe-{e.user?.username}
                                            </td>

                                            <td>{e.mission?.numero}</td>

                                            <td>{e?.mission?.zone}</td>

                                            <td>
                                               {e.site}
                                            </td>

                                            <td>
                                                {e.createdAt
                                                    ? new Date(e.createdAt).toLocaleString()
                                                    : "-"}
                                            </td>

                                            <td className="flex gap-2">

                                                {/* EDIT */}
                                                <div className="tooltip" data-tip="Modifier l'équipe">
                                                    <button
                                                        className="btn btn-xs btn-info btn-outline"
                                                        onClick={() => handleEditOpen(e)}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                </div>

                                                {/* DELETE */}
                                                <div className="tooltip" data-tip="Supprimer l'équipe">
                                                    <button
                                                        className="btn btn-xs btn-error btn-outline"
                                                        onClick={() => handleDelete(e.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                {/* VIEW */}
                                                <div className="tooltip" data-tip="Voir les unités de l'équipe">
                                                    <button
                                                        className="btn btn-xs btn-success btn-outline"
                                                        onClick={async () => {
                                                            setSelectedEquipe(e);
                                                            await fetchUnitesEquipe(e.id);
                                                            setOpenViewUnits(true);
                                                        }}
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                </div>

                                                <div className="tooltip" data-tip="Ajouter contrôleur">
                                                    <button
                                                        className="btn btn-xs btn-warning btn-outline"
                                                        onClick={async () => {

                                                            setSelectedEquipeControleur(e);

                                                            await fetchDetailEquipe(e.id);

                                                            setOpenControleurModal(true);
                                                        }}
                                                    >
                                                        <UserPlus size={14} />
                                                    </button>
                                                </div>

                                            </td>

                                        </tr>
                                    ))}

                            </tbody>

                        </table>

                    </div>

                    {/* PAGINATION */}
                    <div className="flex justify-between items-center px-4 py-3 border-t">

                        <p className="text-sm opacity-70">
                            Page {page} / {totalPages || 1}
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

            {/* CREATE MODAL */}
            {openModal && (
                <EquipeModal
                    title="Nouvelle équipe"
                    form={form}
                    setForm={setForm}
                    users={users}
                    missions={missions}
                    equipes={equipes}   // 👈 AJOUT OBLIGATOIRE
                    onClose={() => {
                        setOpenModal(false);
                        resetForm();
                    }}
                    onSubmit={handleCreate}
                />
            )}

            {/* EDIT MODAL */}
            {editModal && (
                <EquipeModal
                    title="Modifier équipe"
                    form={form}
                    setForm={setForm}
                    users={users}
                    missions={missions}
                    equipes={equipes}   // 👈 AJOUT OBLIGATOIRE
                    onClose={() => {
                        setEditModal(false);
                        resetForm();
                    }}
                    onSubmit={handleUpdate}
                />
            )}

        </div>

        {openViewUnits && selectedEquipe && (

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
                                    Équipe #{selectedEquipe.id}
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

                    {/* View unité équipe */}
                    <div className="p-5 space-y-4">

                        {/* INFOS */}
                        <div className="grid grid-cols-2 gap-3">

                            <div className="bg-base-200 rounded-xl px-4 py-3 border border-base-300">

                                <p className="text-[11px] uppercase opacity-50 mb-1">
                                    Équipe
                                </p>

                                <p className="font-semibold text-sm">
                                    Equipe-{selectedEquipe.user?.username}
                                </p>

                            </div>

                            <div className="bg-base-200 rounded-xl px-4 py-3 border border-base-300">

                                <p className="text-[11px] uppercase opacity-50 mb-1">
                                    Mission
                                </p>

                                <p className="font-semibold text-sm">
                                    {selectedEquipe.mission?.numero}
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
                                    {unitesEquipe.length} unité(s)
                                </p>

                            </div>

                            <div className="badge badge-primary badge-sm">
                                Active
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

                        ) : unitesEquipe.length === 0 ? (

                            /* EMPTY */
                            <div className="border border-dashed border-base-300 rounded-xl py-10 flex flex-col items-center justify-center text-center">

                                <Inbox className="w-7 h-7 opacity-40 mb-2" />

                                <p className="font-medium text-sm">
                                    Aucune unité affectée
                                </p>

                                <p className="text-xs opacity-60 mt-1">
                                    Cette équipe ne contient aucune unité.
                                </p>

                            </div>

                        ) : (

                            /* LIST */
                            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">

                                {unitesEquipe.map((u: any) => (

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
                                        <div className="badge badge-success badge-sm">
                                            Active
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

        {openControleurModal && selectedEquipeControleur && (

            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

                <div className="bg-base-100 w-full max-w-xl rounded-2xl shadow-2xl border border-base-300 overflow-hidden">

                    {/* HEADER */}
                    <div className="px-5 py-4 border-b border-base-300 bg-base-200">

                        <div className="flex justify-between items-center">

                            <div>
                                <h2 className="text-xl font-bold">
                                    Contrôleurs de l'équipe
                                </h2>

                                <p className="text-xs opacity-70 mt-1">
                                    Equipe-{selectedEquipeControleur.user?.username}
                                </p>
                            </div>

                            <button
                                className="btn btn-sm btn-circle btn-ghost"
                                onClick={() => setOpenControleurModal(false)}
                            >
                                ✕
                            </button>

                        </div>

                    </div>

                    {/* BODY */}
                    <div className="p-5 space-y-5">

                        {/* SELECT */}
                        <div>

                            <label className="label">
                                <span className="label-text">
                                    Ajouter un contrôleur
                                </span>
                            </label>

                            <Select
                                options={controleurs
                                    .filter(
                                        (u: any) =>
                                            !detailEquipeList.some(
                                                (d: any) => d.user?.id === u.id
                                            )
                                    )
                                    .map((u: any) => ({
                                        value: u.id,
                                        label: u.username,
                                    }))
                                }

                                value={selectedControleur}

                                onChange={(val: any) =>
                                    setSelectedControleur(val)
                                }

                                placeholder="Choisir un contrôleur..."
                                isSearchable
                                unstyled
                                classNames={selectStyles}
                            />

                        </div>

                        {/* BTN */}
                        <button
                            className="btn btn-primary w-full"
                            onClick={handleAddControleur}
                        >
                            Ajouter contrôleur
                        </button>

                        {/* LISTE */}
                        <div className="space-y-3">

                            <div className="flex justify-between items-center">

                                <h3 className="font-semibold">
                                    Contrôleurs affectés
                                </h3>

                                <div className="badge badge-primary">
                                    {detailEquipeList.length}
                                </div>

                            </div>

                            {detailEquipeList.length === 0 ? (

                                <div className="border border-dashed border-base-300 rounded-xl p-8 text-center">

                                    <Users className="mx-auto mb-2 opacity-40" />

                                    <p className="text-sm opacity-70">
                                        Aucun contrôleur affecté
                                    </p>

                                </div>

                            ) : (

                                <div className="space-y-2 max-h-[300px] overflow-y-auto">

                                    {detailEquipeList.map((d: any) => (

                                        <div
                                            key={d.id}
                                            className="
                                        bg-base-200
                                        border border-base-300
                                        rounded-xl
                                        p-4
                                        flex items-center justify-between
                                    "
                                        >

                                            <div>

                                                <p className="font-semibold">
                                                    {d.user?.username}
                                                </p>

                                                <p className="text-xs opacity-60">
                                                    Contrôleur
                                                </p>

                                            </div>

                                            <button
                                                className="btn btn-sm btn-error btn-outline"
                                                onClick={() =>
                                                    handleDeleteControleur(d.id)
                                                }
                                            >
                                                <ShieldX size={16} />
                                            </button>

                                        </div>

                                    ))}

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            </div>

        )}
    </DashboardLayout>
);
}

/**
 * MODAL
 */
function EquipeModal({
    title,
    form,
    setForm,
    users,
    missions,
    equipes,
    onClose,
    onSubmit,
}: any) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-base-100 p-6 rounded-xl w-full max-w-md">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-4">

                    <h2 className="text-xl font-bold">{title}</h2>

                    <button
                        className="btn btn-sm btn-circle"
                        onClick={onClose}
                    >
                        <X size={16} />
                    </button>

                </div>

                {/* AGENT */}
                <div className="mb-4">

                    <label className="label">
                        <span className="label-text">Agent superviseur</span>
                    </label>

                    <Select
                        options={users
                            .filter((u: any) => {
                                const isChefEquipe =
                                    u.profile?.name === "CHEF_EQUIPE";

                                const alreadyInEquipe = equipes.some(
                                    (e: any) => e.user?.id === u.id
                                );

                                return isChefEquipe && !alreadyInEquipe;
                            })
                            .map((u: any) => ({
                                value: u.id,
                                label: u.noms || u.username,
                            }))}
                        value={
                            users
                                .map((u: any) => ({
                                    value: u.id,
                                    label: u.noms || u.username,
                                }))
                                .find(
                                    (opt: any) => opt.value === form.userId
                                ) || null
                        }
                        onChange={(selected: any) =>
                            setForm({
                                ...form,
                                userId: selected?.value || 0,
                            })
                        }
                        placeholder="Rechercher un superviseur..."
                        unstyled
                        isSearchable
                        classNames={selectStyles}
                    />

                </div>

                {/* SITE 👈 AJOUT ICI */}
                <div className="mb-4">

                    <label className="label">
                        <span className="label-text">Site</span>
                    </label>

                    <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Ex: Kinshasa centre"
                        value={form.site}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                site: e.target.value,
                            })
                        }
                    />

                </div>

                {/* MISSION */}
                <div className="mb-5">

                    <label className="label">
                        <span className="label-text">Mission</span>
                    </label>

                    <Select
                        options={missions.map((m: any) => ({
                            value: m.id,
                            label: `${m.numero}`,
                        }))}
                        value={
                            missions
                                .map((m: any) => ({
                                    value: m.id,
                                    label: `${m.numero}`,
                                }))
                                .find(
                                    (opt: any) => opt.value === form.missionId
                                ) || null
                        }
                        onChange={(selected: any) =>
                            setForm({
                                ...form,
                                missionId: selected?.value || 0,
                            })
                        }
                        placeholder="Rechercher une mission..."
                        classNames={selectStyles}
                        unstyled
                        isSearchable
                    />

                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-2">

                    <button className="btn" onClick={onClose}>
                        Annuler
                    </button>

                    <button className="btn btn-primary" onClick={onSubmit}>
                        Enregistrer
                    </button>

                </div>

            </div>

        </div>
    );
}