import { api } from "@/lib/axios";

/* ========================= TYPES ========================= */

export interface SyncStats {
    sessions: number;
    seances: number;

    controlesPresence: number;
    controlesJustifies: number;
    controlesAbsence: number;

    documents: number;
    fichiers: number;

    total: number;
    seanceActive: boolean;
}

/* ========================= GET SYNC STATS ========================= */

export const getSyncStats = async (seanceId: string, active: boolean): Promise<SyncStats> => {
    const res = await api.get<SyncStats>(
        `/api_pc_central/sync/stats/${seanceId}`,
        {
            params: {
                active
            }
        }
    );

    return res.data;
};