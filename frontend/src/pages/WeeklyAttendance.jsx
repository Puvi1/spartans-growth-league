import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle, XCircle, MinusCircle, Lock, CaretLeft, CaretRight, Calendar, LockOpen, Users, User } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/Avatar";

const STATUSES = [
    { key: "present", label: "Present", color: "emerald", icon: CheckCircle },
    { key: "absent", label: "Absent", color: "red", icon: XCircle },
    { key: "na", label: "N/A", color: "zinc", icon: MinusCircle },
];

function toISODate(d) { return d.toISOString().slice(0, 10); }

export default function WeeklyAttendance() {
    const { user } = useAuth();
    const canManage = user?.role === "super_admin" || user?.role === "team_leader";
    const [weekOf, setWeekOf] = useState(() => toISODate(new Date()));
    const [mode, setMode] = useState("me");
    const [data, setData] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [busy, setBusy] = useState(null);

    const [sessionForm, setSessionForm] = useState({
        name: "",
        club_type: "converter",
        weekday: 0,
        repeat_type: "weekly",
        open_time: "08:00",
        lock_time: "22:00",
    });

    const load = async (w = weekOf) => {
        const { data } = await api.get(`/event-attendance/week?week_of=${w}`);
        setData(data);
        if (canManage) {
            try {
                const { data: td } = await api.get(`/event-attendance/team-week?week_of=${w}`);
                setTeamData(td);
            } catch {}
        }
    };

    useEffect(() => { load(weekOf); }, [weekOf]);

    const navWeek = (delta) => {
        const d = new Date(weekOf);
        d.setDate(d.getDate() + delta * 7);
        setWeekOf(toISODate(d));
    };

    const markSelf = async (occ, status) => {
        if (occ.locked) { toast.error("Attendance locked"); return; }
        setBusy(occ.event_id + occ.event_date);
        try {
            await api.post("/event-attendance/mark", { event_id: occ.event_id, event_date: occ.event_date, status });
            toast.success(`Marked ${status.toUpperCase()}`);
            await load(weekOf);
        } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
        finally { setBusy(null); }
    };

    const markFor = async (userId, eventId, eventDate, status) => {
        setBusy(userId + eventId + eventDate + status);
        try {
            await api.post("/event-attendance/mark-for-member", {
                user_id: userId, event_id: eventId, event_date: eventDate, status,
            });
            toast.success(`${status.toUpperCase()} recorded`);
            await load(weekOf);
        } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
        finally { setBusy(null); }
    };

    const createSession = async (e) => {
        e.preventDefault();

        if (!sessionForm.name.trim()) {
            toast.error("Session name is required");
            return;
        }

        try {
            await api.post("/weekly-events", {
                name: sessionForm.name,
                club_type: sessionForm.club_type,
                weekday: Number(sessionForm.weekday),
                repeat_type: sessionForm.repeat_type,
                open_time: sessionForm.open_time,
                lock_time: sessionForm.lock_time,
                active: true,
            });

            toast.success("Attendance session added");

            setSessionForm({
                name: "",
                club_type: "converter",
                weekday: 0,
                repeat_type: "weekly",
                open_time: "08:00",
                lock_time: "22:00",
            });

            await load(weekOf);
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to create session");
        }
    };

    if (!data) return <div className="text-zinc-500 text-sm">Loading week...</div>;

    return (
        <div className="space-y-6" data-testid="weekly-attendance-page">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <div className="heading-eyebrow">Weekly Ritual</div>
                    <h1 className="font-display font-black text-3xl md:text-4xl tracking-tighter mt-1">Weekly Attendance</h1>
                    <p className="text-zinc-400 mt-2 text-sm">
                        Monday & Thursday lock at 8 AM · Saturday stays open until 10 PM.
                    </p>
                </div>

                {canManage && (
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 self-start">
                        <button onClick={() => setMode("me")} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 ${mode === "me" ? "bg-yellow-500 text-black" : "text-zinc-400 hover:text-white"}`}>
                            <User size={14} weight="fill" /> Me
                        </button>
                        <button onClick={() => setMode("team")} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 ${mode === "team" ? "bg-yellow-500 text-black" : "text-zinc-400 hover:text-white"}`}>
                            <Users size={14} weight="fill" /> Team
                        </button>
                    </div>
                )}
            </div>

            {user?.role === "super_admin" && (
                <form onSubmit={createSession} className="glass p-4 space-y-3">
                    <div className="heading-eyebrow">Admin</div>
                    <h2 className="font-display font-bold text-xl">Add Attendance Session</h2>

                    <input
                        type="text"
                        value={sessionForm.name}
                        onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                        placeholder="Session name"
                        className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3 text-sm"
                    />

                    <select value={sessionForm.club_type} onChange={(e) => setSessionForm({ ...sessionForm, club_type: e.target.value })} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3 text-sm">
                        <option value="converter">Converter</option>
                        <option value="believer">Believer</option>
                        <option value="builder">Builder</option>
                        <option value="decider">Decider</option>
                        <option value="all">All Clubs</option>
                    </select>

                    <select value={sessionForm.weekday} onChange={(e) => setSessionForm({ ...sessionForm, weekday: e.target.value })} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3 text-sm">
                        <option value={0}>Monday</option>
                        <option value={1}>Tuesday</option>
                        <option value={2}>Wednesday</option>
                        <option value={3}>Thursday</option>
                        <option value={4}>Friday</option>
                        <option value={5}>Saturday</option>
                        <option value={6}>Sunday</option>
                    </select>

                    <select value={sessionForm.repeat_type} onChange={(e) => setSessionForm({ ...sessionForm, repeat_type: e.target.value })} className="w-full bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3 text-sm">
                        <option value="weekly">Repeat Every Week</option>
                        <option value="once">One Time Only</option>
                    </select>

                    <div className="grid grid-cols-2 gap-3">
                        <input type="time" value={sessionForm.open_time} onChange={(e) => setSessionForm({ ...sessionForm, open_time: e.target.value })} className="bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3 text-sm" />
                        <input type="time" value={sessionForm.lock_time} onChange={(e) => setSessionForm({ ...sessionForm, lock_time: e.target.value })} className="bg-[#111] text-white border border-white/10 rounded-xl px-4 py-3 text-sm" />
                    </div>

                    <button type="submit" className="btn-gold w-full py-3">
                        Add Session
                    </button>
                </form>
            )}

            <div className="glass p-4 flex items-center justify-between">
                <button onClick={() => navWeek(-1)} className="btn-ghost"><CaretLeft size={16} /> Previous</button>
                <div className="text-center">
                    <div className="heading-eyebrow">Week</div>
                    <div className="font-display font-bold text-sm mt-1">{data.week_start} → {data.week_end}</div>
                </div>
                <button onClick={() => navWeek(1)} className="btn-ghost">Next <CaretRight size={16} /></button>
            </div>

            {mode === "me" && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {data.occurrences.length === 0 && (
                            <div className="col-span-full text-center text-zinc-500 text-sm py-8">
                                No attendance sessions open right now. Meetings appear on their scheduled day.
                            </div>
                        )}

                        {data.occurrences.map((occ) => (
                            <EventCard
                                key={occ.event_id + occ.event_date}
                                occ={occ}
                                busy={busy === occ.event_id + occ.event_date}
                                onMark={(s) => markSelf(occ, s)}
                            />
                        ))}
                    </div>

                    <div className="glass p-4 text-xs text-zinc-500 flex items-center gap-2">
                        <Lock size={14} weight="duotone" className="text-yellow-500" />
                        Attendance opens only on the meeting day and locks based on admin time frame.
                    </div>
                </>
            )}

            {mode === "team" && teamData && (
                <TeamGrid data={teamData} onMark={markFor} busyKey={busy} />
            )}
        </div>
    );
}

function TeamGrid({ data, onMark, busyKey }) {
    const { occurrences, grid } = data;
    return (
        <div className="glass p-3 md:p-4 overflow-x-auto">
            <table className="w-full min-w-[720px]">
                <thead>
                    <tr>
                        <th className="text-left py-2 px-2 text-[10px] uppercase tracking-widest text-zinc-500">Member</th>
                        {occurrences.map((o) => (
                            <th key={o.event_id} className="text-center py-2 px-2">
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500">{o.weekday_name}</div>
                                <div className="text-xs font-bold mt-0.5">{o.name.split("(")[0].trim()}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {grid.map((row) => (
                        <tr key={row.user_id} className="border-t border-white/5">
                            <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                    <Avatar user={row} size={28} />
                                    <div>
                                        <div className="text-sm font-semibold">{row.name}</div>
                                        <div className="text-[10px] text-zinc-500">{row.team || "-"}</div>
                                    </div>
                                </div>
                            </td>

                            {occurrences.map((o) => {
                                const mk = row.marks[o.event_id] || {};
                                const current = mk.status;
                                return (
                                    <td key={o.event_id} className="py-2 px-1 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {STATUSES.map((s) => {
                                                const active = current === s.key;
                                                const key = row.user_id + o.event_id + o.event_date + s.key;
                                                return (
                                                    <button
                                                        key={s.key}
                                                        disabled={busyKey === key || o.is_locked}
                                                        onClick={() => onMark(row.user_id, o.event_id, o.event_date, s.key)}
                                                        className={`w-8 h-8 rounded-lg grid place-items-center transition-all ${active ? "bg-yellow-500 text-black" : "bg-white/5 text-zinc-400"} disabled:opacity-40`}
                                                        title={s.label}
                                                    >
                                                        <s.icon size={14} weight="fill" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function EventCard({ occ, busy, onMark }) {
    const active = STATUSES.find((s) => s.key === occ.status);
    const bg = active?.key === "present" ? "border-emerald-500/40 bg-emerald-500/5" :
        active?.key === "absent" ? "border-red-500/40 bg-red-500/5" :
        active?.key === "na" ? "border-zinc-500/30 bg-zinc-500/5" :
        occ.locked ? "border-white/5 bg-white/[0.02] opacity-70" : "border-yellow-500/20 bg-white/[0.02]";

    return (
        <motion.div whileHover={{ y: occ.locked ? 0 : -3 }} className={`p-5 rounded-2xl border transition-all ${bg}`}>
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{occ.weekday_name}</div>
                    <h3 className="font-display font-bold text-lg mt-1">{occ.name}</h3>
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                        <Calendar size={12} weight="duotone" /> {occ.event_date}
                        {occ.club_type && <span className="chip-gold ml-2" style={{ padding: "2px 6px", fontSize: "9px" }}>{occ.club_type}</span>}
                    </div>
                </div>

                {occ.locked ? (
                    <div className="chip-zinc"><Lock size={10} weight="fill" /> Locked</div>
                ) : (
                    <div className="chip-emerald"><LockOpen size={10} weight="fill" /> Open</div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
                {STATUSES.map((s) => {
                    const isActive = occ.status === s.key;
                    return (
                        <button
                            key={s.key}
                            disabled={occ.locked || busy}
                            onClick={() => onMark(s.key)}
                            className={`p-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${
                                isActive ? "bg-yellow-500 text-black border-yellow-500" : "bg-white/5 text-zinc-400 border-white/10"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <s.icon size={16} weight="fill" className="inline mr-1" />
                            {s.label}
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}
