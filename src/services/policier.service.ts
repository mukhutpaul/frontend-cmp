import { api } from "@/lib/axios";

export type Policier = {
    id: string;
    matricule: string;
    lastname: string;
    postname: string;
    firstnames: string;
    gender: string;
    telephone?: string;
    birthDate:string;
    bloodtype:string;
  
};

type GetPoliciersParams = {
    page: number;
    size: number;
    search?: string;
    uniteId?: number;
};


type SearchIdentiteParams = {
    lastname: string;
    postname: string;
    firstname: string;
    birthDate: string; // format YYYY-MM-DD recommandé
};

export const getPolicierByIdentite = async (
    params: SearchIdentiteParams
): Promise<Policier> => {

    const res = await api.get("/policiers/identite", {
        params,
    });

    return res.data;
};

export const getPoliciers = async () => {
    const res = await api.get("/policiers");
    return res.data;
};

/* ========================= GET BY MATRICULE ========================= */

export const getPolicierByMatricule = async (
    matricule: string
): Promise<Policier> => {

    const res = await api.get(
        `/policiers/matricule/${matricule}`
    );

    return res.data;
};