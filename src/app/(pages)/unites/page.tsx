"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, X, Pencil, Trash2 } from "lucide-react";
import { chargerUnite } from "@/services/unite-charge.service";

import Swal from "sweetalert2";
import { toast } from "react-toastify";
import confetti from "canvas-confetti";

type UniteWithExists = Unite & {
    exists?: boolean;
};

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

import {
    getUnites,
    createUnite,
    updateUnite,
    deleteUnite,
    checkUniteExists,
} from "@/services/unite.service";
import Select from "react-select";
import { getMissions } from "@/services/mission.service";
import { getUsers } from "@/services/auth.service";
import equipeService, { getEquipes } from "@/services/equipe.service";



/* ========================= TYPES ========================= */

type Person = {
    uuid: string;
    name: string;
};

type Unite = {
    id: number;
    name: string;
    signature?: string;
    commandant?: Person;
    equipeaf?: string;
};

/* ========================= VALIDATION ========================= */

const schema = z.object({
    name: z.string().min(2),
    signature: z.string().optional(),
    commandantId: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

/* ========================= COMPONENT ========================= */

export default function UnitePage() {

    const [unites, setUnites] = useState<Unite[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [openModal, setOpenModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [existsMap, setExistsMap] = useState<Record<number, boolean>>({});
    const [loadModal, setLoadModal] = useState(false);
    

    const [provinces, setProvinces] = useState<any[]>([]);
    const [controleurs, setControleurs] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [equipes, setEquipes] = useState<any[]>([]);
    const [selectedUniteId, setSelectedUniteId] = useState<number | null>(null);

    const [page, setPage] = useState(1);
    const limit = 20;

    const [loadForm, setLoadForm] = useState({
        provinceId: "",
        controleurId: "",
        equipeId: "",
    });

    /* ========================= FORM ========================= */

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        reset: resetEdit,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    /* ========================= LOAD DATA ========================= */

    useEffect(() => {
        fetchData();



        const loadData = async () => {
            try {

                const [prov, users, eq] = await Promise.all([
                    getMissions(),
                    getUsers(),
                    getEquipes()
                ]);

                setProvinces(prov);

                // filtre contrôleurs côté front
                setControleurs(
                    users.filter((u: any) => u.profile?.name === "CONTROLEUR")
                );

                setEquipes(eq);

            } catch (err) {
                console.error(err);
                toast.error("Erreur chargement données");
            }
        };

        loadData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        try {
            const data = await getUnites();

            setUnites(
                data.map((u: any) => ({
                    ...u,
                    signature: u.signature ?? undefined, // ✅ FIX IMPORTANT
                    equipeaf: u.equipeaf ?? undefined,
                }))
            );

        } finally {
            setLoading(false);
        }
    };

    

    useEffect(() => {
        fetchData();

    }, []);

    /* ========================= FILTER ========================= */

    const filtered = unites.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / limit);

    const paginated = filtered.slice(
        (page - 1) * limit,
        page * limit
    );

   


    const openEdit = (u: Unite) => {
        setEditingId(u.id);
        setEditModal(true);

        resetEdit({
            name: u.name,
            signature: u.signature || "",
            commandantId: u.commandant?.uuid || "",
        });
    };



    const onDelete = async (id: number) => {
        const res = await Swal.fire({
            title: "Supprimer ?",
            icon: "warning",
            showCancelButton: true,
        });

        if (res.isConfirmed) {
            await deleteUnite(id);
            toast.success("Supprimé");
            fetchData();
        }
    };

    /* ========================= UI ========================= */

    return (
        <DashboardLayout>

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div className="flex justify-between items-center">

                    <div>
                        <h1 className="text-2xl font-bold">
                            Unités
                        </h1>
                        <p className="text-sm opacity-70">
                            Gestion des unités
                        </p>
                    </div>

                    {/* <button
                        className="btn btn-primary"
                        onClick={() => setOpenModal(true)}
                    >
                        + Ajouter unité
                    </button> */}

                </div>

                {/* SEARCH */}
                <div className="card bg-base-200">

                    <div className="card-body">

                        <input
                            className="input input-bordered w-full"
                            placeholder="Recherche..."
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />

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
                                        <th>Nom</th>
                                        <th>Commandant</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {loading && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-10">
                                                <span className="loading loading-spinner"></span>
                                            </td>
                                        </tr>
                                    )}

                                    {!loading && paginated.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-10">
                                                <Search className="mx-auto opacity-50" />
                                                <p>Aucune unité</p>
                                            </td>
                                        </tr>
                                    )}

                                    {!loading && paginated.map((u) => (
                                        <tr key={u.id}>
                                            <td>{u.id}</td>
                                            <td>{u.name}</td>
                                            <td>{u.commandant?.name || "-"}</td>
                                       

                                            <td className="flex gap-2">
                                              
                                                    <button
                                                        className="btn btn-xs btn-info btn-outline"
                                                        onClick={() => {
                                                            setSelectedUniteId(u.id);
                                                            setLoadModal(true);
                                                        }}
                                                    >
                                                        Charger l’unité
                                                    </button>
                                                
                                            </td>

                                        </tr>
                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

                {/* PAGINATION */}
                {/* 📄 PAGINATION SIMPLE (PREV / NEXT ONLY) */}
                <div className="flex justify-between items-center">

                    <p className="text-sm opacity-70">
                        Page {page} / {totalPages || 1} — Total : {filtered.length} unités
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

            {/* CREATE MODAL */}
            {openModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

                    <div className="bg-base-100 p-5 rounded-xl w-96">

                        <h2 className="text-lg font-bold mb-3">
                            Ajouter unité
                        </h2>

                        <form className="space-y-2">

                            <input
                                className="input w-full"
                                placeholder="Nom"
                                {...register("name")}
                            />

                            <select
                                className="select w-full"
                                {...register("commandantId")}
                            >
                                <option value="">Commandant</option>
                                {persons.map(p => (
                                    <option key={p.uuid} value={p.uuid}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>

                            <button className="btn btn-primary w-full">
                                Créer
                            </button>

                        </form>

                    </div>

                </div>
            )}

            {/* EDIT MODAL */}
            {editModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

                    <div className="bg-base-100 p-5 rounded-xl w-96">

                        <h2 className="text-lg font-bold mb-3">
                            Modifier unité
                        </h2>

                        <form className="space-y-2">

                            <input
                                className="input w-full"
                                {...registerEdit("name")}
                            />

                            <select
                                className="select w-full"
                                {...registerEdit("commandantId")}
                            >
                                <option value="">Commandant</option>
                                {persons.map(p => (
                                    <option key={p.uuid} value={p.uuid}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>

                            <button className="btn btn-primary w-full">
                                Modifier
                            </button>

                        </form>

                    </div>

                </div>
            )}

            {loadModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                    <div className="bg-base-100 p-10 rounded-2xl w-full max-w-5xl space-y-7 shadow-2xl">

                        <h2 className="text-2xl font-bold">
                            Charger l’unité
                        </h2>

                        {/* GRID FORM */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                            {/* PROVINCE */}
                            <div className="form-control space-y-3">

                                <label className="label">
                                    <span className="label-text font-semibold">
                                        Province
                                    </span>
                                </label>

                                <Select
                                    placeholder="Choisir une province"
                                    value={
                                        provinces
                                            .map((p: any) => ({
                                                value: p.id,
                                                label: p.zone,
                                            }))
                                            .find((opt: any) => opt.value == loadForm.provinceId)
                                    }
                                    unstyled
                                    isSearchable
                                    classNames={selectStyles}
                                    options={provinces.map((p: any) => ({
                                        value: p.id,
                                        label: p.zone,
                                    }))}
                                    onChange={(opt: any) =>
                                        setLoadForm({
                                            ...loadForm,
                                            provinceId: opt?.value,
                                        })
                                    }
                                />

                            </div>

                            {/* CONTRÔLEUR */}
                            <div className="form-control space-y-3">

                                <label className="label">
                                    <span className="label-text font-semibold">
                                        Contrôleur
                                    </span>
                                </label>

                                <Select
                                    placeholder="Choisir un contrôleur"
                                    unstyled
                                    isSearchable
                                    classNames={selectStyles}
                                    options={controleurs.map((u: any) => ({
                                        value: u.id,
                                        label: u.noms || u.username,
                                    }))}
                                    onChange={(opt: any) =>
                                        setLoadForm({
                                            ...loadForm,
                                            controleurId: opt?.value,
                                        })
                                    }
                                />

                            </div>

                            {/* ÉQUIPE */}
                            <div className="form-control space-y-3">

                                <label className="label">
                                    <span className="label-text font-semibold">
                                        Équipe
                                    </span>
                                </label>

                                <Select
                                    placeholder="Choisir une équipe"
                                    unstyled
                                    isSearchable
                                    classNames={selectStyles}
                                    options={equipes.map((e: any) => ({
                                        value: e.id,
                                        label: 'EQUIPE-' + e.user?.noms || e.user?.username,
                                    }))}
                                    onChange={(opt: any) =>
                                        setLoadForm({
                                            ...loadForm,
                                            equipeId: opt?.value,
                                        })
                                    }
                                />

                            </div>

                        </div>

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-4 pt-6 border-t border-base-300">

                            <button
                                className="btn btn-outline"
                                onClick={() => setLoadModal(false)}
                            >
                                Annuler
                            </button>

                            <button
                                className="btn btn-primary"
                                disabled={saving}
                                onClick={async () => {
                                    setSaving(true);

                                    try {

                                        if (!selectedUniteId) {
                                            toast.error("Unité invalide");
                                            return;
                                        }

                                        if (!loadForm.provinceId || !loadForm.controleurId || !loadForm.equipeId) {
                                            toast.error("Tous les champs sont obligatoires");
                                            return;
                                        }

                                        await chargerUnite({
                                            uniteId: selectedUniteId,
                                            missionId: Number(loadForm.provinceId),
                                            equipeId: Number(loadForm.equipeId),
                                            userId: Number(loadForm.controleurId),
                                        });

                                     

                                        confetti({
                                            particleCount: 120,
                                            spread: 80,
                                            origin: { y: 0.6 },
                                        });
                                        toast.success("Unité chargée avec succès");

                                        setLoadModal(false);
                                        setLoadForm({
                                            provinceId: "",
                                            controleurId: "",
                                            equipeId: "",
                                        });

                                        fetchData();

                                    } catch (err: any) {
                                        console.error(err);

                                        let message = "Erreur serveur";

                                        const data = err?.response?.data;

                                        if (typeof data === "string") {
                                            message = data;
                                        } else if (data?.message) {
                                            message = data.message;
                                        } else if (err?.message) {
                                            message = err.message;
                                        }

                                        toast.error(message);

                                    } finally {
                                        setSaving(false); // 🔥 TOUJOURS exécuté
                                    }
                                }}
                            >
                                {saving ? "Chargement..." : "Ajouter"}
                            </button>

                        </div>

                    </div>

                </div>
            )
            }

        </DashboardLayout >
    );
}