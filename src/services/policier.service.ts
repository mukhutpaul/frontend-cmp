import { api } from "@/lib/axios";

export type Policier = {
    id: string;
    matricule: string;
    nom: string;
    postnom: string;
    prenom: string;
    sexe: string;
    telephone?: string;
    email?: string;
    statut: string;
    dateNaissance:string;
    groupeSanguin:string;
  
};

type GetPoliciersParams = {
    page: number;
    size: number;
    search?: string;
    uniteId?: number;
};


type SearchIdentiteParams = {
    nom: string;
    postnom: string;
    prenom: string;
    dateNaissance: string; // format YYYY-MM-DD recommandé
};

export const getPolicierByIdentite = async (
    params: SearchIdentiteParams
): Promise<Policier> => {

    const res = await api.get("/policiers/identite", {
        params,
    });

    return res.data;
};

export const getPoliciers = async (params: GetPoliciersParams) => {
    const res = await api.get("/policiers", {
        params,
    });

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