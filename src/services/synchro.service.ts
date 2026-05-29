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
        `/api/sync/stats/${seanceId}`,
        {
            params: {
                active
            }
        }
    );

    return res.data;
};


export const runSyncBatch = async (
    payload: any,
    files: File[] = []
) => {

    const formData = new FormData();

    formData.append(
        "data",
        new Blob([JSON.stringify(payload)], {
            type: "application/json"
        })
    );

    files.forEach((file) => {
        formData.append("files", file);
    });

    const res = await api.post(
        "api_pc_central/sync/batch",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    );

    return res.data;
};