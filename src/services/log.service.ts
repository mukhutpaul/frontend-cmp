import { api } from "@/lib/axios";

/**
 * =========================
 * TYPES
 * =========================
 */

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type LogUser = {
  id: string;
  action: string;
  createdAt: string;
  username: string;
  noms: string;
};

/**
 * =========================
 * LOGS METHODS
 * =========================
 */

/**
 * Récupérer tous les logs
 */
export const getLogs = async (): Promise<LogUser[]> => {
  const res = await api.get<LogUser[]>("/logs");
  return res.data;
};

/**
 * Récupérer les logs d'un utilisateur
 */
export const getLogsByUser = async (
  userId: number
): Promise<LogUser[]> => {
  const res = await api.get<ApiResponse<LogUser[]>>(
    `/logs/user/${userId}`
  );

  return res.data.data;
};