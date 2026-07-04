import { useMemo } from "react";
import { User } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Universal user avatar.
 * Handles:
 *  - Emergent-backed `/api/files/<id>` URLs (auto-appends ?auth=<token>)
 *  - External URLs (Google, Unsplash)
 *  - Fallback initial circle
 */
export default function Avatar({ user, size = 40, className = "", ring = false }) {
    const src = user?.avatar_url || user?.picture || null;
    const initial = (user?.name || "S")[0]?.toUpperCase() || "S";

    const url = useMemo(() => {
        if (!src) return null;
        if (src.startsWith("/api/files/")) {
            const token = localStorage.getItem("sgl_access_token");
            const sep = src.includes("?") ? "&" : "?";
            return `${BACKEND_URL}${src}${token ? `${sep}auth=${encodeURIComponent(token)}` : ""}`;
        }
        return src;
    }, [src]);

    const style = { width: size, height: size };
    const wrapperClass = `rounded-full grid place-items-center overflow-hidden bg-gradient-to-br from-yellow-500 to-blue-500 shrink-0 ${ring ? "ring-2 ring-yellow-500/50" : ""} ${className}`;

    if (url) {
        return (
            <div className={wrapperClass} style={style}>
                <img src={url} alt={user?.name || "avatar"} className="w-full h-full object-cover" />
            </div>
        );
    }
    return (
        <div className={wrapperClass} style={style}>
            {user?.name ? (
                <span className="font-display font-black text-black" style={{ fontSize: size * 0.4 }}>{initial}</span>
            ) : (
                <User size={size * 0.5} weight="fill" className="text-black" />
            )}
        </div>
    );
}
