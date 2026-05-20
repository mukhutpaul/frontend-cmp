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

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  id: number,
  username: string;
  email?: string;
  noms?: string;
  profile?: string;
  userId?: number;
  user: string;
};

export type User = {
  id: number;
  username: string;
  email: string;
  noms: string;
  user: string;
  profile?: {
    id: number;
    name: string;
  };
};

export type CreateUserPayload = {
  username: string;
  password: string;
  email: string;
  noms: string;
  profile?: {
    id: number;
  };
};

export type UpdateUserPayload = Partial<{
  username: string;
  email: string;
  noms: string;
  password: string;
  profileId: any;
}>;

/**
 * =========================
 * AUTH METHODS
 * =========================
 */

export const loginRequest = async (
  data: LoginPayload
): Promise<LoginResponse> => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

/**
 * =========================
 * CREATE USER
 * =========================
 */

export const createUser = async (
  data: CreateUserPayload
): Promise<User> => {

  const res = await api.post(
    "/auth/register",
    data
  );

  return res.data;
};

export const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("username");
  localStorage.removeItem("profile");
  localStorage.removeItem("mode");

  window.location.href = "/login";
};

export const saveSession = (data: LoginResponse): void => {
  localStorage.setItem("token", data.token);
  localStorage.setItem("id", String(data.id));
  localStorage.setItem("username", data.username);
  localStorage.setItem("profile", data.profile || "");
  localStorage.setItem("user", JSON.stringify(data));
};

export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

export const getCurrentUser = (): LoginResponse | null => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

/**
 * =========================
 * USERS METHODS
 * =========================
 */

export const getUsers = async (): Promise<User[]> => {
  const res = await api.get<ApiResponse<User[]>>("/auth/users");

  return res.data.data;
};

export const getUserById = async (id: number): Promise<User> => {
  const res = await api.get<ApiResponse<User>>(`/auth/users/${id}`);

  return res.data.data;
};

export const updateUser = async (
  id: number,
  data: UpdateUserPayload
): Promise<User> => {

  const res = await api.patch(`/auth/users/${id}`, data);

  return res.data.data;
};

export const deleteUser = async (id: number) => {
  const res = await api.delete(`/auth/users/${id}`);
  return res.data;
};

export const getUnitesByUser = async (userId: number) => {

  const res = await api.get(
    `/detail-unites/user/${userId}/unites`
  );

  return res.data;
};

export const deleteDetailUnite = async (id: number) => {
  const res = await api.delete(`/detail-unites/${id}`);
  return res.data;
};