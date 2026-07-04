import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Users, Trophy, Target, Fire, ChartLine, Sparkle, MagnifyingGlass, Check, X, Crosshair, ClipboardText, Cake, Heart, Crown, Medal, PencilSimple, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import StatCard from "@/components/StatCard";
import PositionBadges, { POSITION_BADGE_META } from "@/components/PositionBadges";
import Avatar from "@/components/Avatar";

const ROLES = ["member", "team_leader", "super_admin"];
const ALL_BADGES = Object.keys(POSITION_BADGE_META);

export default function Admin() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [widgets, setWidgets] = useState(null);
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [query, setQuery] = useState("");
    const [teamFilter, setTeamFilter] = useState("all");
    const [badgeUser, setBadgeUser] = useState(null);
    const [selectedBadges, setSelectedBadges] = useState([]);
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({ name: "", team_id: "", role: "member" });
    const canPromote = user?.role === "super_admin";

    const load = async () => {
        const [a, w, u, t] = await Promise.all([
            api.get("/admin/analytics"),
            api.get("/admin/dashboard-widgets"),
            api.get("/admin/users"),
            api.get("/teams/public").catch(() => ({ data: [] })),
        ]);
        setAnalytics(a.data);
        setWidgets(w.data);
        setUsers(u.data);
        setTeams(t.data);
    };
    useEffect(() => { load(); }, []);

    const openEdit = (u) => {
        setEditUser(u);
        setEditForm({ name: u.name || "", team_id: u.team_id || "", role: u.role || "member" });
    };
    const saveEdit = async () => {
        try {
            await api.patch(`/admin/users/${editUser.user_id}`, editForm);
            toast.success("Member updated");
            setEditUser(null);
            await load();
        } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
    };
    const deleteUser = async (uid, name) => {
        if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
        try {
            await api.delete(`/admin/users/${uid}`);
            toast.success(`${name} removed`);
            await load();
        } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
    };

    const changeRole = async (uid, role) => {
        try {
            await api.patch(`/admin/users/${uid}/role`, { role });
            toast.success("Role updated");
            await load();
        } catch { toast.error("Permission denied"); }
    };

    const openBadges = (u) => {
        setBadgeUser(u);
        setSelectedBadges(u.position_badges || []);
    };
    const toggleBadge = (b) => {
        setSelectedBadges((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);
    };
    const saveBadges = async () => {
        try {
            await api.patch(`/admin/users/${badgeUser.user_id}/position-badges`, { badges: selectedBadges });
            toast.success("Badges updated");
            setBadgeUser(null);
            await load();
        } catch { toast.error("Failed to update badges"); }
    };

    if (!analytics) return <div className="text-zinc-500 text-sm">Loading command center...</div>;

    const teamNames = Array.from(new Set(users.map((u) => u.team).filter(Boolean))).sort();
    const filtered = users.filter((u) =>
        (teamFilter === "all" || u.team === teamFilter) &&
        (!query || u.name?.toLowerCase().includes(query.toLowerCase()) || u.email?.toLowerCase().includes(query.toLowerCase()))
    );

    return (
        <div className="space-y-8" data-testid="admin-page">
            <div>
                <div className="heading-eyebrow">Command center</div>
                <h1 className="font-display font-black text-3xl md:text-4xl tracking-tighter mt-1">Admin Panel</h1>
                <p className="text-zinc-400 mt-2 text-sm">Direct the league. Verify the metrics. Crown new leaders.</p>
            </div>

            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard icon={Users} label="Members" value={analytics.total_users} tone="gold" testId="admin-stat-users" />
                <StatCard icon={Target} label="Prospects" value={analytics.total_prospects} tone="blue" testId="admin-stat-prospects" />
                <StatCard icon={Trophy} label="Deals Won" value={analytics.total_won} sublabel={`${analytics.conversion_rate}% conv.`} tone="emerald" testId="admin-stat-won" />
                <StatCard icon={Fire} label="Check-ins" value={analytics.total_checkins} tone="gold" testId="admin-stat-checkins" />
                <StatCard icon={Sparkle} label="Active Today" value={analytics.active_today} tone="blue" testId="admin-stat-active" />
                <StatCard icon={ChartLine} label="Weekly XP" value={analytics.weekly_xp} tone="zinc" testId="admin-stat-weekly-xp" />
            </section>

            {widgets && (
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="admin-widgets">
                    <ActivityCard title="Today's activity" icon={Crosshair}>
                        <ActivityRow label="Missions logged today" value={widgets.missions_today} accent="text-yellow-400" />
                        <ActivityRow label="Converted today" value={widgets.missions_converted_today} accent="text-emerald-400" />
                        <ActivityRow label="Pending tasks" value={widgets.pending_tasks} accent="text-blue-400" />
                        <ActivityRow label="Overdue tasks" value={widgets.overdue_tasks} accent="text-red-400" />
                    </ActivityCard>

                    <ChampionCard title="Top Individual" icon={Crown} data={widgets.top_individual} metric="xp" metricLabel="XP" />
                    <ChampionCard title="Top Team" icon={Trophy} teamMode data={widgets.top_team} metric="xp" metricLabel="Team XP" />

                    <ChampionCard title="Season Champion" icon={Medal} data={widgets.season_champion} metric="xp_in_season" metricLabel="Season XP" sublabel={widgets.season_champion?.season_name} />
                    <UpcomingCard title="Upcoming Birthdays" icon={Cake} items={widgets.upcoming_birthdays} accent="text-pink-400" />
                    <UpcomingCard title="Upcoming Anniversaries" icon={Heart} items={widgets.upcoming_anniversaries} accent="text-rose-400" />
                </section>
            )}

            <section className="glass p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <div>
                        <div className="heading-eyebrow">Roster</div>
                        <h3 className="font-display font-bold text-xl mt-1">All Spartans</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="field pl-9 text-sm w-40 md:w-56" data-testid="admin-search" />
                        </div>
                        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="field text-sm" data-testid="admin-team-filter">
                            <option value="all">All Teams</option>
                            {teamNames.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="text-xs text-zinc-500 hidden md:block">{filtered.length} shown</div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px]">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-widest text-zinc-500">
                                <th className="text-left py-2 px-3">Spartan</th>
                                <th className="text-left py-2 px-3">Team</th>
                                <th className="text-left py-2 px-3">Level</th>
                                <th className="text-left py-2 px-3">XP</th>
                                <th className="text-left py-2 px-3">Streak</th>
                                <th className="text-left py-2 px-3">Position Badges</th>
                                <th className="text-left py-2 px-3">Role</th>
                                <th className="text-right py-2 px-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u) => (
                                <motion.tr key={u.user_id} whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }} className="border-t border-white/5" data-testid={`admin-user-row-${u.user_id}`}>
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar user={u} size={32} />
                                            <div>
                                                <div className="text-sm font-semibold">{u.name}</div>
                                                <div className="text-[10px] text-zinc-500">{u.email}</div>
                                                {u.nexus_id && <div className="text-[9px] font-mono text-yellow-500/80">{u.nexus_id}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-sm text-zinc-400">{u.team || "-"}</td>
                                    <td className="py-3 px-3"><span className="chip-gold">LVL {u.level}</span></td>
                                    <td className="py-3 px-3 font-mono text-yellow-400 text-sm">{(u.xp || 0).toLocaleString()}</td>
                                    <td className="py-3 px-3"><span className="text-sm flex items-center gap-1"><Fire size={12} weight="fill" className="text-yellow-500" /> {u.streak_current || 0}</span></td>
                                    <td className="py-3 px-3">
                                        <button onClick={() => openBadges(u)} className="text-left" data-testid={`admin-open-badges-${u.user_id}`}>
                                            {u.position_badges?.length > 0 ? (
                                                <PositionBadges badges={u.position_badges} size="xs" limit={2} />
                                            ) : (
                                                <span className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-yellow-400">+ Assign</span>
                                            )}
                                        </button>
                                    </td>
                                    <td className="py-3 px-3">
                                        {canPromote ? (
                                            <select
                                                value={u.role}
                                                onChange={(e) => changeRole(u.user_id, e.target.value)}
                                                className="bg-[#0f0f12] border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                                                data-testid={`admin-role-${u.user_id}`}
                                            >
                                                {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                                            </select>
                                        ) : (
                                            <span className="chip-zinc">{u.role.replace("_", " ")}</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-3">
                                        {canPromote && u.role !== "super_admin" && (
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(u)}
                                                    className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10"
                                                    data-testid={`admin-edit-${u.user_id}`}
                                                    title="Edit"
                                                >
                                                    <PencilSimple size={14} weight="bold" />
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(u.user_id, u.name)}
                                                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                                                    data-testid={`admin-delete-${u.user_id}`}
                                                    title="Delete"
                                                >
                                                    <Trash size={14} weight="bold" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={8} className="py-8 text-center text-zinc-500 text-sm">No spartans match your search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <AnimatePresence>
                {editUser && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4" onClick={() => setEditUser(null)}>
                        <motion.div initial={{scale:0.9}} animate={{scale:1}} onClick={(e)=>e.stopPropagation()} className="glass-strong p-6 md:p-8 w-full max-w-md relative" data-testid="edit-user-modal">
                            <button type="button" onClick={() => setEditUser(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
                            <div className="heading-eyebrow mb-2">Edit member</div>
                            <h3 className="font-display font-black text-2xl mb-6">{editUser.name}</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Name</label>
                                    <input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="field" data-testid="edit-user-name" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Team</label>
                                    <select value={editForm.team_id} onChange={(e) => setEditForm({...editForm, team_id: e.target.value})} className="field" data-testid="edit-user-team">
                                        <option value="">Unassigned</option>
                                        {teams.map((t) => <option key={t.team_id} value={t.team_id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Role</label>
                                    <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="field" data-testid="edit-user-role">
                                        {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={saveEdit} className="btn-gold w-full mt-6" data-testid="save-edit-user">
                                <Check size={16} weight="bold" /> Save Changes
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {badgeUser && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4" onClick={() => setBadgeUser(null)}>
                        <motion.div initial={{scale:0.9}} animate={{scale:1}} onClick={(e)=>e.stopPropagation()} className="glass-strong p-6 md:p-8 w-full max-w-lg relative" data-testid="badge-editor-modal">
                            <button type="button" onClick={() => setBadgeUser(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
                            <div className="heading-eyebrow mb-2">Position badges</div>
                            <h3 className="font-display font-black text-2xl mb-1">{badgeUser.name}</h3>
                            <p className="text-xs text-zinc-400 mb-6">Tap to toggle. Visible to teammates on Profile & Dashboard.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {ALL_BADGES.map((b) => {
                                    const meta = POSITION_BADGE_META[b];
                                    const Icon = meta.icon;
                                    const active = selectedBadges.includes(b);
                                    return (
                                        <button
                                            key={b}
                                            onClick={() => toggleBadge(b)}
                                            className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${active ? "bg-yellow-500/10 border-yellow-500/60" : "bg-white/[0.02] border-white/10 hover:border-white/20"}`}
                                            data-testid={`badge-toggle-${b}`}
                                        >
                                            <Icon size={22} weight="fill" className={meta.color} />
                                            <div className="flex-1">
                                                <div className="text-sm font-bold">{meta.label}</div>
                                            </div>
                                            {active && <Check size={16} weight="bold" className="text-yellow-400" />}
                                        </button>
                                    );
                                })}
                            </div>
                            <button onClick={saveBadges} className="btn-gold w-full mt-6" data-testid="save-badges-btn">
                                <Check size={16} weight="bold" /> Save Badges
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ActivityCard({ title, icon: Icon, children }) {
    return (
        <div className="glass p-5" data-testid={`widget-${title.replace(/\s+/g, "-").toLowerCase()}`}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="heading-eyebrow">Live pulse</div>
                    <h3 className="font-display font-bold text-lg mt-1">{title}</h3>
                </div>
                <Icon size={22} weight="duotone" className="text-yellow-400" />
            </div>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function ActivityRow({ label, value, accent }) {
    return (
        <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
            <span className="text-xs text-zinc-400">{label}</span>
            <span className={`font-mono font-black text-lg ${accent}`}>{value}</span>
        </div>
    );
}

function ChampionCard({ title, icon: Icon, data, metric, metricLabel, sublabel, teamMode }) {
    if (!data) {
        return (
            <div className="glass p-5" data-testid={`widget-${title.replace(/\s+/g, "-").toLowerCase()}`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="heading-eyebrow">Spotlight</div>
                        <h3 className="font-display font-bold text-lg mt-1">{title}</h3>
                    </div>
                    <Icon size={22} weight="duotone" className="text-yellow-400" />
                </div>
                <div className="text-sm text-zinc-500 py-6 text-center">No data yet.</div>
            </div>
        );
    }
    const initial = data.name?.[0] || "?";
    return (
        <div className="glass p-5 relative overflow-hidden" data-testid={`widget-${title.replace(/\s+/g, "-").toLowerCase()}`}>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />
            <div className="relative flex items-center justify-between mb-4">
                <div>
                    <div className="heading-eyebrow">Spotlight</div>
                    <h3 className="font-display font-bold text-lg mt-1">{title}</h3>
                </div>
                <Icon size={26} weight="fill" className="text-yellow-400" />
            </div>
            <div className="relative flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${teamMode ? "rounded-2xl" : ""} bg-gradient-to-br from-yellow-500 to-blue-500 grid place-items-center font-display font-black text-black text-lg`}>
                    {teamMode ? data.name[0] : initial}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{teamMode ? `Team ${data.name}` : data.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
                        {teamMode ? `${data.members} warriors` : data.team || "Unassigned"}
                    </div>
                    {!teamMode && data.position_badges?.length > 0 && (
                        <div className="mt-1">
                            <PositionBadges badges={data.position_badges} size="xs" limit={3} />
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <div className="font-mono font-black text-yellow-400 text-xl">{(data[metric] || 0).toLocaleString()}</div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">{metricLabel}</div>
                </div>
            </div>
            {sublabel && <div className="mt-3 text-[10px] uppercase tracking-widest text-zinc-500">{sublabel}</div>}
        </div>
    );
}

function UpcomingCard({ title, icon: Icon, items, accent }) {
    return (
        <div className="glass p-5" data-testid={`widget-${title.replace(/\s+/g, "-").toLowerCase()}`}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="heading-eyebrow">Coming up</div>
                    <h3 className="font-display font-bold text-lg mt-1">{title}</h3>
                </div>
                <Icon size={22} weight="fill" className={accent} />
            </div>
            {items.length === 0 ? (
                <div className="text-sm text-zinc-500 py-6 text-center">None in the next 14 days.</div>
            ) : (
                <div className="space-y-2">
                    {items.map((it) => (
                        <div key={`${it.user_id}-${it.date}`} className="flex items-center gap-3 py-1.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-blue-500 grid place-items-center font-bold text-black text-xs">
                                {it.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold truncate">{it.name}</div>
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500">{it.team || "-"}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-white">{it.date.slice(5)}</div>
                                <div className="text-[9px] uppercase tracking-widest text-zinc-500">
                                    {it.days_until === 0 ? "today" : it.days_until === 1 ? "tomorrow" : `in ${it.days_until}d`}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

