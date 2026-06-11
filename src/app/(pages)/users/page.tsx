"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import {
    Eye,
    Inbox,
    Pencil,
    Trash2,
    X,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Search } from "lucide-react";
import { deleteDetailUnite } from "@/services/auth.service";



import Swal from "sweetalert2";
import { updateUser, deleteUser, getUnitesByUser } from "@/services/auth.service";

import {
    createUser,
    getUsers,
} from "@/services/auth.service";

import { getProfiles } from "@/services/profile.service";

import { toast } from "react-toastify";
import EmptyState from "@/components/EmptyState";
import dynamic from "next/dynamic";

const Select = dynamic(() => import("react-select"), {
    ssr: false,
})


type Profile = {
    id: number;
    name: string;
};

type User = {
    id: number;
    username: string;
    email: string;
    noms: string;
    profile?: Profile;
};

type UpdateUserPayload = {
    username?: string;
    email?: string;
    noms?: string;
    password?: string;
    profileId?: number;
};

const createUserSchema = z.object({
    username: z
        .string()
        .min(3, "Minimum 3 caractères"),

    noms: z
        .string()
        .min(3, "Nom invalide"),

    email: z
        .email("Email invalide"),

    password: z
        .string()
        .min(6, "Minimum 6 caractères"),

    profileId: z
        .string()
        .min(1, "Sélectionnez un profil"),
});
type CreateUserForm = z.infer<typeof createUserSchema>;

/**
 * UPDATE
 */
const updateUserSchema = z.object({
    username: z.string().min(3),
    noms: z.string().min(3),
    email: z.string().email(),
    profileId: z.string().optional().or(z.literal("")),
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;

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

export default function UsersPage() {

    const [users, setUsers] = useState<User[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);

    const [loading, setLoading] = useState(true);
    const [profileSearch, setProfileSearch] = useState("");
    const [editModal, setEditModal] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [openUnits, setOpenUnits] = useState(false);
    const [selectedUnits, setSelectedUnits] = useState<any[]>([]);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [openViewUser, setOpenViewUser] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [unitesUser, setUnitesUser] = useState<any[]>([]);
    const [loadingUnites, setLoadingUnites] = useState(false);


    /**
     * 🔥 MODAL
     */
    const [openModal, setOpenModal] = useState(false);

    /**
       * CREATE FORM
       */
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<CreateUserForm>({
        resolver: zodResolver(createUserSchema),
    });

    /**
     * UPDATE FORM (IMPORTANT FIX)
     */
    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        setValue: setValueEdit,
        reset: resetEdit,
        watch: watchEdit,
        formState: { errors: errorsEdit },
    } = useForm<UpdateUserForm>({
        resolver: zodResolver(updateUserSchema),
    });



    const openEditModal = (user: User) => {
        setEditingUserId(user.id);
        setEditModal(true);

        resetEdit({
            username: user.username,
            noms: user.noms,
            email: user.email,
            profileId: user.profile?.id ? String(user.profile.id) : "",
        });
    };

    const handleUpdateUser = async (data: UpdateUserForm) => {
        if (editingUserId === null) return;

        try {
            await updateUser(editingUserId, {
                username: data.username,
                email: data.email,
                noms: data.noms,
                profileId: Number(data.profileId), // ✅ CORRECT
            });
            toast.success("Utilisateur modifié");

            setEditModal(false);
            setEditingUserId(null);

            resetEdit();

            fetchUsers();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Erreur modification");
        }
    };



    /**
     * ➕ FORM
     */
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        email: "",
        noms: "",
        profileId: "",
    });

    const [filters, setFilters] = useState({
        search: "",
        profile: "ALL",
    });

    const profileOptions = [
        { value: "ALL", label: "Tous les profils" },
        ...profiles.map((p) => ({
            value: p.name,
            label: p.name,
        })),
    ];

    const [filtered, setFiltered] = useState<User[]>([]);

    const filteredProfiles =
        profiles.filter((p) =>
            p.name
                .toLowerCase()
                .includes(
                    profileSearch.toLowerCase()
                )
        );

    /**
     * 📄 PAGINATION
     */
    const [page, setPage] = useState(1);

    const limit = 20;

    const openCreateModal = () => {
        setEditingUserId(null);
        setEditModal(false);

        reset({
            username: "",
            noms: "",
            email: "",
            password: "",
            profileId: "",
        });

        setOpenModal(true);
    };

    /**
     * 🔌 LOAD DATA
     */
    const fetchUsers = async () => {
        try {
            setLoading(true);

            const data = await getUsers();

            setUsers(Array.isArray(data) ? data : []);
            setFiltered(Array.isArray(data) ? data : []);

        } catch (error) {
            console.error(error);
            setUsers([]);
            setFiltered([]);
        } finally {
            setLoading(false);
        }
    };

     const profile =
        typeof window !== "undefined"
            ? localStorage.getItem("profile")
            : null;

    const canManage =
        profile === "CHEF_EQUIPE"

    const canAdmin =
    profile === "ADMIN" ||
    profile === "MANAGER";
    const handleViewUser = async (user: User) => {

        setSelectedUser(user);
        setOpenViewUser(true);
        setLoadingUnites(true);

        try {

            const data = await getUnitesByUser(user.id);

            console.log("UNITES USER =", data);

            // ✅ FIX
            setUnitesUser(
                data?.data?.data ||
                data?.data ||
                data ||
                []
            );

        } catch (error) {

            console.error(error);
            setUnitesUser([]);

        } finally {

            setLoadingUnites(false);
        }
    };

    const handleRemoveUniteFromUser = async (id: number) => {
        const confirm = await Swal.fire({
            title: "Supprimer cette unité ?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Oui",
            cancelButtonText: "Annuler",
        });

        if (!confirm.isConfirmed) return;

        try {
            await deleteDetailUnite(id);

            toast.success("Unité supprimée");

            // refresh propre
            if (selectedUser?.id) {
                const data = await getUnitesByUser(selectedUser.id);

                setUnitesUser(
                    data?.data?.data ||
                    data?.data ||
                    data ||
                    []
                );
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Erreur suppression unité");
        }
    };
    const handleDeleteUser = async (id: number) => {
        const result = await Swal.fire({
            title: "Supprimer cet utilisateur ?",
            text: "Cette action est irréversible !",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            confirmButtonText: "Oui supprimer",
            cancelButtonText: "Annuler",
        });

        if (result.isConfirmed) {
            try {
                await deleteUser(id);

                toast.success("Utilisateur supprimé");

                fetchUsers();
            } catch (error) {
                toast.error("Erreur suppression");
            }
        }
    };

    const fetchProfiles = async () => {

        try {

            const data = await getProfiles();

            setProfiles(data);

        } catch (error) {

            console.error(error);
        }
    };

    useEffect(() => {

        fetchUsers();
        fetchProfiles();

    }, []);

    /**
     * 🔎 FILTERS
     */
    useEffect(() => {
        let data = [...users];

        // SEARCH
        if (filters.search.trim() !== "") {
            const s = filters.search.toLowerCase();

            data = data.filter(
                (u) =>
                    u.username.toLowerCase().includes(s) ||
                    u.email.toLowerCase().includes(s) ||
                    u.noms.toLowerCase().includes(s)
            );
        }

        // PROFILE (IMPORTANT FIX)
        if (filters.profile !== "ALL") {
            data = data.filter(
                (u) => u.profile?.name === filters.profile
            );
        }

        setFiltered(data);
        setPage(1);
    }, [filters, users]);

    /**
     * ➕ CREATE USER
     */
    const handleCreateUser = async (
        data: CreateUserForm
    ) => {

        try {

            await createUser({
                username: data.username,
                password: data.password,
                email: data.email,
                noms: data.noms,
                profile: {
                    id: Number(data.profileId),
                },
            });

            toast.success(
                "Utilisateur ajouté"
            );

            setOpenModal(false);

            reset();

            fetchUsers();

        } catch (error: any) {

            toast.error(
                error.response?.data?.message ||
                "Erreur ajout utilisateur"
            );
        }
    };

    /**
     * 📄 PAGINATION
     */
    const totalPages = Math.ceil(
        filtered.length / limit
    );

    const paginatedData = (filtered || []).slice(
        (page - 1) * limit,
        page * limit
    );

    return (
        <DashboardLayout>

            <div className="p-6 space-y-6">

                {/* 🧭 HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    <div>

                        <h1 className="text-2xl font-bold">
                            Utilisateurs
                        </h1>

                        <p className="text-sm opacity-70">
                            Gestion nationale des effectifs
                        </p>

                    </div>
                    {canAdmin && (
                    <button
                        className="btn btn-primary"
                        onClick={() =>
                            openCreateModal()
                        }
                    >
                        + Ajouter utilisateur
                    </button>
                )}
                </div>

                {/* 🔎 FILTERS */}
                <div className="card bg-base-200 shadow-sm">

                    <div className="card-body">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                            <input
                                className="input input-bordered w-full"
                                placeholder="Recherche..."
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        search: e.target.value,
                                    })
                                }
                            />
                            <Select
                                options={[
                                    { value: "ALL", label: "Tous les profils" },
                                    ...profiles.map((p: any) => ({
                                        value: p.name,
                                        label: p.name,
                                    })),
                                ]}

                                value={
                                    [
                                        { value: "ALL", label: "Tous les profils" },
                                        ...profiles.map((p: any) => ({
                                            value: p.name,
                                            label: p.name,
                                        })),
                                    ].find(opt => opt.value === filters.profile) || null
                                }

                                onChange={(selected: any) =>
                                    setFilters({
                                        ...filters,
                                        profile: selected?.value ?? "ALL",
                                    })
                                }

                                placeholder="Tous les profils"
                                unstyled
                                isSearchable
                                classNames={selectStyles}
                            />
                        </div>

                    </div>

                </div>

                {/* 📊 TABLE */}
                <div className="card bg-base-100 shadow-md">

                    <div className="card-body p-0">

                        <div className="overflow-x-auto">

                            <table className="table">

                                <thead className="bg-base-200">
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Noms</th>
                                        <th>Email</th>
                                        <th>Profil</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {/* LOADING */}
                                    {loading && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-10">
                                                <span className="loading loading-spinner loading-md"></span>
                                            </td>
                                        </tr>
                                    )}

                                    {/* EMPTY */}
                                    {!loading && paginatedData.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12">

                                                <div className="flex flex-col items-center gap-2 opacity-70">
                                                    <Search className="w-8 h-8" />

                                                    <p className="font-semibold">
                                                        Aucun utilisateur trouvé
                                                    </p>

                                                    <p className="text-sm">
                                                        Essayez de modifier vos filtres ou d’ajouter un utilisateur
                                                    </p>
                                                </div>

                                            </td>
                                        </tr>
                                    )}

                                    {/* DATA */}
                                    {!loading && paginatedData.map((u) => (
                                        <tr key={u.id} className="hover">

                                            <td>{u.id}</td>
                                            <td className="font-semibold">{u.username}</td>
                                            <td>{u.noms}</td>
                                            <td>{u.email}</td>

                                            <td>
                                                 {u.profile?.name}
                                                {/* <span className="badge badge-info">
                                                    {u.profile?.name}
                                                </span> */}
                                            </td>

                                            <td className="text-center">

                                                <div className="flex items-center justify-center gap-2">

                                                    {/* VIEW CONTROLEUR ONLY */}
                                                    {u.profile?.name === "CONTROLEUR" && (
                                                        <div className="tooltip" data-tip="Voir unités">

                                                            <button
                                                                className="w-8 h-8 flex btn-success btn-outline items-center justify-center rounded-full bg-base-200 hover:bg-primary hover:text-primary-content transition-all cursor-pointer"
                                                                onClick={() => handleViewUser(u)}
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>

                                                        </div>
                                                    )}
                                                   
                                                    {/* EDIT */}
                                                    {canAdmin && (
                                                    <div className="tooltip" data-tip="Modifier">

                                                        <button
                                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-warning hover:text-warning-content transition-all cursor-pointer"
                                                            onClick={() => openEditModal(u)}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>

                                                    </div>
                                                    )}

                                                    {/* DELETE */}
                                                    {canAdmin && (
                                                    <div className="tooltip" data-tip="Supprimer">

                                                        <button
                                                            className="w-8 h-8 flex btn-error btn-outline items-center justify-center rounded-full bg-base-200 hover:bg-error hover:text-error-content transition-all cursor-pointer"
                                                            onClick={() => handleDeleteUser(u.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>

                                                    </div>
                                                    )}
                                                </div>

                                            </td>

                                        </tr>
                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>
                <div className="flex justify-between items-center">

                    <p className="text-sm opacity-70">
                        Page {page} / {totalPages || 1} — Total : {filtered.length} utilisateur(s)
                    </p>

                    <div className="join">

                        {/* PREVIOUS */}
                        <button
                            className="join-item btn btn-sm"
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            « Précédent
                        </button>

                        {/* NEXT */}
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

            {/* 📄 PAGINATION */}






            {/* VIEW USER DETAILS */}
            {
                openViewUser && selectedUser && (

                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

                        <div className="bg-base-100 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-base-300">

                            {/* HEADER (UNIFIÉ MISSION / ÉQUIPE STYLE) */}
                            <div className="bg-base-200 border-b border-base-300 px-5 py-4">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <h2 className="text-xl font-bold text-base-content">
                                            Détails utilisateur
                                        </h2>

                                        <p className="text-xs opacity-60 mt-1">
                                            @{selectedUser.username}
                                        </p>

                                    </div>
                                    
                                    <button
                                        className="btn btn-sm btn-circle btn-ghost"
                                        onClick={() => setOpenViewUser(false)}
                                    >
                                        ✕
                                    </button>

                                </div>

                            </div>

                            {/* CONTENT */}
                            <div className="p-5 space-y-4">

                                {/* INFOS USER */}
                                <div className="grid grid-cols-2 gap-3">

                                    <div className="bg-base-200 rounded-xl px-4 py-3 border border-base-300">
                                        <p className="text-[11px] uppercase opacity-50 mb-1">
                                            Nom complet
                                        </p>
                                        <p className="font-semibold text-sm">
                                            {selectedUser.noms}
                                        </p>
                                    </div>

                                    <div className="bg-base-200 rounded-xl px-4 py-3 border border-base-300">
                                        <p className="text-[11px] uppercase opacity-50 mb-1">
                                            Email
                                        </p>
                                        <p className="font-semibold text-sm">
                                            {selectedUser.email}
                                        </p>
                                    </div>

                                    <div className="bg-base-200 rounded-xl px-4 py-3 border border-base-300">
                                        <p className="text-[11px] uppercase opacity-50 mb-1">
                                            Profil
                                        </p>
                                        <p className="font-semibold text-sm">
                                            {selectedUser.profile?.name}
                                        </p>
                                    </div>

                                    <div className="bg-base-200 rounded-xl px-4 py-3 border border-base-300">
                                        <p className="text-[11px] uppercase opacity-50 mb-1">
                                            Statut
                                        </p>
                                        <span className="badge badge-success">
                                            Actif
                                        </span>
                                    </div>

                                </div>

                                {/* UNITES TITLE */}
                                <div className="flex items-center justify-between">

                                    <div>

                                        <h3 className="font-semibold text-sm">
                                            Unités liées
                                        </h3>

                                        <p className="text-xs opacity-60">
                                            {unitesUser.length} unité(s)
                                        </p>

                                    </div>

                                    <div className="badge badge-primary badge-sm">
                                        Contrôleur
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

                                ) : unitesUser.length === 0 ? (

                                    /* EMPTY */
                                    <div className="border border-dashed border-base-300 rounded-xl py-10 flex flex-col items-center justify-center text-center">

                                        <Inbox className="w-7 h-7 opacity-40 mb-2" />

                                        <p className="font-medium text-sm">
                                            Aucune unité liée
                                        </p>

                                        <p className="text-xs opacity-60 mt-1">
                                            Ce contrôleur n’est affecté à aucune unité.
                                        </p>

                                    </div>

                                ) : (

                                    /* LIST */
                                    <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">

                                        {unitesUser.map((u: any) => (

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

                                                        <p className="text-xs opacity-70">
                                                            {u.description || "Unité active"}
                                                        </p>

                                                    </div>

                                                </div>
                                                {/* DELETE BUTTON */}
                                                {canAdmin && (
                                                <button
                                                    className="btn btn-xs btn-error btn-outline"
                                                    onClick={() => handleRemoveUniteFromUser(u.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                )}

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
                                    onClick={() => setOpenViewUser(false)}
                                >
                                    Fermer
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }
            {/* 🔥 MODAL */}
            {
                openModal && (

                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

                        <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200">

                            {/* HEADER */}
                            <div className="flex items-center justify-between border-b border-base-300 p-5">

                                <div>

                                    <h2 className="text-xl font-bold">
                                        Ajouter utilisateur
                                    </h2>

                                    <p className="text-sm opacity-60">
                                        Création d'un nouveau compte
                                    </p>

                                </div>

                                <button
                                    className="btn btn-sm btn-circle btn-ghost"
                                    onClick={() =>
                                        setOpenModal(false)
                                    }
                                >
                                    <X className="w-5 h-5" />
                                </button>

                            </div>

                            {/* BODY */}
                            <form
                                onSubmit={handleSubmit(
                                    handleCreateUser
                                )}
                                className="p-5 space-y-4"
                                autoComplete="off"
                            >

                                {/* USERNAME */}
                                <div>

                                    <input
                                        type="text"
                                        placeholder="Username"
                                        autoComplete="off"
                                        className="input input-bordered w-full"
                                        {...register("username")}

                                    />

                                    {errors.username && (
                                        <p className="text-error text-sm mt-1">
                                            {errors.username.message}
                                        </p>
                                    )}

                                </div>

                                {/* NOMS */}
                                <div>

                                    <input
                                        type="text"
                                        placeholder="Noms"
                                        className="input input-bordered w-full"
                                        {...register("noms")}
                                    />

                                    {errors.noms && (
                                        <p className="text-error text-sm mt-1">
                                            {errors.noms.message}
                                        </p>
                                    )}

                                </div>

                                {/* EMAIL */}
                                <div>

                                    <input
                                        type="email"
                                        placeholder="Email"
                                        autoComplete="off"
                                        className="input input-bordered w-full"
                                        {...register("email")}
                                    />

                                    {errors.email && (
                                        <p className="text-error text-sm mt-1">
                                            {errors.email.message}
                                        </p>
                                    )}

                                </div>

                                {/* PASSWORD */}
                                <div>

                                    <input
                                        type="password"
                                        placeholder="Mot de passe"
                                        autoComplete="off"
                                        className="input input-bordered w-full"
                                        {...register("password")}
                                    />

                                    {errors.password && (
                                        <p className="text-error text-sm mt-1">
                                            {errors.password.message}
                                        </p>
                                    )}

                                </div>

                                <div>
                                    <Select
                                        options={profiles.map((p) => ({
                                            value: p.id,
                                            label: p.name,
                                        }))}

                                        value={
                                            profiles
                                                .map((p) => ({
                                                    value: p.id,
                                                    label: p.name,
                                                }))
                                                .find(
                                                    (opt) =>
                                                        opt.value === Number(watch("profileId"))
                                                ) || null
                                        }

                                        onChange={(selected: any) =>
                                            setValue("profileId", String(selected?.value || ""), {
                                                shouldValidate: true,
                                                shouldDirty: true,
                                            })
                                        }

                                        placeholder="Sélectionner un profil"
                                        isSearchable
                                        unstyled
                                        classNames={selectStyles}
                                    />

                                    {errors.profileId && (
                                        <p className="text-error text-sm mt-1">
                                            {errors.profileId.message}
                                        </p>
                                    )}
                                </div>

                                {/* FOOTER */}
                                <div className="flex justify-end gap-3 border-t border-base-300 pt-5 mt-5">

                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        onClick={() =>
                                            setOpenModal(false)
                                        }
                                    >
                                        Annuler
                                    </button>
                                    
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                    >
                                        Ajouter
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                )
            }

            {
                editModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

                        <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg">

                            {/* HEADER */}
                            <div className="flex justify-between p-5 border-b">
                                <h2 className="text-xl font-bold">
                                    Modifier utilisateur
                                </h2>

                                <button
                                    className="btn btn-sm btn-circle btn-ghost"
                                    onClick={() => {
                                        setEditModal(false);
                                        setEditingUserId(null);
                                        resetEdit(); // ✅ FIX ICI
                                    }}
                                >
                                    <X />
                                </button>
                            </div>

                            {/* FORM */}
                            <form
                                onSubmit={handleSubmitEdit(handleUpdateUser)}
                                className="p-5 space-y-4"
                            >

                                {/* USERNAME */}
                                <div>
                                    <input
                                        className="input input-bordered w-full"
                                        placeholder="Username"
                                        {...registerEdit("username")}
                                    />
                                    {errorsEdit.username && (
                                        <p className="text-error text-sm">
                                            {errorsEdit.username.message}
                                        </p>
                                    )}
                                </div>

                                {/* NOMS */}
                                <div>
                                    <input
                                        className="input input-bordered w-full"
                                        placeholder="Noms"
                                        {...registerEdit("noms")}
                                    />
                                    {errorsEdit.noms && (
                                        <p className="text-error text-sm">
                                            {errorsEdit.noms.message}
                                        </p>
                                    )}
                                </div>

                                {/* EMAIL */}
                                <div>
                                    <input
                                        className="input input-bordered w-full"
                                        placeholder="Email"
                                        {...registerEdit("email")}
                                    />
                                    {errorsEdit.email && (
                                        <p className="text-error text-sm">
                                            {errorsEdit.email.message}
                                        </p>
                                    )}
                                </div>

                                {/* PROFILE */}
                                <div>
                                    <Select
                                        options={profiles.map((p: any) => ({
                                            value: p.id,
                                            label: p.name,
                                        }))}

                                        value={
                                            profiles
                                                .map((p: any) => ({
                                                    value: p.id,
                                                    label: p.name,
                                                }))
                                                .find(
                                                    (opt: any) =>
                                                        opt.value === Number(watchEdit("profileId"))
                                                ) || null
                                        }

                                        onChange={(selected: any) =>
                                            setValueEdit("profileId", String(selected?.value || ""), {
                                                shouldValidate: true,
                                                shouldDirty: true,
                                            })
                                        }

                                        placeholder="Profil"
                                        unstyled
                                        isSearchable
                                        classNames={selectStyles}
                                    />

                                    {errorsEdit.profileId?.message && (
                                        <p className="text-error text-sm">
                                            {String(errorsEdit.profileId.message)}
                                        </p>
                                    )}
                                </div>

                                {/* FOOTER */}
                                <div className="flex justify-end gap-2 pt-4">

                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => {
                                            setEditModal(false);
                                            setEditingUserId(null);
                                            resetEdit(); // ✅ FIX ICI
                                        }}
                                    >
                                        Annuler
                                    </button>

                                    <button type="submit" className="btn btn-primary">
                                        Modifier
                                    </button>

                                </div>

                            </form>

                        </div>
                    </div>
                )
            }

        </DashboardLayout >
    );
}