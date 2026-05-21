"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useEffect, useState } from "react";
import Select from "react-select";
import { Search } from "lucide-react";
import { toast } from "react-toastify";

import { getPoliciers } from "@/services/policier.service";
import { getUnites } from "@/services/unite.service";

/* ========================= TYPES ========================= */

type Unite = {
    id: number;
    name: string;
};

type Policier = {
    id: number;
    matricule: string;
    lastname: string;
    postname: string;
    firstnames: string;
    unit:string;
    gender: string;
    telephone?: string;
};

/* ========================= SELECT STYLE ========================= */

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

export default function PolicierPage() {

    const [unites, setUnites] = useState<Unite[]>([]);
    const [policiers, setPoliciers] = useState<Policier[]>([]);

    const [search, setSearch] = useState("");
    const [selectedUnite, setSelectedUnite] = useState<number | null>(null);

    const [page, setPage] = useState(0);
    const size = 100;

    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    /* ========================= LOAD ========================= */

    const loadData = async () => {
        try {
            setLoading(true);

            const res = await getPoliciers({
                page,
                size,
                search,
                uniteId: selectedUnite ?? undefined,
            });

            // backend Spring Page<>
            setPoliciers(res.content);
            setTotalPages(res.totalPages);

        } catch (err) {
            toast.error("Erreur chargement policiers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [page, search, selectedUnite]);

    useEffect(() => {
        const loadUnites = async () => {
            try {
                const uni = await getUnites();
                setUnites(uni);
            } catch {
                toast.error("Erreur chargement unités");
            }
        };

        loadUnites();
    }, []);

    /* ========================= UI ========================= */

    return (
        <DashboardLayout>

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Policiers</h1>
                    <p className="text-sm opacity-70">
                        Liste paginée des policiers
                    </p>
                </div>

                {/* FILTERS */}
                <div className="card bg-base-200">

                    <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* SEARCH */}
                        <input
                            className="input input-bordered w-full"
                            placeholder="Recherche (nom, matricule...)"
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                        />

                        {/* UNITE FILTER */}
                        <Select
                            placeholder="Filtrer par unité"
                            unstyled
                            isClearable
                            classNames={selectStyles}
                            options={unites.map((u) => ({
                                value: u.id,
                                label: u.name,
                            }))}
                            onChange={(opt: any) => {
                                setSelectedUnite(opt?.value || null);
                                setPage(0);
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
                                        <th>Matricule</th>
                                        <th>Nom</th>
                                        <th>Postnom</th>
                                        <th>Prénom</th>
                                        <th>Unité</th>
                                        <th>Sexe</th>
                                        <th>Téléphone</th>
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

                                    {!loading && policiers.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-10">
                                                <Search className="mx-auto opacity-50" />
                                                <p>Aucun policier trouvé</p>
                                            </td>
                                        </tr>
                                    )}

                                    {!loading && policiers.map((p) => (
                                        <tr key={p.id}>
                                            <td>{p.matricule}</td>
                                            <td>{p.lastname}</td>
                                            <td>{p.postname}</td>
                                            <td>{p.firstnames}</td>
                                            <td>{p.unit}</td>
                                            <td>{p.gender}</td>
                                            <td>{p.telephone || "-"}</td>
                                        </tr>
                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

                {/* PAGINATION */}
                <div className="flex justify-between items-center">

                    <p className="text-sm opacity-70">
                        Page {page + 1} / {totalPages || 1}
                    </p>

                    <div className="join">

                        <button
                            className="join-item btn btn-sm"
                            disabled={page === 0}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            « Précédent
                        </button>

                        <button
                            className="join-item btn btn-sm"
                            disabled={page + 1 >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Suivant »
                        </button>

                    </div>

                </div>

            </div>

        </DashboardLayout>
    );
}