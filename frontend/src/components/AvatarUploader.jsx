import { useRef, useState } from "react";
import { Camera, Spinner } from "@phosphor-icons/react";
import { toast } from "sonner";
import Avatar from "./Avatar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AvatarUploader({ user, onUploaded, size = 128 }) {
    const [busy, setBusy] = useState(false);
    const ref = useRef(null);

    const pick = () => ref.current?.click();

    const onChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!ALLOWED_MIME.includes(file.type)) {
            toast.error("Only JPG, PNG, WEBP, GIF images allowed");
            e.target.value = "";
            return;
        }
        if (file.size > MAX_BYTES) {
            toast.error("Image must be under 2 MB");
            e.target.value = "";
            return;
        }
        setBusy(true);
        try {
            const token = localStorage.getItem("sgl_access_token");
            const fd = new FormData();
            fd.append("file", file);
            const r = await fetch(`${BACKEND_URL}/api/uploads/avatar`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: fd,
            });
            if (!r.ok) {
                const err = await r.json().catch(() => ({}));
                throw new Error(err.detail || "Upload failed");
            }
            const data = await r.json();
            toast.success("Profile photo updated");
            onUploaded?.(data.url);
        } catch (err) {
            toast.error(err.message || "Upload failed");
        } finally {
            setBusy(false);
            e.target.value = "";
        }
    };

    return (
        <div className="relative inline-block" data-testid="avatar-uploader">
            <Avatar user={user} size={size} className="shadow-[0_0_30px_rgba(234,179,8,0.35)]" />
            <button
                onClick={pick}
                disabled={busy}
                className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-yellow-500 text-black grid place-items-center border-4 border-[#050507] hover:scale-105 transition-transform disabled:opacity-70"
                data-testid="avatar-upload-btn"
                aria-label="Upload profile photo"
            >
                {busy ? <Spinner size={16} weight="bold" className="animate-spin" /> : <Camera size={16} weight="bold" />}
            </button>
            <input ref={ref} type="file" accept="image/*" onChange={onChange} className="hidden" data-testid="avatar-file-input" />
        </div>
    );
}
