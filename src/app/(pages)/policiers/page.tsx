"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Search } from "lucide-react";
import { toast } from "react-toastify";

import { getPoliciers } from "@/services/policier.service";
import { getUnites } from "@/services/unite.service";

/* ========================= TYPES ========================= */

type Unite = {
    id: number;
    name: string;
    mainUnit?: string;
};

type Policier = {
    id: number;
    matricule: string;
    lastname: string;
    postname: string;
    firstnames: string;
    unit: string;
    mainUnit?: string;
    gender: string;
    telephone?: string;
};

/* ========================= CONSTANTES ========================= */

const PAGE_SIZE = 40;

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
    const [selectedMainUnit, setSelectedMainUnit] = useState<string | null>(null);

    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(false);

    /* ========================= LOAD ========================= */

    const loadData = async () => {
        try {
            setLoading(true);

            const res = await getPoliciers();

            setPoliciers(Array.isArray(res) ? res : []);

        } catch (err) {
            console.error(err);
            toast.error("Erreur chargement policiers");
            setPoliciers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const loadUnites = async () => {
            try {
                const uni = await getUnites();
                setUnites(Array.isArray(uni) ? uni : []);
            } catch {
                toast.error("Erreur chargement unités");
            }
        };

        loadUnites();
    }, []);

    /* ========================= MAIN UNITS ========================= */

    const mainUnits = useMemo(() => {
        return [...new Set(
            policiers
                .map((p) => p.mainUnit)
                .filter(Boolean)
        )];
    }, [policiers]);

    /* ========================= FILTER ========================= */

    const filteredPoliciers = useMemo(() => {

        return policiers.filter((p) => {

            const fullText =
                `${p.lastname} ${p.postname} ${p.firstnames} ${p.matricule}`
                    .toLowerCase();

            const matchSearch =
                fullText.includes(search.toLowerCase());

            const matchUnite =
                !selectedUnite ||
                p.unit ===
                unites.find((u) => u.id === selectedUnite)?.name;

            const matchMainUnit =
                !selectedMainUnit ||
                p.mainUnit === selectedMainUnit;

            return (
                matchSearch &&
                matchUnite &&
                matchMainUnit
            );
        });

    }, [
        policiers,
        search,
        selectedUnite,
        selectedMainUnit,
        unites
    ]);

    /* ========================= PAGINATION ========================= */

    const totalPages = Math.ceil(
        filteredPoliciers.length / PAGE_SIZE
    );

    const paginatedPoliciers = useMemo(() => {

        const start = (page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;

        return filteredPoliciers.slice(start, end);

    }, [filteredPoliciers, page]);

    /* reset page on filters */
    useEffect(() => {
        setPage(1);
    }, [search, selectedUnite, selectedMainUnit]);

    /* ========================= UI ========================= */

    return (
        <DashboardLayout>

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">
                        Policiers
                    </h1>

                    <p className="text-sm opacity-70">
                        {filteredPoliciers.length} élément(s) trouvé(s)
                    </p>
                </div>

                {/* FILTERS */}
                <div className="card bg-base-200">

                    <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* SEARCH */}
                        <input
                            className="input input-bordered w-full"
                            placeholder="Recherche (nom, matricule...)"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                            }}
                        />

                        {/* UNITE */}
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
                            }}
                        />

                        {/* MAIN UNIT */}
                        <Select
                            placeholder="Filtrer par mainUnit"
                            unstyled
                            isClearable
                            classNames={selectStyles}
                            options={mainUnits.map((m) => ({
                                value: m,
                                label: m,
                            }))}
                            onChange={(opt: any) => {
                                setSelectedMainUnit(opt?.value || null);
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
                                        <th>Main Unit</th>
                                        <th>Sexe</th>
                                        <th>Téléphone</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {loading && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="text-center py-10"
                                            >
                                                <span className="loading loading-spinner"></span>
                                            </td>
                                        </tr>
                                    )}

                                    {!loading &&
                                        paginatedPoliciers.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="text-center py-10"
                                                >
                                                    <Search className="mx-auto opacity-50" />
                                                    <p>
                                                        Aucun policier trouvé
                                                    </p>
                                                </td>
                                            </tr>
                                        )}

                                    {!loading &&
                                        paginatedPoliciers.map((p) => (
                                            <tr key={p.id}>
                                                <td>{p.matricule}</td>
                                                <td>{p.lastname}</td>
                                                <td>{p.postname}</td>
                                                <td>{p.firstnames}</td>
                                                <td>{p.unit}</td>
                                                <td>{p.mainUnit || "-"}</td>
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
                        Page {page} / {totalPages || 1}
                    </p>

                    <div className="join">

                        <button
                            className="join-item btn btn-sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            « Précédent
                        </button>

                        <button
                            className="join-item btn btn-sm"
                            disabled={page >= totalPages}
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