import { useEffect, useState, useRef } from "react";
import { Bell, Phone, Flag, ClipboardText, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";

export default function NotificationBell() {
    const [data, setData] = useState(null);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        let t;
        const load = async () => {
            try { const r = await api.get("/notifications"); setData(r.data); } catch { /* silent */ }
            t = setTimeout(load, 60_000);
        };
        load();
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const unread = data?.unread || 0;

    return (
        <div className="relative" ref={ref} data-testid="notification-bell-wrap">
            <button
                onClick={() => setOpen((o) => !o)}
                className="p-2 rounded-lg text-zinc-400 hover:text-yellow-400 hover:bg-white/5 relative transition-colors"
                data-testid="notification-bell"
                aria-label="Notifications"
            >
                <Bell size={18} weight="fill" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-black grid place-items-center animate-pulse" data-testid="notification-badge">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>
            <AnimatePresence>
                {open && data && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        className="absolute right-0 bottom-full mb-2 lg:top-full lg:mt-2 lg:bottom-auto w-80 max-w-[calc(100vw-2rem)] glass-strong p-4 z-50 shadow-2xl"
                        data-testid="notification-panel"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="heading-eyebrow">Alerts</div>
                                <h4 className="font-display font-bold text-lg">Notifications</h4>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>
                        {unread === 0 && (
                            <div className="py-6 text-center text-sm text-zinc-500">All clear, Spartan.</div>
                        )}
                        {data.followups_overdue?.length > 0 && (
                            <Section icon={Phone} title="Overdue follow-ups" color="text-red-400" to="/followups">
                                {data.followups_overdue.slice(0, 3).map((f) => (
                                    <li key={f.followup_id} className="truncate text-zinc-300">
                                        {f.title} <span className="text-red-400">· {f.due_date}</span>
                                    </li>
                                ))}
                            </Section>
                        )}
                        {data.followups_due_today?.length > 0 && (
                            <Section icon={Phone} title="Follow-ups today" color="text-yellow-400" to="/followups">
                                {data.followups_due_today.slice(0, 3).map((f) => (
                                    <li key={f.followup_id} className="truncate text-zinc-300">
                                        {f.title} <span className="text-yellow-400">· {f.time_slot || "any time"}</span>
                                    </li>
                                ))}
                            </Section>
                        )}
                        {(data.goals_pending_weekly + data.goals_pending_monthly) > 0 && (
                            <Section icon={Flag} title="Goals in progress" color="text-blue-400" to="/goals">
                                {data.goals_pending_weekly > 0 && <li className="text-zinc-300">{data.goals_pending_weekly} weekly goal(s) active</li>}
                                {data.goals_pending_monthly > 0 && <li className="text-zinc-300">{data.goals_pending_monthly} monthly goal(s) active</li>}
                            </Section>
                        )}
                        {data.tasks_overdue > 0 && (
                            <Section icon={ClipboardText} title="Tasks overdue" color="text-red-400" to="/tasks">
                                <li className="text-zinc-300">{data.tasks_overdue} task(s) past due</li>
                            </Section>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Section({ icon: Icon, title, color, to, children }) {
    return (
        <div className="mb-3 last:mb-0">
            <Link to={to} className="flex items-center gap-2 mb-2 group">
                <Icon size={14} weight="fill" className={color} />
                <div className="text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-white">{title}</div>
            </Link>
            <ul className="space-y-1 pl-6 text-xs list-disc marker:text-zinc-600">
                {children}
            </ul>
        </div>
    );
}
