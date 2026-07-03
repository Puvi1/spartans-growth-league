import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { motion } from "framer-motion";
import { Sword, GoogleLogo, Envelope, LockKey, User as UserIcon, ArrowRight, ShieldStar, Trophy, Fire } from "@phosphor-icons/react";
import { toast } from "sonner";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
function googleLogin() {
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
}

export default function AuthPage() {
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            if (mode === "login") {
                await login(email, password);
                toast.success("Welcome back, Spartan!");
                navigate(from, { replace: true });
            } else {
                const payload = { email, password, name };
                if (phone) payload.phone = phone;
                await register(payload);
                toast.success("Your Spartan journey begins now!");
                // New users go straight to profile completion
                navigate("/profile", { replace: true, state: { first_time: true } });
            }
        } catch (err) {
            setError(formatApiError(err.response?.data?.detail) || err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050507] text-white flex relative overflow-hidden">
            {/* Left branding pane */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage:
                            "url('https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbmVvbiUyMGJsdWUlMjBnZW9tZXRyaWMlMjBhYnN0cmFjdHxlbnwwfHx8fDE3ODMxMDE4MzR8MA&ixlib=rb-4.1.0&q=85')",
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/70 to-black/95" />
                <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500 text-black grid place-items-center shadow-[0_0_25px_rgba(234,179,8,0.6)]">
                            <Sword size={26} weight="fill" />
                        </div>
                        <div>
                            <div className="font-display font-black text-xl">SPARTANS</div>
                            <div className="text-[11px] uppercase tracking-[0.3em] text-yellow-500/90">Growth League</div>
                        </div>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <div className="heading-eyebrow mb-4">Level up your team</div>
                        <h1 className="font-display font-black tracking-tighter text-5xl xl:text-6xl leading-[1.05]">
                            Where <span className="text-yellow-400">discipline</span> meets{" "}
                            <span className="text-blue-400">domination.</span>
                        </h1>
                        <p className="mt-6 text-zinc-400 text-base max-w-md leading-relaxed">
                            The gamified performance arena for elite crypto network marketers. Track every prospect, crush every challenge, out-hustle every rival.
                        </p>

                        <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
                            <FeaturePill icon={Fire} label="Streaks" color="text-yellow-400" />
                            <FeaturePill icon={Trophy} label="Leaderboards" color="text-blue-400" />
                            <FeaturePill icon={ShieldStar} label="Badges" color="text-emerald-400" />
                        </div>
                    </motion.div>

                    <div className="text-xs text-zinc-600 tracking-widest uppercase">
                        © Spartans League · Built for winners
                    </div>
                </div>
            </div>

            {/* Right form pane */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
                <div className="absolute inset-0 radial-gold pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="glass-strong w-full max-w-md p-8 relative"
                >
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-11 h-11 rounded-xl bg-yellow-500 text-black grid place-items-center shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                            <Sword size={22} weight="fill" />
                        </div>
                        <div>
                            <div className="font-display font-black">SPARTANS</div>
                            <div className="text-[10px] uppercase tracking-[0.3em] text-yellow-500/80">Growth League</div>
                        </div>
                    </div>

                    <div className="heading-eyebrow mb-2">
                        {mode === "login" ? "Enter the arena" : "Forge your legend"}
                    </div>
                    <h2 className="font-display font-black text-3xl tracking-tight mb-6">
                        {mode === "login" ? "Welcome back, Spartan" : "Join the League"}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300" data-testid="auth-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        {mode === "register" && (
                            <IconInput
                                icon={UserIcon}
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                testId="auth-name-input"
                                required
                            />
                        )}
                        <IconInput
                            icon={Envelope}
                            type="email"
                            placeholder="you@spartans.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            testId="auth-email-input"
                            required
                            autoComplete="email"
                        />
                        <IconInput
                            icon={LockKey}
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            testId="auth-password-input"
                            required
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                        />

                        {mode === "register" && (
                            <IconInput
                                icon={Envelope}
                                type="tel"
                                placeholder="Mobile number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                testId="auth-phone-input"
                                required
                            />
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-gold w-full mt-2 py-3.5"
                            data-testid="auth-submit-btn"
                        >
                            {submitting ? "Entering..." : (mode === "login" ? "Enter The Arena" : "Begin Your Journey")}
                            <ArrowRight size={18} weight="bold" />
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1" />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600">or</span>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>

                    <button
                        onClick={googleLogin}
                        className="btn-glass w-full py-3.5"
                        data-testid="google-login-btn"
                    >
                        <GoogleLogo size={20} weight="bold" />
                        Continue with Google
                    </button>

                    <div className="mt-6 text-center text-sm text-zinc-500">
                        {mode === "login" ? "New to the League?" : "Already a Spartan?"}{" "}
                        <button
                            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                            className="text-yellow-400 hover:text-yellow-300 font-bold"
                            data-testid="auth-toggle-mode"
                        >
                            {mode === "login" ? "Enlist now" : "Log in"}
                        </button>
                    </div>

                    <div className="mt-6 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-[11px] text-zinc-500 leading-relaxed">
                        <span className="text-blue-400 font-bold uppercase tracking-widest">Demo:</span>{" "}
                        admin@spartans.com / Spartan123!
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function IconInput({ icon: Icon, testId, ...rest }) {
    return (
        <div className="relative">
            <Icon size={18} weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input {...rest} data-testid={testId} className="field pl-11" />
        </div>
    );
}

function FeaturePill({ icon: Icon, label, color }) {
    return (
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <Icon size={22} weight="duotone" className={color} />
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{label}</div>
        </div>
    );
}
