"use client";

import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

const themes = [
    "light",
    "dim",
    "retro",
    "cupcake",
    "corporate",
    "nord",
    "autumn",
    "acid",
    "lemonade",
    "winter",
    "caramellatte",
    "abyss",
    "silk",
    "pastel",
    "wireframe",
    "synthwave",
    "cyberpunk",
    "dracula",
    "night",
    "coffee"
 
];

export default function Navbar({
    toggleSidebar,
    isOpen,
}: {
    toggleSidebar: () => void;
    isOpen: boolean;
}) {
    const [username, setUsername] = useState("User")
    const [profile, setProfile] = useState("Profile")

    useEffect(() => {

        const storedUsername = localStorage.getItem("username")

        if (storedUsername) {
            setUsername(storedUsername)
        }

        const storedProfile = localStorage.getItem("profile")

        if (storedProfile) {
            setProfile(storedProfile)
        }

    }, [])

    const changeTheme = (theme: string) => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    return (
        <div
            className="
                fixed top-0 right-0
                h-16 z-50
                bg-base-100
                border-b border-base-300
                shadow-sm
                flex items-center px-4
                transition-all duration-300
            "
            style={{
                left: isOpen ? "18rem" : "5rem",
            }}
        >

            {/* LEFT */}
            <div className="flex items-center gap-3 flex-1">

                <button
                    className="btn btn-ghost btn-circle"
                    onClick={toggleSidebar}
                >
                    <Menu size={22} />
                </button>

                <div>
                    <h1 className="text-xl font-bold text-primary">
                        ABA Controle Manager PNC
                    </h1>

                    <p className="text-xs opacity-70">
                        Gestion des effectifs policiers
                    </p>
                </div>

            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-4">

                <select
                    className="select select-bordered select-sm w-44"
                    defaultValue={
                        typeof window !== "undefined"
                            ? localStorage.getItem("theme") || "light"
                            : "light"
                    }
                    onChange={(e) => changeTheme(e.target.value)}
                >
                    {themes.map((theme) => (
                        <option key={theme} value={theme}>
                            {theme}
                        </option>
                    ))}
                </select>

                <div className="dropdown dropdown-end">

                    <div tabIndex={0} role="button"
                        className="btn btn-ghost btn-circle avatar">

                        <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                            A
                        </div>

                    </div>

                    <ul tabIndex={0}
                        className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">

                        <li>

                            <span>👤 {username}</span>

                        </li>

                        <li>
                            <span>👤 {profile}</span>
                        </li>

                        <div className="divider my-1"></div>

                        <li>
                            <button onClick={handleLogout} className="text-error">
                                🚪 Déconnexion
                            </button>
                        </li>

                    </ul>

                </div>

            </div>

        </div>
    );
}