import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Target, Trophy, Fire, Phone, Calendar, ChartLine, Users, Sparkle, FileCsv, FilePdf } from "@phosphor-icons/react";
import StatCard from "@/components/StatCard";
import { motion } from "framer-motion";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function download(url) {
    const token = localStorage.getItem("sgl_access_token");
    fetch(url, { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then((r) => { if (!r.ok) throw new Error("Download failed"); return r.blob().then((b) => ({ b, r })); })
        .then(({ b, r }) => {
            const cd = r.headers.get("content-disposition") || "";
            const name = /filename="([^"]+)"/.exec(cd)?.[1] || "report";
            const a = document.createElement("a");
            a.href = URL.createObjectURL(b);
            a.download = name;
            a.click();
            URL.revokeObjectURL(a.href);
        })
        .catch(() => alert("Export failed"));
}

function ExportBar({ scope, label }) {
    // scope options: 'daily','weekly','attendance','xp','team-performance','missions','tasks','goals','followups','league-individual','league-team'
    const map = {
        daily: `/api/exports/daily`,
        weekly: `/api/exports/xp-leaderboard?scope=weekly`,
        attendance: `/api/exports/attendance`,
        xp: `/api/exports/xp-leaderboard?scope=all`,
        "team-performance": `/api/exports/team-performance`,
        missions: `/api/exports/missions`,
        tasks: `/api/exports/tasks`,
        goals: `/api/exports/goals`,
        followups: `/api/exports/followups`,
        "league-individual": `/api/exports/spartans-league?scope=individual`,
        "league-team": `/api/exports/spartans-league?scope=team`,
    };
    const url = BACKEND_URL + map[scope];
    return (
        <div className="flex items-center gap-2" data-testid={`export-bar-${scope}`}>
            {label && <span className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>}
            <button
                onClick={() => download(url + (url.includes("?") ? "&" : "?") + "format=csv")}
                className="btn-glass py-2 px-3 text-xs"
                data-testid={`export-csv-${scope}`}
            >
                <FileCsv size={14} weight="duotone" /> CSV
            </button>
            <button
                onClick={() => download(url + (url.includes("?") ? "&" : "?") + "format=pdf")}
                className="btn-glass py-2 px-3 text-xs"
                data-testid={`export-pdf-${scope}`}
            >
                <FilePdf size={14} weight="duotone" /> PDF
            </button>
        </div>
    );
}

function ExportCenter() {
    const rows = [
        { scope: "missions", label: "Missions" },
        { scope: "tasks", label: "Tasks" },
        { scope: "goals", label: "Goals" },
        { scope: "followups", label: "Follow-Ups" },
        { scope: "attendance", label: "Attendance (latest season)" },
        { scope: "league-individual", label: "Spartans League — Individual" },
        { scope: "league-team", label: "Spartans League — Team" },
        { scope: "team-performance", label: "Team Performance" },
        { scope: "xp", label: "XP Leaderboard (all-time)" },
        { scope: "weekly", label: "XP Leaderboard (weekly)" },
        { scope: "daily", label: "Daily XP Snapshot" },
    ];
    return (
        <section className="glass p-5" data-testid="export-center">
            <div className="flex items-center gap-2 mb-4">
                <FilePdf size={20} weight="duotone" className="text-yellow-400" />
                <div>
                    <div className="heading-eyebrow">Command exports</div>
                    <h3 className="font-display font-bold text-lg mt-0.5">Report Export Center</h3>
                </div>
            </div>
            <div className="divide-y divide-white/5">
                {rows.map((r) => (
                    <div key={r.scope} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3">
                        <div className="text-sm font-semibold">{r.label}</div>
                        <ExportBar scope={r.scope} />
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function Reports() {
    const { user } = useAuth();
    const [me, setMe] = useState(null);
    const [team, setTeam] = useState(null);
    const [global, setGlobal] = useState(null);
    const [tab, setTab] = useState("me");

    const canTeam = user?.role === "team_leader" || user?.role === "super_admin";
    const canGlobal = user?.role === "super_admin";

    useEffect(() => {
        api.get("/reports/me").then((r) => setMe(r.data)).catch(() => {});
        if (user?.role === "team_leader") {
            api.get("/reports/team").then((r) => setTeam(r.data)).catch(() => {});
        }
        if (user?.role === "super_admin") {
            api.get("/reports/global").then((r) => setGlobal(r.data)).catch(() => {});
        }
    }, [user]);

    return (
        <div className="space-y-6" data-testid="reports-page">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <div className="heading-eyebrow">Battle metrics</div>
                    <h1 className="font-display font-black text-3xl md:text-4xl tracking-tighter mt-1">Reports</h1>
                    <p className="text-zinc-400 mt-2 text-sm">Data-driven proof of your rise.</p>
                </div>
                {canTeam && (
                    <div className="flex flex-wrap items-center gap-4">
                        <ExportBar scope="daily" />
                        <ExportBar scope="team-performance" />
                    </div>
                )}
            </div>

            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
                <TabBtn active={tab === "me"} onClick={() => setTab("me")} testId="report-tab-me">Personal</TabBtn>
                {canTeam && <TabBtn active={tab === "team"} onClick={() => setTab("team")} testId="report-tab-team">Team</TabBtn>}
                {canGlobal && <TabBtn active={tab === "global"} onClick={() => setTab("global")} testId="report-tab-global">Global</TabBtn>}
            </div>

            {tab === "me" && me && <PersonalReport data={me} />}
            {tab === "team" && canTeam && <TeamReport initialData={team} isSuperAdmin={user.role === "super_admin"} />}
            {tab === "global" && global && <GlobalReport data={global} />}

            {canTeam && <ExportCenter />}
        </div>
    );
}

function TabBtn({ active, onClick, children, testId }) {
    return (
        <button
            onClick={onClick}
            data-testid={testId}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                active ? "bg-yellow-500 text-black" : "text-zinc-400 hover:text-white"
            }`}
        >
            {children}
        </button>
    );
}

function PersonalReport({ data }) {
    const max = Math.max(1, ...data.timeline.map((t) => t.xp));
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Fire} label="Check-ins" value={data.checkins} tone="gold" testId="report-me-checkins" />
                <StatCard icon={Target} label="Prospects" value={data.prospects} sublabel={`${data.won} won`} tone="blue" testId="report-me-prospects" />
                <StatCard icon={Phone} label="Follow-ups" value={data.followups_done} sublabel={`${data.followups_pending} pending`} tone="emerald" testId="report-me-followups" />
                <StatCard icon={Calendar} label="Attendance" value={data.attendance} tone="zinc" testId="report-me-attendance" />
            </div>

            <div className="glass p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="heading-eyebrow">Last 14 days</div>
                        <h3 className="font-display font-bold text-lg mt-1">XP Momentum</h3>
                    </div>
                    <div className="chip-gold">+{data.xp_30d.toLocaleString()} XP · 30d</div>
                </div>
                <div className="flex items-end gap-1.5 h-40" data-testid="report-timeline">
                    {data.timeline.map((d) => {
                        const h = Math.max(4, (d.xp / max) * 100);
                        return (
                            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                                <div className="text-[9px] text-zinc-600 group-hover:text-yellow-400 transition-colors font-mono">{d.xp || ""}</div>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ duration: 0.7, delay: 0.02 }}
                                    className="w-full rounded-t-md bg-gradient-to-t from-yellow-600 to-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.3)] hover:from-yellow-500 hover:to-yellow-300"
                                />
                                <div className="text-[9px] text-zinc-600">{d.date.slice(5)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReportCard title="Conversion Rate" value={`${data.conversion_rate}%`} sub={`${data.won} of ${data.prospects}`} tone="emerald" />
                <ReportCard title="Follow-through" value={data.followups_done + data.followups_pending > 0 ? `${Math.round((data.followups_done / (data.followups_done + data.followups_pending)) * 100)}%` : "—"} sub={`${data.followups_done} of ${data.followups_done + data.followups_pending}`} tone="blue" />
                <ReportCard title="Discipline" value={data.checkins} sub="lifetime check-ins" tone="gold" />
            </div>
        </div>
    );
}

function TeamReport({ initialData, isSuperAdmin }) {
    const [data, setData] = useState(initialData);
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState("");

    useEffect(() => {
        if (isSuperAdmin) {
            api.get("/teams").then((r) => {
                setTeams(r.data);
                if (r.data.length > 0) {
                    setSelectedTeam(r.data[0].team_id);
                }
            });
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        if (isSuperAdmin && selectedTeam) {
            api.get(`/reports/team?team_id=${selectedTeam}`).then((r) => setData(r.data));
        }
    }, [selectedTeam, isSuperAdmin]);

    if (!data) {
        return (
            <div className="glass p-6 text-center">
                {isSuperAdmin ? (
                    <div>
                        <ChartLine size={40} weight="duotone" className="text-zinc-700 mx-auto" />
                        <div className="mt-3 text-zinc-500 text-sm">Select a team to view report</div>
                        {teams.length > 0 && (
                            <select onChange={(e) => setSelectedTeam(e.target.value)} className="field mt-4 max-w-xs mx-auto">
                                {teams.map((t) => <option key={t.team_id} value={t.team_id}>Team {t.name}</option>)}
                            </select>
                        )}
                    </div>
                ) : (
                    <div className="text-zinc-500 text-sm">Loading team report...</div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {isSuperAdmin && (
                <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-widest text-zinc-500">Viewing:</span>
                    <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="field max-w-xs" data-testid="team-selector">
                        {teams.map((t) => <option key={t.team_id} value={t.team_id}>Team {t.name}</option>)}
                    </select>
                </div>
            )}
            <div className="glass-strong p-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-blue-500 grid place-items-center font-display font-black text-black text-3xl">
                        {data.team.name[0]}
                    </div>
                    <div>
                        <h2 className="font-display font-black text-2xl">Team {data.team.name}</h2>
                        <div className="text-sm text-zinc-400">{data.totals.members} members · {data.totals.active_today} active today</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard icon={Users} label="Members" value={data.totals.members} tone="gold" />
                <StatCard icon={Target} label="Prospects" value={data.totals.prospects} tone="blue" />
                <StatCard icon={Trophy} label="Wins" value={data.totals.won} sublabel={`${data.totals.conversion_rate}%`} tone="emerald" />
                <StatCard icon={Fire} label="Check-ins" value={data.totals.checkins} tone="gold" />
                <StatCard icon={Phone} label="Follow-ups" value={data.totals.followups_done} tone="blue" />
                <StatCard icon={Sparkle} label="Total XP" value={data.totals.xp.toLocaleString()} tone="zinc" />
            </div>

            <div className="glass p-4 md:p-6">
                <h3 className="font-display font-bold text-lg mb-4">Member Performance</h3>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-widest text-zinc-500">
                                <th className="text-left py-2 px-3">Warrior</th>
                                <th className="text-left py-2 px-3">Level</th>
                                <th className="text-left py-2 px-3">XP</th>
                                <th className="text-left py-2 px-3">Prospects</th>
                                <th className="text-left py-2 px-3">Wins</th>
                                <th className="text-left py-2 px-3">Follow-Ups</th>
                                <th className="text-left py-2 px-3">Events</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.members.map((m) => (
                                <tr key={m.user_id} className="border-t border-white/5">
                                    <td className="py-3 px-3 text-sm font-semibold">{m.name}</td>
                                    <td className="py-3 px-3"><span className="chip-gold">LVL {m.level}</span></td>
                                    <td className="py-3 px-3 font-mono text-yellow-400 text-sm">{m.xp.toLocaleString()}</td>
                                    <td className="py-3 px-3 text-sm">{m.prospects}</td>
                                    <td className="py-3 px-3 text-emerald-400 font-bold text-sm">{m.won}</td>
                                    <td className="py-3 px-3 text-sm">{m.followups_done}</td>
                                    <td className="py-3 px-3 text-sm">{m.attendance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function GlobalReport({ data }) {
    const maxTeamXp = Math.max(1, ...data.teams.map((t) => t.xp));
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Users" value={data.totals.users} tone="gold" />
                <StatCard icon={ChartLine} label="Teams" value={data.totals.teams} tone="blue" />
                <StatCard icon={Target} label="Prospects" value={data.totals.prospects} tone="emerald" />
                <StatCard icon={Trophy} label="Deals Won" value={data.totals.won} sublabel={`${data.totals.conversion_rate}% conv.`} tone="zinc" />
            </div>

            <div className="glass p-6">
                <h3 className="font-display font-bold text-lg mb-4">Team Standings</h3>
                <div className="space-y-3">
                    {data.teams.sort((a, b) => b.xp - a.xp).map((t, i) => (
                        <div key={t.team_id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5" data-testid={`global-team-${t.team_id}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 grid place-items-center rounded-lg font-mono font-bold text-sm ${
                                        i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-zinc-300 text-black" : i === 2 ? "bg-amber-700 text-white" : "bg-white/5 text-zinc-400"
                                    }`}>{i + 1}</div>
                                    <div>
                                        <div className="font-bold">Team {t.name}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-zinc-500">{t.members} members · {t.won} wins · {t.conversion_rate}% conv.</div>
                                    </div>
                                </div>
                                <div className="text-yellow-400 font-mono font-black">{t.xp.toLocaleString()}</div>
                            </div>
                            <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }} animate={{ width: `${(t.xp / maxTeamXp) * 100}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                    className="h-full bg-gradient-to-r from-yellow-500 to-blue-500"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ReportCard({ title, value, sub, tone }) {
    const tones = {
        gold: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
        blue: "border-blue-500/20 bg-blue-500/5 text-blue-400",
        emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    };
    return (
        <div className={`p-6 rounded-2xl border ${tones[tone]}`}>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">{title}</div>
            <div className="font-display text-4xl font-black mt-2">{value}</div>
            <div className="text-xs text-zinc-400 mt-1">{sub}</div>
        </div>
    );
}
