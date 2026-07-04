import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Plus, X, CheckCircle, XCircle, MinusCircle, Trash, Calendar, Trophy, Users, CurrencyDollar, Archive } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressBar from "@/components/ProgressBar";

export default function Seasons() {
    const { user } = useAuth();
    const isAdmin = user?.role === "super_admin";
    const isLeader = user?.role === "team_leader";
    const [seasons, setSeasons] = useState([]);
    const [filter, setFilter] = useState("all");  // all|regular|believer
    const [selected, setSelected] = useState(null);
    const [report, setReport] = useState(null);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({
        name: "", start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10),
        is_believer: false, total_pv: "", total_earnings: "",
    });

    const load = async () => {
        const { data } = await api.get("/seasons");
        setSeasons(data);
    };
    useEffect(() => { load(); }, []);

    useEffect(() => {
        if (!selected) { setReport(null); return; }
        api.get(`/seasons/${selected.season_id}/my-report`).then((r) => setReport(r.data));
    }, [selected]);

    const create = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form };
            payload.total_pv = payload.total_pv === "" ? null : Number(payload.total_pv);
            payload.total_earnings = payload.total_earnings === "" ? null : Number(payload.total_earnings);
            await api.post("/seasons", payload);
            toast.success("Season created");
            setModal(false);
            setForm({
                name: "", start_date: new Date().toISOString().slice(0, 10),
                end_date: new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10),
                is_believer: false, total_pv: "", total_earnings: "",
            });
            await load();
        } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
    };

    const finalize = async (id) => {
        if (!window.confirm("Snapshot this season into history? Rankings will be preserved permanently.")) return;
        try {
            await api.post(`/admin/seasons/${id}/finalize`);
            toast.success("Season archived to history");
        } catch { toast.error("Failed to archive"); }
    };

    const remove = async (id) => {
        if (!window.confirm("Delete this season?")) return;
        await api.delete(`/seasons/${id}`);
        toast.success("Season deleted");
        setSelected(null);
        await load();
    };

    const filtered = seasons.filter((s) =>
        filter === "all" ? true : filter === "believer" ? s.is_believer : !s.is_believer
    );

    return (
        <div className="space-y-6" data-testid="seasons-page">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <div className="heading-eyebrow">Track your run</div>
                    <h1 className="font-display font-black text-3xl md:text-4xl tracking-tighter mt-1">Seasons</h1>
                    <p className="text-zinc-400 mt-2 text-sm">Attendance rolls up into seasons. Show up every time.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                        {["all", "regular", "believer"].map((f) => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === f ? "bg-yellow-500 text-black" : "text-zinc-400 hover:text-white"}`}
                                data-testid={`season-filter-${f}`}
                            >{f}</button>
                        ))}
                    </div>
                    {isAdmin && (
                        <button onClick={() => setModal(true)} className="btn-gold" data-testid="create-season-btn">
                            <Plus size={16} weight="bold" /> New Season
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.length === 0 && <div className="text-zinc-500 text-sm md:col-span-2">No seasons yet.</div>}
                {filtered.map((s) => (
                    <SeasonCard key={s.season_id} season={s} onOpen={() => setSelected(s)} onDelete={() => remove(s.season_id)} onFinalize={() => finalize(s.season_id)} canDelete={isAdmin} canFinalize={isAdmin} />
                ))}
            </div>

            <AnimatePresence>
                {modal && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4" onClick={() => setModal(false)}>
                        <motion.form initial={{scale:0.9}} animate={{scale:1}} onSubmit={create} onClick={(e)=>e.stopPropagation()} className="glass-strong p-6 md:p-8 w-full max-w-md relative" data-testid="season-modal">
                            <button type="button" onClick={()=>setModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
                            <div className="heading-eyebrow mb-2">Draw the line</div>
                            <h3 className="font-display font-black text-2xl mb-6">Create Season</h3>
                            <div className="space-y-3">
                                <input required placeholder="Season name (e.g. Q3 2026)" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="field" data-testid="season-name-input" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input required type="date" value={form.start_date} onChange={(e)=>setForm({...form, start_date: e.target.value})} className="field" data-testid="season-start-input" />
                                    <input required type="date" value={form.end_date} onChange={(e)=>setForm({...form, end_date: e.target.value})} className="field" data-testid="season-end-input" />
                                </div>
                                <label className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 cursor-pointer">
                                    <input type="checkbox" checked={form.is_believer} onChange={(e)=>setForm({...form, is_believer: e.target.checked})} className="w-4 h-4" data-testid="season-believer-toggle" />
                                    <span className="text-sm">Believer season (Tuesday meetings only)</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Season PV (optional)</label>
                                        <input type="number" step="0.01" min="0" placeholder="0" value={form.total_pv} onChange={(e)=>setForm({...form, total_pv: e.target.value})} className="field font-mono" data-testid="season-pv-input" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Season Earnings (optional)</label>
                                        <input type="number" step="0.01" min="0" placeholder="0" value={form.total_earnings} onChange={(e)=>setForm({...form, total_earnings: e.target.value})} className="field font-mono" data-testid="season-earnings-input" />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="btn-gold w-full mt-6" data-testid="season-submit-btn">Launch Season</button>
                        </motion.form>
                    </motion.div>
                )}

                {selected && report && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-4" onClick={() => setSelected(null)}>
                        <motion.div initial={{y:60}} animate={{y:0}} onClick={(e)=>e.stopPropagation()} className="glass-strong w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-6 md:p-8 relative" data-testid="season-report-modal">
                            <button onClick={()=>setSelected(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
                            <div className="heading-eyebrow mb-1">{selected.is_believer ? "Believer report" : "Season report"}</div>
                            <h3 className="font-display font-black text-2xl">{selected.name}</h3>
                            <div className="text-xs text-zinc-500 mt-1">{selected.start_date} → {selected.end_date}</div>

                            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-blue-500/10 border border-yellow-500/20">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="heading-eyebrow">Attendance</span>
                                    <span className="font-display text-3xl font-black text-yellow-400" data-testid="report-pct">
                                        {report.attendance_pct}%
                                    </span>
                                </div>
                                <ProgressBar value={report.attendance_pct} max={100} color="gold" />
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-2">
                                    {report.present} present of {report.present + report.absent} counted · {report.na} NA · {report.unmarked} unmarked
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mt-4">
                                <StatBlock icon={CheckCircle} value={report.present} label="Present" color="emerald" />
                                <StatBlock icon={XCircle} value={report.absent} label="Absent" color="red" />
                                <StatBlock icon={MinusCircle} value={report.na} label="N/A" color="zinc" />
                            </div>

                            <div className="mt-6">
                                <div className="heading-eyebrow mb-3">Per event</div>
                                <div className="space-y-2">
                                    {report.per_event.map((ev) => {
                                        const countable = ev.present + ev.absent;
                                        const pct = countable ? Math.round((ev.present / countable) * 100) : 0;
                                        return (
                                            <div key={ev.event_id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="text-sm font-bold">{ev.name}</div>
                                                    <div className="text-xs font-mono text-yellow-400">{pct}%</div>
                                                </div>
                                                <ProgressBar value={pct} max={100} color="gold" />
                                                <div className="text-[10px] text-zinc-500 mt-1 flex gap-3">
                                                    <span className="text-emerald-400">{ev.present}P</span>
                                                    <span className="text-red-400">{ev.absent}A</span>
                                                    <span>{ev.na}NA</span>
                                                    <span className="text-zinc-600">{ev.unmarked} unmarked</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {(isAdmin || isLeader) && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const { data } = await api.get(`/seasons/${selected.season_id}/team-report`);
                                            const top = data.members[0];
                                            toast.success(`Team top: ${top?.name || "—"} @ ${top?.attendance_pct || 0}%`);
                                        } catch { toast.error("Failed to load team report"); }
                                    }}
                                    className="btn-glass w-full mt-6"
                                    data-testid="load-team-report-btn"
                                >
                                    <Users size={16} /> View Team Report (toast preview)
                                </button>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SeasonCard({ season, onOpen, onDelete, onFinalize, canDelete, canFinalize }) {
    return (
        <motion.div
            whileHover={{ y: -3 }}
            onClick={onOpen}
            className="glass p-6 cursor-pointer relative overflow-hidden group"
            data-testid={`season-card-${season.season_id}`}
        >
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl" />
            <div className="relative">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 grid place-items-center text-yellow-400">
                            {season.is_believer ? <Trophy size={22} weight="duotone" /> : <Calendar size={22} weight="duotone" />}
                        </div>
                        <div>
                            <h3 className="font-display font-black text-xl">{season.name}</h3>
                            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
                                {season.start_date} → {season.end_date}
                            </div>
                        </div>
                    </div>
                    {season.is_believer ? <span className="chip-gold">Believer</span> : <span className="chip-blue">Regular</span>}
                </div>
                {(season.total_pv || season.total_earnings) && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                            <div className="text-[9px] uppercase tracking-widest text-zinc-500">Season PV</div>
                            <div className="font-display font-black text-yellow-400 mt-0.5">{Number(season.total_pv || 0).toLocaleString()}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                            <div className="text-[9px] uppercase tracking-widest text-zinc-500">Earnings</div>
                            <div className="font-display font-black text-emerald-400 mt-0.5">₹{Number(season.total_earnings || 0).toLocaleString()}</div>
                        </div>
                    </div>
                )}
                <div className="mt-4 text-xs text-zinc-500">Tap to view your report</div>
                <div className="absolute bottom-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canFinalize && (
                        <button onClick={(e) => { e.stopPropagation(); onFinalize(); }} className="p-2 rounded-lg text-yellow-400 hover:bg-yellow-500/10" title="Archive to history" data-testid={`finalize-season-${season.season_id}`}>
                            <Archive size={14} />
                        </button>
                    )}
                    {canDelete && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10">
                            <Trash size={14} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function StatBlock({ icon: Icon, value, label, color }) {
    const colors = {
        emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
        red: "text-red-400 border-red-500/20 bg-red-500/5",
        zinc: "text-zinc-400 border-white/10 bg-white/5",
    };
    return (
        <div className={`p-4 rounded-xl border ${colors[color]} text-center`}>
            <Icon size={20} weight="fill" className="mx-auto" />
            <div className="font-display font-black text-2xl mt-1">{value}</div>
            <div className="text-[9px] uppercase tracking-widest text-zinc-500">{label}</div>
        </div>
    );
}
