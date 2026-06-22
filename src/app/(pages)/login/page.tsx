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
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";


type LoginForm = {
    username: string;
    password: string;
};

const launchConfetti = () => {

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
    const [date, setDate] = useState(new Date());



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
                localStorage.setItem("idUser", String(response.id));
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

                    const status = remoteError?.response?.status;

                    if (status === 401 || status === 403) {

                        await Swal.fire({
                            icon: "error",
                            title: "Connexion refusée",
                            html: `
                <div style="text-align:left">
                    <p><b>Identifiants invalides.</b></p>
                    <p>Le nom d'utilisateur ou le mot de passe est incorrect.</p>
                </div>
            `,
                            confirmButtonText: "Réessayer",
                            confirmButtonColor: "#dc2626",
                            allowOutsideClick: false
                        });

                        return;
                    }

                    await Swal.fire({
                        icon: "warning",
                        title: "Serveur inaccessible",
                        html: `
            <div style="text-align:left">
                <p>Impossible de joindre le serveur distant.</p>
                <p>Vérifiez :</p>
                <ul style="text-align:left">
                    <li>L'adresse IP</li>
                    <li>Le port configuré</li>
                    <li>La connexion réseau</li>
                </ul>
            </div>
        `,
                        confirmButtonText: "Fermer",
                        confirmButtonColor: "#f59e0b"
                    });
                }
            }
        } catch (error: any) {
            console.error(error);

            const status = error?.response?.status;

            if (status === 401 || status === 403) {

                await Swal.fire({
                    icon: "error",
                    title: "Échec de connexion",
                    html: `
                <div style="text-align:left">
                    <p><b>Nom d'utilisateur ou mot de passe incorrect.</b></p>
                    <p>Veuillez vérifier vos identifiants puis réessayer.</p>
                </div>
            `,
                    confirmButtonText: "Fermer",
                    confirmButtonColor: "#dc2626",
                    allowOutsideClick: false
                });

                return;
            }

            await Swal.fire({
                icon: "error",
                title: "Erreur",
                text:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Une erreur est survenue lors de la connexion.",
                confirmButtonText: "Fermer"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-base-200">

            <div className="grid h-full lg:grid-cols-[1.25fr_0.75fr]">

                {/* ================= LEFT PANEL ================= */}
                <div className="hidden lg:flex relative overflow-hidden bg-primary text-primary-content">

                    {/* glow background */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-secondary blur-3xl" />
                        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-accent blur-3xl" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-center w-full px-10 py-8">

                        {/* LOGO ANIMÉ */}
                        <img
                            src="/logo_pnc1.png"
                            alt="PNC"
                            className="
                            w-36
                            animate-float
                            drop-shadow-[0_0_25px_rgba(255,255,255,0.35)]
                            hover:scale-105
                            transition-transform
                            duration-500
                        "
                        />

                        {/* TITLE */}
                        <div className="mt-6 text-center">

                            <div className="badge badge-success badge-lg">
                                ● Système opérationnel
                            </div>

                            <h1 className="mt-5 text-5xl font-black">
                                ABA CONTROL MANAGER
                            </h1>

                            <h2 className="text-2xl font-bold opacity-90">
                                Contrôle des Effectifs Policiers
                            </h2>

                            <p className="mt-4 max-w-2xl opacity-80">
                                Plateforme centralisée de gestion et de suivi
                                des effectifs de la Police Nationale Congolaise.
                            </p>

                        </div>

                        {/* CARDS */}
                        <div className="grid grid-cols-2 gap-4 mt-10 w-full max-w-3xl">

                            <div className="card bg-base-100/10 border border-base-100/20">
                                <div className="card-body">
                                    <h3 className="card-title text-sm">
                                        Gestion des effectifs
                                    </h3>
                                    <p className="text-xs opacity-80">
                                        Suivi des agents et affectations.
                                    </p>
                                </div>
                            </div>

                            <div className="card bg-base-100/10 border border-base-100/20">
                                <div className="card-body">
                                    <h3 className="card-title text-sm">
                                        Contrôle administratif
                                    </h3>
                                    <p className="text-xs opacity-80">
                                        Validation des données.
                                    </p>
                                </div>
                            </div>

                            <div className="card bg-base-100/10 border border-base-100/20">
                                <div className="card-body">
                                    <h3 className="card-title text-sm">
                                        Synchronisation
                                    </h3>
                                    <p className="text-xs opacity-80">
                                        Mise à jour nationale.
                                    </p>
                                </div>
                            </div>

                            <div className="card bg-base-100/10 border border-base-100/20">
                                <div className="card-body">
                                    <h3 className="card-title text-sm">
                                        Sécurité
                                    </h3>
                                    <p className="text-xs opacity-80">
                                        Accès protégé et sécurisé.
                                    </p>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

                {/* ================= RIGHT PANEL ================= */}
                <div className="flex items-center justify-center h-full p-6 bg-base-200">

                    <div className="card w-full max-w-xl bg-base-100 shadow-2xl border border-base-300">

                        <div className="card-body p-10">

                            {/* HEADER */}
                            <div className="flex items-center justify-between">

                                <img
                                    src="/aba.png"
                                    className="w-12 h-12 cursor-pointer hover:scale-110 transition"
                                    onClick={() => {
                                        localStorage.removeItem("server_ip");
                                        localStorage.removeItem("server_port");
                                        toast.success("Configuration supprimée");
                                        window.location.reload();
                                    }}
                                />

                                <div className="text-center">
                                    <h1 className="text-3xl font-black text-primary">
                                        ABA-CM
                                    </h1>
                                    <p className="text-xs opacity-60">
                                        PNC Auth System
                                    </p>
                                </div>

                                <img
                                    src="/logo_pnc1.png"
                                    className="
                                    w-12 h-12
                                    cursor-pointer
                                    hover:scale-110
                                    transition
                                 
                                "
                                    onClick={openServerConfig}
                                />

                            </div>

                            {/* ALERT */}
                            <div className="alert alert-info mt-6">
                                <Lock size={18} />
                                <span>Accès réservé aux agents autorisés</span>
                            </div>

                            {/* MODE */}
                            <div className="flex gap-3 mt-6">

                                <button
                                    type="button"
                                    className={`btn flex-1 ${mode === "local" ? "btn-primary" : "btn-outline"}`}
                                    onClick={() => setMode("local")}
                                >
                                    <Server size={16} />
                                    Local
                                </button>

                                <button
                                    type="button"
                                    className={`btn flex-1 ${mode === "remote" ? "btn-primary" : "btn-outline"}`}
                                    onClick={() => setMode("remote")}
                                >
                                    <Wifi size={16} />
                                    Distant
                                </button>

                            </div>

                            {/* FORM */}
                            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                            >

                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    placeholder="Nom d'utilisateur"
                                    {...register("username", { required: true })}
                                    autoComplete="off"
                                    spellCheck="false"
                                />

                                <input
                                    type="password"
                                    className="input input-bordered w-full"
                                    placeholder="Mot de passe"
                                    {...register("password", { required: true })}
                                    autoCapitalize="new-password"
                                    spellCheck="false"
                                />

                                <div className="text-xs opacity-60">
                                    Mode actif :
                                    <span className="font-bold ml-1">
                                        {mode === "local" ? "Local" : "Central"}
                                    </span>
                                </div>

                                <button className="btn btn-primary w-full">
                                    {loading ? "Connexion..." : "Se connecter"}
                                </button>

                            </form>

                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}