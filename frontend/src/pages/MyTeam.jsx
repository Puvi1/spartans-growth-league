import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Users, Fire, Target, Trophy, Crown, TrendUp, ChartBar, UserPlus, X, MagnifyingGlass } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import StatCard from "@/components/StatCard";
import ProgressBar from "@/components/ProgressBar";
import PositionBadges from "@/components/PositionBadges";

export default function MyTeam() {
    const [data, setData] = useState(null);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("xp");
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            const { data } = await api.get("/reports/team");
            setData(data);
        } catch { /* not a leader */ }
    };
    useEffect(() => { load(); }, []);

    const addMember = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post("/team-leader/add-member", form);
            toast.success(`${form.name} joined your squad`);
            setModal(false);
            setForm({ name: "", email: "", password: "", phone: "" });
            await load();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to add member");
        } finally { setSaving(false); }
    };

    if (!data) return <div className="text-zinc-500 text-sm">Loading your team...</div>;

    const { team, totals, members: rawMembers } = data;

    const filtered = rawMembers
        .filter((m) => !query || m.name.toLowerCase().includes(query.toLowerCase()) || (m.email || "").toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => {
            if (sort === "name") return a.name.localeCompare(b.name);
            if (sort === "streak") return (b.streak_current || 0) - (a.streak_current || 0);
            if (sort === "wins") return (b.won || 0) - (a.won || 0);
            return (b.xp || 0) - (a.xp || 0);
        });
    const topMember = filtered[0];

    return (
        <div className="space-y-8" data-testid="my-team-page">
            <section className="glass-strong p-6 md:p-10 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-gradient-to-br from-yellow-500 to-blue-500 grid place-items-center font-display font-black text-black text-6xl md:text-7xl shadow-[0_0_50px_rgba(234,179,8,0.4)]">
                        {team.name[0]}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <div className="heading-eyebrow">Your Squad</div>
                        <h1 className="font-display font-black text-4xl md:text-5xl tracking-tighter mt-1">
                            Team {team.name}
                        </h1>
                        <div className="mt-3 flex items-center gap-3 flex-wrap justify-center md:justify-start">
                            <span className="chip-gold"><Crown size={12} weight="fill" /> You Command</span>
                            <span className="chip-blue"><Users size={12} weight="fill" /> {totals.members} Warriors</span>
                            <span className="chip-emerald"><Fire size={12} weight="fill" /> {totals.active_today} Active Today</span>
                        </div>
                        {topMember && (
                            <div className="mt-4 text-sm text-zinc-400">
                                Top warrior: <span className="text-yellow-400 font-bold">{topMember.name}</span> · LVL {topMember.level} · {(topMember.xp || 0).toLocaleString()} XP
                            </div>
                        )}
                        <div className="mt-5">
                            <button onClick={() => setModal(true)} className="btn-gold py-2 px-4 text-sm" data-testid="add-member-btn">
                                <UserPlus size={16} weight="bold" /> Recruit Warrior
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard icon={Users} label="Members" value={totals.members} tone="gold" testId="team-stat-members" />
                <StatCard icon={Target} label="Prospects" value={totals.prospects} sublabel={`${totals.won} closed`} tone="blue" testId="team-stat-prospects" />
                <StatCard icon={Trophy} label="Wins" value={totals.won} sublabel={`${totals.conversion_rate}% conv.`} tone="emerald" testId="team-stat-wins" />
                <StatCard icon={Fire} label="Check-ins" value={totals.checkins} tone="gold" testId="team-stat-checkins" />
                <StatCard icon={ChartBar} label="Follow-ups" value={totals.followups_done} sublabel="completed" tone="blue" testId="team-stat-followups" />
                <StatCard icon={TrendUp} label="Team XP" value={(totals.xp || 0).toLocaleString()} tone="zinc" testId="team-stat-xp" />
            </section>

            <section className="glass p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <div>
                        <div className="heading-eyebrow">Member performance</div>
                        <h3 className="font-display font-bold text-xl mt-1">Squad Breakdown</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 md:flex-none">
                            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search warriors..." className="field pl-9 text-sm w-full md:w-56" data-testid="team-search" />
                        </div>
                        <select value={sort} onChange={(e) => setSort(e.target.value)} className="field text-sm" data-testid="team-sort">
                            <option value="xp">Sort: XP</option>
                            <option value="name">Sort: Name</option>
                            <option value="streak">Sort: Streak</option>
                            <option value="wins">Sort: Wins</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px]">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-widest text-zinc-500">
                                <th className="text-left py-2 px-3">Warrior</th>
                                <th className="text-left py-2 px-3">Level</th>
                                <th className="text-left py-2 px-3">XP</th>
                                <th className="text-left py-2 px-3">Streak</th>
                                <th className="text-left py-2 px-3">Prospects</th>
                                <th className="text-left py-2 px-3">Wins</th>
                                <th className="text-left py-2 px-3">Follow-Ups</th>
                                <th className="text-left py-2 px-3">Events</th>
                                <th className="text-left py-2 px-3 w-40">XP Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((m) => (
                                <motion.tr key={m.user_id} whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }} className="border-t border-white/5" data-testid={`team-member-${m.user_id}`}>
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-500 to-blue-500 grid place-items-center font-bold text-black text-xs">
                                                {m.name[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                                                    {m.name}
                                                    {m.role === "team_leader" && <Crown size={12} weight="fill" className="text-yellow-400" />}
                                                    <PositionBadges badges={m.position_badges || []} size="xs" limit={2} />
                                                </div>
                                                <div className="text-[10px] text-zinc-500">{m.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3"><span className="chip-gold">LVL {m.level}</span></td>
                                    <td className="py-3 px-3 font-mono text-yellow-400 text-sm">{(m.xp || 0).toLocaleString()}</td>
                                    <td className="py-3 px-3 text-sm">{m.streak_current || 0}</td>
                                    <td className="py-3 px-3 text-sm">{m.prospects}</td>
                                    <td className="py-3 px-3 text-sm text-emerald-400 font-bold">{m.won}</td>
                                    <td className="py-3 px-3 text-sm">{m.followups_done}</td>
                                    <td className="py-3 px-3 text-sm">{m.attendance}</td>
                                    <td className="py-3 px-3">
                                        <ProgressBar value={m.xp || 0} max={Math.max(1, totals.xp)} color="gold" />
                                    </td>
                                </motion.tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={9} className="py-8 text-center text-zinc-500 text-sm">No warriors match your search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <AnimatePresence>
                {modal && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4" onClick={() => setModal(false)}>
                        <motion.form initial={{scale:0.9}} animate={{scale:1}} onSubmit={addMember} onClick={(e)=>e.stopPropagation()} className="glass-strong p-6 md:p-8 w-full max-w-md relative" data-testid="add-member-modal">
                            <button type="button" onClick={() => setModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
                            <div className="heading-eyebrow mb-2">Grow your squad</div>
                            <h3 className="font-display font-black text-2xl mb-6">Recruit Warrior</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Full Name</label>
                                    <input required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="field" data-testid="new-member-name" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Email</label>
                                    <input required type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} className="field" data-testid="new-member-email" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Mobile (10 digits)</label>
                                    <input type="tel" value={form.phone} onChange={(e)=>setForm({...form, phone: e.target.value})} className="field" data-testid="new-member-phone" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Temp Password (min 6 chars)</label>
                                    <input required type="text" minLength={6} value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} className="field font-mono" data-testid="new-member-password" />
                                    <div className="text-[10px] text-zinc-500 mt-1">Share with your recruit. They can change it after login.</div>
                                </div>
                            </div>
                            <button type="submit" disabled={saving} className="btn-gold w-full mt-6 disabled:opacity-60" data-testid="submit-new-member">
                                <UserPlus size={16} weight="bold" /> {saving ? "Recruiting..." : "Recruit"}
                            </button>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
