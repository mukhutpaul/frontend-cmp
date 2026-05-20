import { api } from "@/lib/axios";

/* ========================= TYPES ========================= */

type Policier = {
    id: string;
    matricule: string;
    nom: string;
    postnom: string;
    prenom: string;
    sexe?: string;
    dateNaissance?: string;
    lieuNaissance?: string;
    groupeSanguin?: string; // ✅ AJOUT
    chefEquipe?: string;
};

export type Controle = {
    id: string;
    uid?: string;

    policier?: Policier;

    matricule?: string;
    noms?: string;
    unite?: string;
    grade?: string;
    chargeMission?: string;
    chefEquipe: string;
    controleur: string;
    seance : string;
    present?: boolean;
    justifie?: boolean;

    situation?: string;
    status?: string;

    isActif?: boolean;
    createdAt?: string;
};

/* ========================= PAGINATION RESPONSE ========================= */



export type PageResponse<T> = {
    content: T[];
    totalPages: number;
    totalElements: number;
};

export const getControles = async () => {
    const res = await api.get<PageResponse<Controle>>("/controles")
    return res.data;
};

/* ========================= SEARCH BY IDENTITE ========================= */

export const searchControleByIdentite = async (params: {
    nom?: string;
    postnom?: string;
    prenom?: string;
    dateNaissance?: string; // format attendu: yyyy-MM-dd
}) => {
    const res = await api.get<Controle[]>("/controles/search/identite", {
        params: {
            nom: params.nom ?? "",
            postnom: params.postnom ?? "",
            prenom: params.prenom ?? "",
            dateNaissance: params.dateNaissance ?? "",
        },
    });

    return res.data;
};
/* ========================= GET BY ID ========================= */

export const getControleById = async (id: string) => {
    const res = await api.get<Controle>(`/controles/${id}`);
    return res.data;
};

/* ========================= CREATE ========================= */

export const createControle = async (data: Partial<Controle>) => {
    const res = await api.post("/controles", data);
    return res.data;
};

export const searchControleByMatricule = async (matricule: string) => {
    const res = await api.get<Controle>(`/controles/matricule/${matricule}`);
    return res.data;
};

/* ========================= UPDATE ========================= */

export const updateControle = async (id: string, data: Partial<Controle>) => {
    const res = await api.put(`/controles/${id}`, data);
    return res.data;
};

/* ========================= DELETE ========================= */

export const deleteControle = async (id: string) => {
    const res = await api.delete(`/controles/${id}`);
    return res.data;
};