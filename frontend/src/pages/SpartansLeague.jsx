import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Trophy, Crown, Medal, Users, Fire, ShieldStar, Sparkle, TrendUp, Target, ClipboardText, Flag, CalendarCheck, ChartLineUp } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import ProgressBar from "@/components/ProgressBar";
import PositionBadges from "@/components/PositionBadges";
import Avatar from "@/components/Avatar";

export default function SpartansLeague() {
    const { user } = useAuth();
    const [tab, setTab] = useState("individual");
    const [activeSeason, setActiveSeason] = useState(null);
    const [seasons, setSeasons] = useState([]);
    const [seasonId, setSeasonId] = useState("");
    const [individual, setIndividual] = useState(null);
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(false);

    // Load season list + active season once
    useEffect(() => {
        (async () => {
            const [ss, act] = await Promise.all([
                api.get("/seasons").catch(() => ({ data: [] })),
                api.get("/spartans-league/active-season").catch(() => ({ data: {} })),
            ]);
            setSeasons(ss.data);
            setActiveSeason(act.data?.season || null);
            setSeasonId(act.data?.season?.season_id || "");
        })();
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            if (tab === "team") {
                const { data } = await api.get(`/spartans-league/team${seasonId ? `?season_id=${seasonId}` : ""}`);
                setTeam(data);
            } else {
                const { data } = await api.get(`/spartans-league/individual${seasonId ? `?season_id=${seasonId}` : ""}`);
                setIndividual(data);
            }
        } finally { setLoading(false); }
    }, [tab, seasonId]);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-6" data-testid="spartans-league-page">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <div className="heading-eyebrow">The gauntlet</div>
                    <h1 className="font-display font-black text-3xl md:text-4xl tracking-tighter mt-1">Spartans League</h1>
                    <p className="text-zinc-400 mt-2 text-sm">Individual, Team, and Season rankings. Only the disciplined climb.</p>
                </div>
                {activeSeason && (
                    <div className="chip-gold self-start md:self-end">
                        <Sparkle size={12} weight="fill" /> {activeSeason.name} · {activeSeason.start_date} → {activeSeason.end_date}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 flex-wrap">
                    {[
                        { key: "individual", label: "Individual", icon: Trophy },
                        { key: "team", label: "Team", icon: Users },
                        { key: "season", label: "Season", icon: Medal },
                    ].map((t) => {
                        const Icon = t.icon;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all inline-flex items-center gap-2 ${tab === t.key ? "bg-yellow-500 text-black shadow-[0_0_16px_rgba(234,179,8,0.4)]" : "text-zinc-400 hover:text-white"}`}
                                data-testid={`league-tab-${t.key}`}
                            >
                                <Icon size={14} weight="fill" /> {t.label}
                            </button>
                        );
                    })}
                </div>

                {(tab === "season") && (
                    <select
                        value={seasonId}
                        onChange={(e) => setSeasonId(e.target.value)}
                        className="field text-sm"
                        data-testid="season-selector"
                    >
                        {seasons.length === 0 && <option value="">No seasons yet</option>}
                        {seasons.map((s) => (
                            <option key={s.season_id} value={s.season_id}>{s.name} ({s.start_date} → {s.end_date})</option>
                        ))}
                    </select>
                )}
            </div>

            {loading && <div className="text-zinc-500 text-sm">Loading league...</div>}

            {tab === "team" && team && (
                <TeamLeagueView data={team} myTeam={user?.team} />
            )}

            {(tab === "individual" || tab === "season") && individual && (
                <IndividualLeagueView data={individual} me={user} isSeasonMode={tab === "season"} />
            )}
        </div>
    );
}

function IndividualLeagueView({ data, me, isSeasonMode }) {
    const rows = data.rows || [];
    const top3 = rows.slice(0, 3);
    const rest = rows.slice(3);

    return (
        <div className="space-y-6">
            {isSeasonMode && data.season && (
                <div className="glass p-4 flex items-center gap-3">
                    <Medal size={22} weight="duotone" className="text-yellow-400" />
                    <div>
                        <div className="text-sm font-bold">{data.season.name}</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                            {data.season.start_date} → {data.season.end_date}
                        </div>
                    </div>
                </div>
            )}
            {top3.length >= 3 && (
                <div className="grid grid-cols-3 gap-2 md:gap-4 items-end">
                    <PodiumCard rank={2} row={top3[1]} borderColor="border-zinc-400" glow="rgba(212,212,216,0.4)" iconColor="text-zinc-300" />
                    <PodiumCard rank={1} row={top3[0]} borderColor="border-yellow-500" glow="rgba(234,179,8,0.6)" iconColor="text-yellow-400" isFirst />
                    <PodiumCard rank={3} row={top3[2]} borderColor="border-amber-700" glow="rgba(180,83,9,0.4)" iconColor="text-amber-500" />
                </div>
            )}

            <div className="glass p-3 md:p-4">
                {rows.length === 0 && <div className="text-center text-zinc-500 py-10 text-sm">No warriors ranked yet in this league.</div>}
                <div className="space-y-2">
                    {(top3.length < 3 ? rows : rest).map((r) => (
                        <motion.div
                            key={r.user_id}
                            whileHover={{ x: 4 }}
                            className={`p-3 md:p-4 rounded-xl flex items-center gap-3 md:gap-4 border transition-all ${r.user_id === me?.user_id ? "bg-yellow-500/10 border-yellow-500/40" : "bg-white/[0.02] border-white/5 hover:bg-white/5"}`}
                            data-testid={`individual-row-${r.user_id}`}
                        >
                            <div className={`w-9 h-9 md:w-10 md:h-10 grid place-items-center rounded-lg font-mono font-bold ${r.rank <= 3 ? "bg-yellow-500 text-black" : "bg-white/5 text-zinc-400"}`}>
                                {r.rank}
                            </div>
                            <Avatar user={r} size={44} />
                            <div className="flex-1 min-w-0">
                                <div className="font-bold truncate flex items-center gap-1 flex-wrap">
                                    {r.name}
                                    <PositionBadges badges={r.position_badges || []} size="xs" limit={2} />
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-[10px] uppercase tracking-widest text-zinc-500 flex-wrap">
                                    <span>{r.team || "Unassigned"}</span>
                                    {r.club_type && <span className="text-blue-400">{r.club_type}</span>}
                                    <span className="text-yellow-500">LVL {r.level}</span>
                                    <span className="flex items-center gap-1"><Fire size={10} weight="fill" className="text-yellow-500" /> {r.streak_current}</span>
                                    <span className="font-mono">{(r.xp || 0).toLocaleString()} XP</span>
                                    {r.attendance_pct > 0 && <span className="text-emerald-400">{r.attendance_pct}% attn</span>}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-yellow-400 font-mono font-black text-lg md:text-xl">{Math.round(r.score).toLocaleString()}</div>
                                <div className="text-[10px] uppercase tracking-widest text-zinc-600">Score</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TeamLeagueView({ data, myTeam }) {
    const teams = data.teams || [];
    return (
        <div className="space-y-4">
            <div className="glass p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkle size={14} weight="fill" className="text-yellow-400" />
                    <span className="heading-eyebrow">Team score formula</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {[
                        { pct: 40, label: "XP", icon: TrendUp, color: "text-yellow-400" },
                        { pct: 25, label: "Attendance", icon: CalendarCheck, color: "text-blue-400" },
                        { pct: 15, label: "Missions", icon: Target, color: "text-emerald-400" },
                        { pct: 10, label: "Tasks", icon: ClipboardText, color: "text-purple-400" },
                        { pct: 10, label: "Goals", icon: Flag, color: "text-orange-400" },
                    ].map((w) => {
                        const Icon = w.icon;
                        return (
                            <div key={w.label} className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                                <Icon size={18} weight="duotone" className={`${w.color} mx-auto`} />
                                <div className="font-display font-black text-lg text-white mt-1">{w.pct}%</div>
                                <div className="text-[9px] uppercase tracking-widest text-zinc-500">{w.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {teams.length === 0 && (
                <div className="glass p-8 text-center text-zinc-500 text-sm">No teams have members yet.</div>
            )}
            {teams.map((t) => (
                <TeamRow key={t.team_id} t={t} isMine={t.name === myTeam} />
            ))}
        </div>
    );
}

function TeamRow({ t, isMine }) {
    const [open, setOpen] = useState(false);
    const rankColors = t.rank === 1 ? "bg-yellow-500 text-black" :
        t.rank === 2 ? "bg-zinc-300 text-black" :
        t.rank === 3 ? "bg-amber-700 text-white" : "bg-white/5 text-zinc-400";
    const leader = t.leader_name ? { name: t.leader_name, avatar_url: t.leader_avatar_url, position_badges: t.leader_badges } : null;
    return (
        <motion.div
            whileHover={{ y: -2 }}
            className={`glass p-4 md:p-5 relative overflow-hidden ${isMine ? "ring-2 ring-yellow-500/50" : ""}`}
            data-testid={`team-league-row-${t.team_id}`}
        >
            {t.rank === 1 && <div className="absolute -top-16 -right-16 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />}
            <div className="relative flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className={`w-12 h-12 md:w-14 md:h-14 grid place-items-center rounded-2xl font-mono font-black text-xl md:text-2xl ${rankColors}`}>
                    {t.rank === 1 ? <Crown size={24} weight="fill" /> : t.rank}
                </div>
                {leader && <Avatar user={leader} size={44} />}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-black text-lg md:text-xl">Team {t.name}</h3>
                        {isMine && <span className="chip-blue">Your team</span>}
                    </div>
                    {leader && (
                        <div className="text-[10px] uppercase tracking-widest text-yellow-500/80 flex items-center gap-2 flex-wrap">
                            <Crown size={10} weight="fill" /> {leader.name}
                            <PositionBadges badges={leader.position_badges} size="xs" limit={2} />
                        </div>
                    )}
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1"><Users size={10} /> {t.members}</span>
                        <span className="flex items-center gap-1"><TrendUp size={10} /> {t.xp} XP</span>
                        <span className="flex items-center gap-1"><Target size={10} /> {t.mission_pct ?? 0}% missions</span>
                        <span className="flex items-center gap-1"><ClipboardText size={10} /> {t.tasks} Tasks</span>
                        <span className="flex items-center gap-1"><Flag size={10} /> {t.goals} Goals</span>
                        <span className="flex items-center gap-1 text-emerald-400"><CalendarCheck size={10} weight="fill" /> {t.attendance_pct}%</span>
                    </div>
                </div>
                <div className="md:min-w-[240px]">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500">Team Score</span>
                        <span className="text-yellow-400 font-mono font-black text-lg">{t.score}</span>
                    </div>
                    <ProgressBar value={t.score} max={100} color="gold" />
                </div>
                <button
                    onClick={() => setOpen(!open)}
                    className="btn-ghost text-xs shrink-0"
                    data-testid={`team-league-expand-${t.team_id}`}
                >
                    <ChartLineUp size={12} /> {open ? "Hide" : "Breakdown"}
                </button>
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4 pt-4 border-t border-white/5">
                            <BreakdownStat label="XP (40%)" pts={t.breakdown.xp_pts} max={40} color="text-yellow-400" />
                            <BreakdownStat label="Attendance (25%)" pts={t.breakdown.attendance_pts} max={25} color="text-blue-400" />
                            <BreakdownStat label="Missions (15%)" pts={t.breakdown.missions_pts} max={15} color="text-emerald-400" />
                            <BreakdownStat label="Tasks (10%)" pts={t.breakdown.tasks_pts} max={10} color="text-purple-400" />
                            <BreakdownStat label="Goals (10%)" pts={t.breakdown.goals_pts} max={10} color="text-orange-400" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function BreakdownStat({ label, pts, max, color }) {
    return (
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 text-center">
            <div className="text-[9px] uppercase tracking-widest text-zinc-500">{label}</div>
            <div className={`font-mono font-black text-sm mt-1 ${color}`}>{pts}<span className="text-zinc-600">/{max}</span></div>
        </div>
    );
}

function PodiumCard({ rank, row, iconColor, borderColor, glow, isFirst }) {
    if (!row) return <div />;
    const Icon = rank === 1 ? Crown : Medal;
    return (
        <div className={`glass p-3 md:p-4 border-2 ${borderColor} text-center relative`}
             style={{ boxShadow: `0 0 30px ${glow}` }}
             data-testid={`podium-${rank}`}
        >
            <Icon size={rank === 1 ? 40 : 32} weight="fill" className={`${iconColor} mx-auto mb-2 ${isFirst ? "float-slow" : ""}`} />
            <div className="mx-auto">
                <Avatar user={row} size={rank === 1 ? 72 : 60} />
            </div>
            <div className="mt-2 font-bold text-xs md:text-sm truncate">{row.name}</div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 truncate">{row.team || "Unassigned"}</div>
            <div className="mt-1 flex items-center justify-center gap-1 flex-wrap">
                <PositionBadges badges={row.position_badges || []} size="xs" limit={2} />
            </div>
            <div className="mt-2 font-mono font-black text-yellow-400 text-base md:text-lg">{Math.round(row.score).toLocaleString()}</div>
            <div className="mt-1 chip-gold mx-auto"><ShieldStar size={10} weight="fill" /> LVL {row.level}</div>
        </div>
    );
}
