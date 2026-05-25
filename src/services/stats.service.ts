import { api } from "@/lib/axios";

/* ========================= TYPES ========================= */

export interface StatMission {
    id: number;
    mission: string;
    numero: string;
    zone: string;

    totalPoliciers: number;
    totalControles: number;
    presents: number;
    justifies: number;
    nonJustifies: number;
    totalEquipes: number;
    totalUnites: number;
}

export interface StatEquipe {
    equipeId: number;
    equipe: string;

    missionNumero: string;
    zone: string;

    totalPoliciers: number;
    totalControles: number;
    presents: number;
    justifies: number;
    nonJustifies: number;
    totalUnites: number;
}

/* ========================= STATISTIQUES ========================= */

export const getStatMissions = async () => {
    const res = await api.get<StatMission[]>("/stats/missions");
    return res.data;
};

export const getStatEquipes = async () => {
    const res = await api.get<StatEquipe[]>("/stats/equipes");
    return res.data;
};

export const getStatDashboard = async () => {
    const res = await api.get<{
        missions: StatMission[];
        equipes: StatEquipe[];
    }>("/stats/dashboard");

    return res.data;
};