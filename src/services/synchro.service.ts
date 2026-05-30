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
export const getSyncStats = async (): Promise<SyncStats> => {
    const res = await api.get<SyncStats>(
        "/stats"
    );

    return res.data;
};

export const runSyncBatch = async () => {
    const res = await api.post("/run");
    return res.data;
};