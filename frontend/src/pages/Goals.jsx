import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { fireBigConfetti, fireConfetti } from "@/lib/confetti";
import { Plus, X, Target, Trash, Check, Sparkle, TrendUp } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressBar from "@/components/ProgressBar";

export default function Goals() {
    const { refreshUser } = useAuth();
    const [items, setItems] = useState([]);
    const [tab, setTab] = useState("weekly");
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ title: "", target: 5, period: "weekly", xp_reward: 50 });

    const load = async () => {
        const { data } = await api.get("/goals");
        setItems(data);
    };
    useEffect(() => { load(); }, []);

    const create = async (e) => {
        e.preventDefault();
        try {
            await api.post("/goals", { ...form, target: Number(form.target), xp_reward: Number(form.xp_reward) });
            toast.success("Goal set");
            setModal(false);
            setForm({ title: "", target: 5, period: tab, xp_reward: 50 });
            await load();
        } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
    };

    const bump = async (g, delta) => {
        const newP = Math.max(0, Math.min(g.target, g.progress + delta));
        try {
            const { data } = await api.patch(`/goals/${g.goal_id}/progress`, { progress: newP });
            if (data.goal.status === "completed" && data.xp) {
                fireBigConfetti();
                toast.success(`Goal crushed! +${g.xp_reward} XP`);
                await refreshUser();
            } else {
                fireConfetti({ particleCount: 40 });
            }
            await load();
        } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
    };

    const remove = async (id) => {
        if (!window.confirm("Delete this goal?")) return;
        await api.delete(`/goals/${id}`);
        toast.success("Goal removed");
        await load();
    };

    const filtered = items.filter((g) => g.period === tab);
    const active = filtered.filter((g) => g.status === "active");
    const done = filtered.filter((g) => g.status === "completed");

    return (
        <div className="space-y-6" data-testid="goals-page">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <div className="heading-eyebrow">Personal battles</div>
                    <h1 className="font-display font-black text-3xl md:text-4xl tracking-tighter mt-1">Goals</h1>
                    <p className="text-zinc-400 mt-2 text-sm">Weekly & monthly targets. Track it, crush it, earn the XP.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                        {["weekly", "monthly"].map((p) => (
                            <button key={p} onClick={() => setTab(p)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${tab === p ? "bg-yellow-500 text-black" : "text-zinc-400 hover:text-white"}`}
                                data-testid={`goal-tab-${p}`}>{p}</button>
                        ))}
                    </div>
                    <button onClick={() => { setForm({...form, period: tab}); setModal(true); }} className="btn-gold" data-testid="add-goal-btn">
                        <Plus size={16} weight="bold" /> New Goal
                    </button>
                </div>
            </div>

            <div className="glass p-4">
                <h3 className="font-display font-bold text-lg mb-4">Active {tab === "weekly" ? "This Week" : "This Month"}</h3>
                {active.length === 0 && (
                    <div className="text-center py-10">
                        <Target size={40} weight="duotone" className="text-zinc-700 mx-auto" />
                        <div className="text-zinc-500 mt-3 text-sm">No active {tab} goals. Set your first target.</div>
                    </div>
                )}
                <div className="space-y-3">
                    {active.map((g) => (
                        <GoalRow key={g.goal_id} g={g} onBump={(d) => bump(g, d)} onRemove={() => remove(g.goal_id)} />
                    ))}
                </div>
            </div>

            {done.length > 0 && (
                <div className="glass p-4">
                    <h3 className="font-display font-bold text-lg mb-4">Crushed</h3>
                    <div className="space-y-2">
                        {done.map((g) => (
                            <div key={g.goal_id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 opacity-70 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Check size={16} className="text-emerald-400" />
                                    <div>
                                        <div className="text-sm font-semibold">{g.title}</div>
                                        <div className="text-[10px] text-zinc-500">{g.progress}/{g.target} · {new Date(g.completed_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="chip-emerald"><Sparkle size={10} weight="fill" /> +{g.xp_reward} XP</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <AnimatePresence>
                {modal && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4" onClick={() => setModal(false)}>
                        <motion.form initial={{scale:0.9}} animate={{scale:1}} onSubmit={create} onClick={(e)=>e.stopPropagation()} className="glass-strong p-6 md:p-8 w-full max-w-md relative" data-testid="goal-modal">
                            <button type="button" onClick={() => setModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
                            <div className="heading-eyebrow mb-2">Draw a line</div>
                            <h3 className="font-display font-black text-2xl mb-6">New Goal</h3>
                            <div className="space-y-3">
                                <input required placeholder="Goal title (e.g. Add 20 prospects)" value={form.title} onChange={(e)=>setForm({...form, title: e.target.value})} className="field" data-testid="goal-title-input" />
                                <div className="grid grid-cols-3 gap-3">
                                    <input required type="number" min="1" placeholder="Target" value={form.target} onChange={(e)=>setForm({...form, target: e.target.value})} className="field" data-testid="goal-target-input" />
                                    <select value={form.period} onChange={(e)=>setForm({...form, period: e.target.value})} className="field">
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                    <input required type="number" min="0" placeholder="XP" value={form.xp_reward} onChange={(e)=>setForm({...form, xp_reward: e.target.value})} className="field" data-testid="goal-xp-input" />
                                </div>
                            </div>
                            <button type="submit" className="btn-gold w-full mt-6" data-testid="goal-submit-btn">Launch Goal</button>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function GoalRow({ g, onBump, onRemove }) {
    const pct = Math.round((g.progress / g.target) * 100);
    return (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="p-4 rounded-xl bg-white/[0.02] border border-white/5" data-testid={`goal-row-${g.goal_id}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <div className="font-bold">{g.title}</div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
                        {g.period} · +{g.xp_reward} XP on completion
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onBump(-1)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 grid place-items-center text-zinc-400" data-testid={`goal-decr-${g.goal_id}`}>-</button>
                    <div className="font-mono font-bold text-white w-16 text-center" data-testid={`goal-progress-${g.goal_id}`}>{g.progress}/{g.target}</div>
                    <button onClick={() => onBump(1)} className="w-8 h-8 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black grid place-items-center font-bold" data-testid={`goal-incr-${g.goal_id}`}>+</button>
                    <button onClick={onRemove} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10">
                        <Trash size={14} />
                    </button>
                </div>
            </div>
            <ProgressBar value={g.progress} max={g.target} color="gold" testId={`goal-bar-${g.goal_id}`} />
            <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                <TrendUp size={10} /> {pct}% to target
            </div>
        </motion.div>
    );
}
