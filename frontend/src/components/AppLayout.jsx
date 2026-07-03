import { Link, NavLink, useNavigate } from "react-router-dom";
import {
    House, Target, Phone, Trophy, User, ChartLine,
    Sword, SignOut, ShieldStar, Calendar, Fire,
    Users, UsersThree, ChartBar, Crosshair, CalendarCheck, ClipboardText, MedalMilitary, GameController, Gift,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

const BASE_NAV = [
    { to: "/", icon: House, label: "Dashboard", testId: "nav-dashboard" },
    { to: "/missions", icon: Crosshair, label: "Missions", testId: "nav-missions" },
    { to: "/weekly-attendance", icon: CalendarCheck, label: "Attendance", testId: "nav-weekly" },
    { to: "/seasons", icon: MedalMilitary, label: "Seasons", testId: "nav-seasons", requiresSeasonAccess: true },
    { to: "/tasks", icon: ClipboardText, label: "Tasks", testId: "nav-tasks" },
    { to: "/team-league", icon: GameController, label: "Team League", testId: "nav-team-league" },
    { to: "/leaderboard", icon: Trophy, label: "League", testId: "nav-leaderboard" },
    { to: "/rewards", icon: Gift, label: "Rewards", testId: "nav-rewards" },
    { to: "/prospects", icon: Target, label: "Prospects", testId: "nav-prospects" },
    { to: "/followups", icon: Phone, label: "Follow-Ups", testId: "nav-followups" },
    { to: "/challenges", icon: Fire, label: "Challenges", testId: "nav-challenges" },
    { to: "/reports", icon: ChartBar, label: "Reports", testId: "nav-reports" },
    { to: "/profile", icon: User, label: "Profile", testId: "nav-profile" },
];

const LEADER_NAV = { to: "/my-team", icon: UsersThree, label: "My Team", testId: "nav-my-team" };
const ADMIN_USERS_NAV = { to: "/admin", icon: Users, label: "All Users", testId: "nav-admin" };
const ADMIN_TEAMS_NAV = { to: "/teams", icon: ChartLine, label: "Teams", testId: "nav-teams" };

function navForRole(role, club) {
    // Filter out Seasons for Decider club
    const base = BASE_NAV.filter((n) => !n.requiresSeasonAccess || club !== "decider");
    if (role === "super_admin") return [...base, ADMIN_USERS_NAV, ADMIN_TEAMS_NAV];
    if (role === "team_leader") return [...base, LEADER_NAV];
    return base;
}

export default function AppLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const nav = navForRole(user?.role, user?.club_type);

    const initials = (user?.name || "S").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

    const handleLogout = async () => {
        await logout();
        navigate("/auth", { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#050507] text-white relative">
            {/* Ambient glow */}
            <div className="pointer-events-none fixed inset-0 radial-gold" />

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-white/5 bg-[#08080b]/80 backdrop-blur-xl z-30">
                <div className="p-6 border-b border-white/5">
                    <Link to="/" className="flex items-center gap-3" data-testid="brand-logo">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500 text-black grid place-items-center shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                            <Sword size={22} weight="fill" />
                        </div>
                        <div>
                            <div className="font-display font-black text-white leading-none">SPARTANS</div>
                            <div className="text-[10px] uppercase tracking-[0.3em] text-yellow-500/80 mt-1">Growth League</div>
                        </div>
                    </Link>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {nav.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/"}
                            data-testid={item.testId}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive
                                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.15)]"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                                }`
                            }
                        >
                            <item.icon size={20} weight="duotone" />
                            <span className="font-semibold text-sm">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-blue-500 grid place-items-center font-bold text-black text-sm">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white truncate" data-testid="sidebar-user-name">{user?.name}</div>
                            <div className="text-[10px] uppercase tracking-widest text-yellow-500/80">
                                {user?.role?.replace("_", " ")}
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            data-testid="sidebar-logout-btn"
                            title="Logout"
                        >
                            <SignOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Top Bar */}
            <header className="lg:hidden sticky top-0 z-30 bg-[#08080b]/90 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center justify-between px-4 py-3">
                    <Link to="/" className="flex items-center gap-2" data-testid="brand-logo-mobile">
                        <div className="w-9 h-9 rounded-lg bg-yellow-500 text-black grid place-items-center shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                            <Sword size={18} weight="fill" />
                        </div>
                        <div className="font-display font-black text-sm">SPARTANS</div>
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="chip-gold" data-testid="mobile-level-chip">
                            <ShieldStar size={12} weight="fill" /> LVL {user?.level || 1}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg text-zinc-400 hover:text-red-400"
                            data-testid="mobile-logout-btn"
                        >
                            <SignOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <motion.main
                key={typeof window !== "undefined" ? window.location.pathname : "root"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="lg:pl-64 pb-24 lg:pb-8 relative"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    {children}
                </div>
            </motion.main>

            {/* Mobile Bottom Nav */}
            <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#08080b]/95 backdrop-blur-2xl border-t border-white/10">
                <div className="grid grid-cols-5 gap-1 px-2 py-2">
                    {BASE_NAV.slice(0, 5).map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/"}
                            data-testid={`mobile-${item.testId}`}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                                    isActive ? "text-yellow-400 bg-yellow-500/10" : "text-zinc-500"
                                }`
                            }
                        >
                            <item.icon size={20} weight="duotone" />
                            <span className="text-[10px] font-semibold">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
}
