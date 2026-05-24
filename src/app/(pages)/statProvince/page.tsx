"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BarChart3, Users, Shield, CheckCircle, XCircle, Activity } from "lucide-react";
import { getStatMissions, StatMission } from "@/services/stats.service";

export default function StatProvincePage() {

    const [data, setData] = useState<StatMission[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await getStatMissions();
            setData(res);
        } catch (error) {
            console.error(error);
            toast.error("Erreur chargement statistiques");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // GROUP BY ZONE (PROVINCE)
    const grouped = data.reduce((acc: any, curr) => {

        const zone = curr.zone;

        if (!acc[zone]) {
            acc[zone] = {
                zone,
                missions: [],
                totalPoliciers: 0,
                totalEquipes: 0,
                totalControles: 0,
                presents: 0,
                justifies: 0,
                nonJustifies: 0,
            };
        }

        acc[zone].missions.push(curr);

        acc[zone].totalPoliciers += curr.totalPoliciers;
        acc[zone].totalEquipes += curr.totalEquipes;
        acc[zone].totalControles += curr.totalControles;
        acc[zone].presents += curr.presents;
        acc[zone].justifies += curr.justifies;
        acc[zone].nonJustifies += curr.nonJustifies;

        return acc;

    }, {});

    const provinces = Object.values(grouped);

    return (
        <DashboardLayout>

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold">Statistiques par Province</h1>
                    <p className="text-sm opacity-70">
                        Vue globale des missions et effectifs par zone
                    </p>
                </div>

                {/* LOADING */}
                {loading && (
                    <div className="flex justify-center py-10">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                )}

                {/* CONTENT */}
                {!loading && (
                    <div className="space-y-6">

                        {provinces.map((p: any) => (

                            <div
                                key={p.zone}
                                className="card bg-base-100 shadow-md border border-base-300"
                            >

                                <div className="card-body">

                                    {/* HEADER PROVINCE */}
                                    <div className="flex justify-between items-center">

                                        <h2 className="text-xl font-bold">
                                            📍 {p.zone}
                                        </h2>

                                        <span className="badge badge-primary">
                                            {p.missions.length} missions
                                        </span>

                                    </div>

                                    {/* STATS GRID */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">

                                        <div className="stat bg-base-200 rounded-xl">
                                            <div className="stat-title">Policiers</div>
                                            <div className="stat-value text-primary flex items-center gap-2">
                                                <Users size={18} />
                                                {p.totalPoliciers}
                                            </div>
                                        </div>

                                        <div className="stat bg-base-200 rounded-xl">
                                            <div className="stat-title">Équipes</div>
                                            <div className="stat-value flex items-center gap-2">
                                                <Shield size={18} />
                                                {p.totalEquipes}
                                            </div>
                                        </div>

                                        <div className="stat bg-base-200 rounded-xl">
                                            <div className="stat-title">Contrôles</div>
                                            <div className="stat-value text-info flex items-center gap-2">
                                                <Activity size={18} />
                                                {p.totalControles}
                                            </div>
                                        </div>

                                        <div className="stat bg-base-200 rounded-xl">
                                            <div className="stat-title">Présents</div>
                                            <div className="stat-value text-success flex items-center gap-2">
                                                <CheckCircle size={18} />
                                                {p.presents}
                                            </div>
                                        </div>

                                        <div className="stat bg-base-200 rounded-xl">
                                            <div className="stat-title">Non justifiés</div>
                                            <div className="stat-value text-error flex items-center gap-2">
                                                <XCircle size={18} />
                                                {p.nonJustifies}
                                            </div>
                                        </div>

                                    </div>

                                    {/* MISSIONS LIST */}
                                    <div className="mt-5">

                                        <h3 className="font-semibold mb-2">
                                            Missions
                                        </h3>

                                        <div className="space-y-2">

                                            {p.missions.map((m: StatMission) => (

                                                <div
                                                    key={m.id}
                                                    className="flex justify-between items-center bg-base-200 p-3 rounded-xl"
                                                >

                                                    <div>
                                                        <p className="font-semibold">
                                                            {m.numero} - {m.mission}
                                                        </p>
                                                        <p className="text-xs opacity-60">
                                                            {m.zone}
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-2 text-xs">

                                                        <span className="badge">
                                                            👮 {m.totalPoliciers}
                                                        </span>

                                                        <span className="badge badge-info">
                                                            🧑‍✈️ {m.totalEquipes}
                                                        </span>

                                                        <span className="badge badge-success">
                                                            ✔ {m.presents}
                                                        </span>

                                                    </div>

                                                </div>

                                            ))}

                                        </div>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>
                )}

            </div>

        </DashboardLayout>
    );
}