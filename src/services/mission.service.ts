import { api } from "@/lib/axios";

/**
 * TYPES
 */
export type Mission = {
    id: number;
    dateDebut: string | null;
    dateFin: string | null;
    zone: string;
    numero: string;
    isActive: boolean;

    chargeMission?: {
        id: number;
        username?: string;
        noms?: string;
    };
};

/**
 * CREATE PAYLOAD
 */
export type CreateMissionPayload = {
    zone: string;
    numero: string;

    chargeMission: {
        id: number;
    };
};

/**
 * UPDATE PAYLOAD
 */
export type UpdateMissionPayload = {
    zone?: string;
    numero?: string;
    isActive : boolean;

    chargeMission?: {
        id: number;
    };
};

/**
 * GET ALL MISSIONS
 */
export const getMissions = async (): Promise<Mission[]> => {
    const res = await api.get("/missions");
    return res.data;
};

/**
 * GET UNITES BY MISSION
 */
export const getUnitesByMission = async (
    missionId: number
) => {
    const res = await api.get(
        `/mission-unites/${missionId}/unites`
    );

    return res.data;
};

/**
 * CREATE MISSION
 */
export const createMission = async (
    data: CreateMissionPayload
) => {
    const payload = {
        ...data,
        isActive: false,
        dateDebut: null,
        dateFin: null,
    };

    console.log("MISSION PAYLOAD:", payload);

    const res = await api.post("/missions", payload);

    return res.data;
};

/**
 * UPDATE MISSION
 */
export const updateMission = async (
    id: number,
    data: UpdateMissionPayload
) => {

    const res = await api.patch(
        `/missions/${id}`,
        data
    );

    return res.data;
};

/**
 * START MISSION
 */
export const startMission = async (id: number) => {
    const res = await api.put(
        `/missions/${id}/start`
    );

    return res.data;
};

/**
 * CLOSE MISSION
 */
export const closeMission = async (id: number) => {
    const res = await api.put(
        `/missions/${id}/close`
    );

    return res.data;
};

/**
 * DELETE MISSION
 */
export const deleteMission = async (id: number) => {
    const res = await api.delete(
        `/missions/${id}`
    );

    return res.data;
};

/**
 * DELETE EQUIPE UNITE
 */
/**
 * DELETE MISSION UNITE
 */
export const deleteMissionUnite = async (
    id: number
): Promise<string> => {

    const res = await api.delete(
        `/mission-unites/${id}`
    );

    return res.data;
};