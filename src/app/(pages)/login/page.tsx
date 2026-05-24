"use client";

import { useEffect, useState } from "react";
import { Lock, Server, Wifi } from "lucide-react";

import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

import { logindistant } from "@/services/pc-sync.service";
import { loginRequest } from "@/services/auth.service";
import Swal from "sweetalert2";
import confetti from "canvas-confetti";

type LoginForm = {
    username: string;
    password: string;
};

export const launchConfetti = () => {

    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const colors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626"];

    const frame = () => {

        confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors
        });

        confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors
        });

        if (Date.now() < animationEnd) {
            requestAnimationFrame(frame);
        }
    };

    frame();
};

const openServerConfig = async () => {
    const { value: formValues } = await Swal.fire({
        title: "Configuration serveur",
        html: `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <input id="swal-ip" class="swal2-input" placeholder="Adresse IP (ex: 192.168.1.10)" />
                <input id="swal-port" class="swal2-input" placeholder="Port (ex: 8080)" />
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Enregistrer",
        preConfirm: () => {
            const ip = (document.getElementById("swal-ip") as HTMLInputElement)?.value;
            const port = (document.getElementById("swal-port") as HTMLInputElement)?.value;

            if (!ip || !port) {
                Swal.showValidationMessage("IP et PORT sont obligatoires");
                return;
            }

            return { ip, port };
        }
    });

    if (formValues) {
        localStorage.setItem("server_ip", formValues.ip);
        localStorage.setItem("server_port", formValues.port);

        await Swal.fire({
            icon: "success",
            title: "Serveur configuré",
            text: `${formValues.ip}:${formValues.port}`,
            timer: 1500,
            showConfirmButton: false
        });
    }
};

export default function LoginPage() {
    const [mode, setMode] = useState<"local" | "remote">("local");
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const { register, handleSubmit } = useForm<LoginForm>();



    // restore mode
    useEffect(() => {
        const savedMode = localStorage.getItem("mode") as "local" | "remote";
        if (savedMode) setMode(savedMode);
    }, []);

    const onSubmit = async (data: LoginForm) => {
        try {
            setLoading(true);

            toast.info(
                `Connexion ${mode === "local" ? "locale" : "distante"} en cours...`
            );

            localStorage.setItem("mode", mode);

            // =========================
            // MODE LOCAL
            // =========================
            if (mode === "local") {
                const response = await loginRequest(data);

                if (!response?.token) {
                    throw new Error("Token invalide");
                }

                localStorage.setItem("token", response.token);
                localStorage.setItem("username", response.username ?? "");
                localStorage.setItem("profile", response.profile ?? "");
                localStorage.setItem("noms", response.noms ?? "");
                localStorage.setItem("user", JSON.stringify(response.user));

                toast.success("Connexion locale réussie");
                launchConfetti()
                router.push("/dashboard");
                return;
            }

            // =========================
            // MODE REMOTE
            // =========================
            if (mode === "remote") {
                try {
                    const syncResponse = await logindistant(
                        data.username,
                        data.password
                    );

                    console.log("REMOTE OK:", syncResponse);

                    localStorage.setItem("username", syncResponse.username ?? "");
                    localStorage.setItem("user", JSON.stringify(syncResponse.user));
                    localStorage.setItem("profile", syncResponse.profile ?? "");
                    localStorage.setItem("noms", syncResponse.noms ?? "");

                    // =========================
                    // SWEETALERT SUCCESS
                    // =========================
                    await Swal.fire({
                        icon: "success",
                        title: "Connexion distante réussie",
                        text: "Chargement des données en cours...",
                        timer: 1500,
                        showConfirmButton: false
                    });

                    launchConfetti();
                    // router.push("/dashboard");
                    return;

                } catch (remoteError: any) {
                    console.error("REMOTE FAILED:", remoteError);

                    await Swal.fire({
                        icon: "error",
                        title: "Erreur de connexion distante",
                        text:
                            remoteError?.response?.status === 401
                                ? "Identifiants invalides"
                                : "Impossible de charger les données"
                    });

                    toast.error("Erreur connexion distante");

                    return;
                }
            }
        } catch (error: any) {
            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Erreur de connexion"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
            <div className="card w-full max-w-md shadow-2xl bg-base-100">
                <div className="card-body">

                    {/* HEADER */}
                    {/* HEADER AVEC SYMBOLES OFFICIELS */}
                    <div className="mb-6">

                        <div className="flex items-center justify-between">

                            {/* ARMES RDC - GAUCHE */}
                            <img
                                src="/aba.png"
                                alt="Armoiries RDC"
                                onClick={() => {

                                    // 🧹 Nettoyage configuration serveur
                                    localStorage.removeItem("server_ip");
                                    localStorage.removeItem("server_port");

                                    // ✅ Notification
                                    toast.success("Configuration serveur supprimée");

                                    // 🔄 Refresh optionnel
                                    window.location.reload();
                                }}
                                className="w-12 h-12 object-contain opacity-90 cursor-pointer hover:scale-110 transition-transform duration-200"
                            />

                            {/* CENTRE - LOGO PNC + TITRE */}
                            <div className="text-center flex-1 space-y-2">



                                <h1 className="text-2xl font-bold text-primary tracking-widest">
                                    ABA-CM PNC
                                </h1>

                                <p className="text-xs opacity-60 uppercase tracking-wide">
                                    Authentification sécurisée du système
                                </p>

                            </div>

                            {/* PNC - DROITE */}
                            <img
                                src="/pnc.png"
                                alt="PNC"
                                onClick={openServerConfig}
                                className="w-12 h-12 object-contain opacity-90 cursor-pointer hover:scale-110 transition-transform duration-200"
                            />

                        </div>

                    </div>

                    {/* MODE */}
                    <div className="flex gap-2 mb-5">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => setMode("local")}
                            className={`btn btn-sm flex-1 ${mode === "local"
                                ? "btn-primary"
                                : "btn-outline"
                                }`}
                        >
                            <Server size={16} />
                            Local
                        </button>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => setMode("remote")}
                            className={`btn btn-sm flex-1 ${mode === "remote"
                                ? "btn-primary"
                                : "btn-outline"
                                }`}
                        >
                            <Wifi size={16} />
                            Distant
                        </button>
                    </div>

                    {/* FORM */}
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        {/* USERNAME */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">
                                    Nom d'utilisateur
                                </span>
                            </label>

                            <input
                                type="text"
                                disabled={loading}
                                {...register("username", { required: true })}
                                className="input input-bordered w-full"
                                placeholder="Entrer votre identifiant"
                            />
                        </div>

                        {/* PASSWORD */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">
                                    Mot de passe
                                </span>
                            </label>

                            <input
                                type="password"
                                disabled={loading}
                                {...register("password", { required: true })}
                                className="input input-bordered w-full"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* MODE INFO */}
                        <div className="text-xs opacity-60 flex items-center gap-2 mt-2">
                            <Lock size={14} />
                            <span>Mode actif :</span>
                            <span className="font-semibold">
                                {mode === "local"
                                    ? "Serveur local"
                                    : "Serveur central"}
                            </span>
                        </div>

                        {/* BUTTON */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full mt-4"
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Connexion...
                                </>
                            ) : (
                                "Se connecter"
                            )}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}