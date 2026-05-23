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
    dateFin?: string;
    isActive: boolean;
    chargeMission: User;
}

export interface Seance {
    id: string;
    dateSeance: string;
    dateFin?: string;
    isActive: boolean;
    chefEquipe: User;
    mission: Mission;
}

/* ========================= DOCUMENT ========================= */

export interface Document {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
}

/* ========================= CONTROLE ========================= */

export interface Controle {

    id: string;
    uid: string;

    matricule: string;
    noms: string;
    unite: string;

    grade?: string;

    present: boolean;
    justifie: boolean;

    pkPhoto?: string;
    photoUrl?: string;

    /* 🔥 FIX IMPORTANT */
    documents?: Document[];

    policier?: {
        lastname?: string;
        postname?: string;
        firstnames?: string;
        gender?: string;
        bloodtype?: string;
        birthDate?: string;
        lieu?: string;
    };

    equipe?: {
        site?: string;
    };

    chefEquipe?: {
        username?: string;
    };

    seance?: {
        mission?: {
            zone?: string;
        };
    };
}

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