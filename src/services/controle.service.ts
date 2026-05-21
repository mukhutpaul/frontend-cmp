import { api } from "@/lib/axios";

/* ========================= TYPES ========================= */

export interface Profile {
    id: number;
    name: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
    noms: string;
    profile: Profile;
}

export interface Mission {
    id: number;
    zone: string;
    numero: string;
    dateDebut: string;
    dateFin: string;
    isActive: boolean;
    chargeMission: User;
}

export interface Seance {
    id: string;
    dateSeance: string;
    dateFin: string;
    isActive: boolean;
    chefEquipe: User;
    mission: Mission;
}


type Policier = {
    id: string;
    matricule: string;
    lastname: string;
    postname: string;
    firstnames: string;
    gender?: string;
    birthDate?: string;
    lieu?: string;
    groupeSanguin?: string; // ✅ AJOUT
    chefEquipe?: string;
    rank?: string;
};

export type Controle = {
    id: string;
    uid?: string;

    policier?: Policier;

    matricule?: string;
    noms?: string;
    unite?: string;
    grade?: string;
    chargeMission?: User;
    chefEquipe: User;
    controleur: User;
    seance : Seance;
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