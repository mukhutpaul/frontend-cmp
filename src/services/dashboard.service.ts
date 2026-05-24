import { api } from "@/lib/axios";
import type { DashboardStats } from "@/types/dashboard.types";

/**
 * =========================
 * DASHBOARD STATS (profil + user)
 * =========================
 */
export const getDashboardStats = async (
  profile: string,
  userId: number
): Promise<DashboardStats> => {
  try {
    const res = await api.get<DashboardStats>("/dashboard/stats", {
      params: {
        profile,
        userId,
      },
    });

    console.log("DASHBOARD API RESPONSE:", res.data);

    return res.data;
  } catch (error) {
    console.error("Dashboard API error:", error);
    throw error;
  }
};