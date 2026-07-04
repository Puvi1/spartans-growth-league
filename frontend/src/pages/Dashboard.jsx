import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import XPBar from "@/components/XPBar";
import StreakBadge from "@/components/StreakBadge";
import StatCard from "@/components/StatCard";
import ProgressBar from "@/components/ProgressBar";
import { fireConfetti, fireBigConfetti } from "@/lib/confetti";
import {
    Target, Phone, Calendar, Fire, Trophy, ShieldStar,
    CheckCircle, Sword, Sparkle, ArrowRight, TrendUp,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import CelebrationBanner from "@/components/CelebrationBanner";
import PositionBadges from "@/components/PositionBadges";

export default function Dashboard() {
    const { user, refreshUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [followups, setFollowups] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [checkingIn, setCheckingIn] = useState(false);
    const [unlockedBadge, setUnlockedBadge] = useState(null);

    const load = async () => {
        const [s, lb, fu, ch] = await Promise.all([
            api.get("/dashboard/stats"),
            api.get("/leaderboard?scope=weekly&limit=5"),
            api.get("/followups"),
            api.get("/challenges"),
        ]);
        setStats(s.data);
        setLeaderboard(lb.data);
        setFollowups(fu.data.filter((f) => f.status === "pending").slice(0, 4));
        setChallenges(ch.data.slice(0, 3));
    };

    useEffect(() => { load(); }, []);

    const handleCheckIn = async () => {
        if (checkingIn || stats?.checked_in_today) return;
        setCheckingIn(true);
        try {
            const { data } = await api.post("/checkins/daily");
            fireBigConfetti();
            toast.success(`+10 XP · Streak: ${data.streak_current} day${data.streak_current > 1 ? "s" : ""}!`, {
                icon: "🔥",
            });
            if (data.leveled_up) {
                setTimeout(() => {
                    fireConfetti({ particleCount: 200, spread: 100 });
                    toast.success(`LEVEL UP! You are now level ${data.level}`, { duration: 4000 });
                }, 500);
            }
            if (data.unlocked_badges?.length) {
                setUnlockedBadge(data.unlocked_badges[0]);
            }
            await refreshUser();
            await load();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Check-in failed");
        } finally {
            setCheckingIn(false);
        }
    };

    if (!stats) {
        return <div className="text-zinc-500 text-sm">Loading arena...</div>;
    }

    const dayName = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    return (
        <div className="space-y-6 lg:space-y-8" data-testid="dashboard-page">
            <CelebrationBanner />
            {/* Hero */}
            <section className="glass-strong p-6 md:p-8 relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <div className="heading-eyebrow mb-2">{dayName}</div>
                            <h1 className="font-display font-black text-3xl md:text-4xl lg:text-5xl tracking-tighter">
                                Welcome back,<br />
                                <span className="text-yellow-400">{user?.name?.split(" ")[0] || "Spartan"}.</span>
                            </h1>
                            <p className="mt-3 text-zinc-400 max-w-lg">
                                Every check-in forges discipline. Every prospect fuels the empire.
                            </p>
                            {user?.position_badges?.length > 0 && (
                                <div className="mt-3">
                                    <PositionBadges badges={user.position_badges} />
                                </div>
                            )}
                        </div>
                        <StreakBadge streak={stats.streak_current} longest={stats.streak_longest} />
                    </div>

                    <div className="mt-6">
                        <XPBar
                            xp={stats.xp}
                            current={stats.current_level_xp}
                            next={stats.next_level_xp}
                            level={stats.level}
                            size="lg"
                        />
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleCheckIn}
                            disabled={stats.checked_in_today || checkingIn}
                            className={`btn-gold py-4 text-base w-full sm:w-auto ${stats.checked_in_today ? "opacity-60 cursor-not-allowed" : ""}`}
                            data-testid="daily-checkin-btn"
                        >
                            {stats.checked_in_today ? (
                                <>
                                    <CheckCircle size={20} weight="fill" /> Checked in today
                                </>
                            ) : (
                                <>
                                    <Sword size={20} weight="fill" /> Daily Check-In · +10 XP
                                </>
                            )}
                        </button>
                        <Link to="/challenges" className="btn-glass py-4 w-full sm:w-auto">
                            <Fire size={20} weight="duotone" /> View Challenges
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats bento */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Target} label="Prospects" value={stats.prospects_count} sublabel={`${stats.prospects_won} closed`} tone="gold" testId="stat-prospects" />
                <StatCard icon={Phone} label="Follow-ups" value={stats.pending_followups} sublabel="pending" tone="blue" testId="stat-followups" />
                <StatCard icon={Calendar} label="Attendance" value={stats.total_attendance} sublabel="events logged" tone="emerald" testId="stat-attendance" />
                <StatCard icon={TrendUp} label="Weekly XP" value={stats.weekly_xp} sublabel="last 7 days" tone="zinc" testId="stat-weekly-xp" />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Weekly leaderboard */}
                <div className="glass p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <div className="heading-eyebrow">Weekly rally</div>
                            <h3 className="font-display text-xl font-bold mt-1">Top Warriors</h3>
                        </div>
                        <Link to="/leaderboard" className="btn-ghost text-sm">See all <ArrowRight size={14} /></Link>
                    </div>
                    <div className="space-y-2">
                        {leaderboard.length === 0 && (
                            <div className="text-zinc-500 text-sm">No XP earned yet this week. Be the first!</div>
                        )}
                        {leaderboard.map((row) => (
                            <div key={row.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors">
                                <div className={`w-8 h-8 grid place-items-center rounded-lg font-bold text-sm ${
                                    row.rank === 1 ? "bg-yellow-500 text-black" :
                                    row.rank === 2 ? "bg-zinc-300 text-black" :
                                    row.rank === 3 ? "bg-amber-700 text-white" : "bg-white/5 text-zinc-400"
                                }`}>
                                    {row.rank}
                                </div>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-500 to-blue-500 grid place-items-center font-bold text-black text-xs">
                                    {row.name?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold truncate">{row.name}</div>
                                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                                        {row.team} · LVL {row.level}
                                    </div>
                                </div>
                                <div className="text-yellow-400 font-mono font-bold text-sm">
                                    +{row.xp.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming follow-ups */}
                <div className="glass p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <div className="heading-eyebrow">Next moves</div>
                            <h3 className="font-display text-xl font-bold mt-1">Follow-Ups</h3>
                        </div>
                        <Link to="/followups" className="btn-ghost text-sm"><ArrowRight size={14} /></Link>
                    </div>
                    <div className="space-y-2">
                        {followups.length === 0 && <div className="text-zinc-500 text-sm">All clear. Add new follow-ups from the Follow-Ups page.</div>}
                        {followups.map((f) => (
                            <div key={f.followup_id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <div className="text-sm font-semibold truncate">{f.title}</div>
                                <div className="text-xs text-zinc-500 mt-0.5">Due {f.due_date}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Active challenges preview */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="heading-eyebrow">Live missions</div>
                        <h3 className="font-display text-2xl font-bold mt-1">Active Challenges</h3>
                    </div>
                    <Link to="/challenges" className="btn-ghost text-sm">All challenges <ArrowRight size={14} /></Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {challenges.map((c) => {
                        const pct = Math.min(100, ((c.progress || 0) / c.goal) * 100);
                        return (
                            <div key={c.challenge_id} className="glass p-5 relative overflow-hidden">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className={c.type === "monthly" ? "chip-blue" : "chip-gold"}>
                                            {c.type}
                                        </div>
                                        <h4 className="font-display font-bold text-lg mt-3">{c.title}</h4>
                                    </div>
                                    <Fire size={28} weight="duotone" className="text-yellow-500/60" />
                                </div>
                                <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{c.description}</p>
                                <div className="flex items-center justify-between mb-2 text-xs">
                                    <span className="text-zinc-500 uppercase tracking-widest">Progress</span>
                                    <span className="font-mono font-bold text-white">{c.progress || 0}/{c.goal}</span>
                                </div>
                                <ProgressBar value={c.progress || 0} max={c.goal} color={c.type === "monthly" ? "blue" : "gold"} />
                                <div className="mt-3 flex items-center justify-between text-xs">
                                    <span className="text-zinc-500">Reward</span>
                                    <span className="text-yellow-400 font-mono font-bold">+{c.xp_reward} XP</span>
                                </div>
                            </div>
                        );
                    })}
                    {challenges.length === 0 && <div className="text-zinc-500 text-sm col-span-3">No active challenges.</div>}
                </div>
            </section>

            {/* Achievement Unlock Modal */}
            <AnimatePresence>
                {unlockedBadge && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setUnlockedBadge(null)}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md grid place-items-center p-6"
                        data-testid="badge-unlock-modal"
                    >
                        <motion.div
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass-strong p-8 max-w-sm text-center relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="heading-eyebrow mb-2">Achievement Unlocked</div>
                            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 grid place-items-center shadow-[0_0_40px_rgba(234,179,8,0.7)] mb-4">
                                <ShieldStar size={48} weight="fill" className="text-black" />
                            </div>
                            <h3 className="font-display text-2xl font-black">{unlockedBadge.name}</h3>
                            <p className="text-zinc-400 text-sm mt-2">{unlockedBadge.description}</p>
                            <div className="mt-4 chip-gold mx-auto"><Sparkle size={12} weight="fill" /> +{unlockedBadge.xp_reward} XP</div>
                            <button onClick={() => setUnlockedBadge(null)} className="btn-gold w-full mt-6" data-testid="badge-modal-close">
                                Claim & Continue
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
