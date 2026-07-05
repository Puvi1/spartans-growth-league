import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import XPBar from "@/components/XPBar";
import ProgressBar from "@/components/ProgressBar";
import { ShieldStar, Sword, Trophy, Fire, LockKey, Sparkle, PencilSimple, Check, X } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { fireBigConfetti } from "@/lib/confetti";
import PositionBadges from "@/components/PositionBadges";
import AvatarUploader from "@/components/AvatarUploader";

export default function Profile() {
    const { user, refreshUser } = useAuth();
    const location = useLocation();
    const isFirstTime = location.state?.first_time;
    const [badges, setBadges] = useState([]);
    const [stats, setStats] = useState(null);
    const [completion, setCompletion] = useState(null);
    const [editing, setEditing] = useState(!!isFirstTime);
    const [availableTeams, setAvailableTeams] = useState([]);
    const [form, setForm] = useState({ phone: "", bio: "", avatar_url: "" });

    const loadCompletion = async () => {
        const { data } = await api.get("/profile/completion");
        setCompletion(data);
    };

    useEffect(() => {
        api.get("/badges").then((r) => setBadges(r.data));
        api.get("/dashboard/stats").then((r) => setStats(r.data));
        api.get("/teams/public").then((r) => setAvailableTeams(r.data)).catch(() => {});
        loadCompletion();
    }, []);

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                phone: user.phone || "",
                bio: user.bio || "",
                avatar_url: user.avatar_url || "",
                nexus_id: user.nexus_id || "",
                team_id: user.team_id || "",
                dob: user.dob || "",
                gender: user.gender || "",
                marital_status: user.marital_status || "",
                anniversary_date: user.anniversary_date || "",
                anniversary_photo: user.anniversary_photo || "",
                city: user.city || "",
                state: user.state || "",
                joining_date: user.joining_date || "",
                club_type: user.club_type || "",
                favourite_food: user.favourite_food || "",
                favourite_place: user.favourite_place || "",
                favourite_hobby: user.favourite_hobby || "",
            });
        }
    }, [user]);

   const saveProfile = async (e) => {
    e.preventDefault();

    const requiredFields = [
        ["name", "Full Name"],
        ["dob", "Date of Birth"],
        ["gender", "Gender"],
        ["marital_status", "Marital Status"],
        ["city", "City"],
        ["state", "State"],
        ["club_type", "Club Type"],
    ];

    const missing = requiredFields.filter(([key]) => !form[key]?.trim());

    if (missing.length > 0) {
        toast.error(`Please fill: ${missing.map(([, label]) => label).join(", ")}`);
        return;
    }

    try {
        const payload = {};
        Object.entries(form).forEach(([k, v]) => {
            if (v !== "" && v !== null && v !== undefined && k !== "team_id") payload[k] = v;
        });

        const { data } = await api.patch("/profile", payload);

        if (form.team_id && form.team_id !== user.team_id) {
            await api.post(`/profile/join-team?team_id=${form.team_id}`);
        }

        if (data.xp) {
            fireBigConfetti();
            toast.success("Profile complete! +50 XP");
        } else {
            toast.success("Profile updated");
        }

        setEditing(false);
        await refreshUser();
        await loadCompletion();
    } catch (err) {
        toast.error(err.response?.data?.detail || "Please check your details and try again");
    }
};

    if (!user || !stats) return <div className="text-zinc-500 text-sm">Loading...</div>;

    const initials = user.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
    const unlocked = badges.filter((b) => b.unlocked);
    const missingLabels = {
        avatar_url: "Avatar", team_id: "Team", phone: "Phone", bio: "Bio",
        dob: "Date of Birth", gender: "Gender", marital_status: "Marital status",
        city: "City", state: "State", club_type: "Club Type",
        favourite_food: "Fav. Food", favourite_place: "Fav. Place", favourite_hobby: "Fav. Hobby",
    };
    const locked = badges.filter((b) => !b.unlocked);

    const circumference = 2 * Math.PI * 88;
    const pctVal = (((stats.xp - stats.current_level_xp) / Math.max(1, stats.next_level_xp - stats.current_level_xp)) * 100) || 0;
    const offset = circumference - (pctVal / 100) * circumference;

    return (
        <div className="space-y-8" data-testid="profile-page">
            {isFirstTime && (
                <div className="glass-strong p-5 border border-yellow-500/40 bg-yellow-500/5" data-testid="first-time-banner">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                            <Sparkle size={22} weight="fill" />
                        </div>
                        <div>
                            <h3 className="font-display font-black text-xl">Welcome to the League, {user.name.split(" ")[0]}!</h3>
                            <p className="text-sm text-zinc-400 mt-1">
                                Complete your profile below to unlock the dashboard. Fill Date of Birth, Gender, Marital Status, City, State, and choose your Club + Team to proceed.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <section className="glass-strong p-6 md:p-10 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* Avatar with XP ring */}
                    <div className="relative w-52 h-52">
                        <svg className="absolute inset-0 -rotate-90" width="208" height="208" viewBox="0 0 208 208">
                            <circle cx="104" cy="104" r="88" stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
                            <motion.circle
                                cx="104" cy="104" r="88" fill="none"
                                stroke="url(#xp-grad)" strokeWidth="12" strokeLinecap="round"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: offset }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                            <defs>
                                <linearGradient id="xp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#EAB308" />
                                    <stop offset="100%" stopColor="#3B82F6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-4 rounded-full overflow-hidden bg-gradient-to-br from-yellow-500 to-blue-500 grid place-items-center font-display font-black text-6xl text-black">
                            <AvatarUploader user={user} size={168} onUploaded={() => refreshUser?.()} />
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 chip-gold shadow-lg">
                            <ShieldStar size={12} weight="fill" /> LVL {stats.level}
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="heading-eyebrow">{user.role?.replace("_", " ")}</div>
                        <h1 className="font-display font-black text-3xl md:text-5xl tracking-tighter mt-1" data-testid="profile-name">
                            {user.name}
                        </h1>
                        <div className="text-zinc-500 mt-2">{user.email}</div>
                        {user.nexus_id && (
                            <div className="mt-1 text-[10px] uppercase tracking-widest text-yellow-400 font-mono" data-testid="profile-nexus-display">
                                Nexus · {user.nexus_id}
                            </div>
                        )}
                        <div className="mt-3 flex items-center gap-2 flex-wrap justify-center md:justify-start">
                            <span className="chip-blue">Team {user.team || "Unassigned"}</span>
                            <PositionBadges badges={user.position_badges || []} size="sm" />
                        </div>

                        <div className="mt-6 max-w-md mx-auto md:mx-0">
                            <XPBar xp={stats.xp} current={stats.current_level_xp} next={stats.next_level_xp} level={stats.level} />
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-6 max-w-md mx-auto md:mx-0">
                            <div className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <Fire size={22} weight="duotone" className="text-yellow-400 mx-auto" />
                                <div className="font-display font-black text-2xl mt-1">{stats.streak_current}</div>
                                <div className="text-[9px] uppercase tracking-widest text-zinc-500">Streak</div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <Trophy size={22} weight="duotone" className="text-blue-400 mx-auto" />
                                <div className="font-display font-black text-2xl mt-1">{stats.prospects_won}</div>
                                <div className="text-[9px] uppercase tracking-widest text-zinc-500">Wins</div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <ShieldStar size={22} weight="duotone" className="text-emerald-400 mx-auto" />
                                <div className="font-display font-black text-2xl mt-1">{unlocked.length}</div>
                                <div className="text-[9px] uppercase tracking-widest text-zinc-500">Badges</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Profile Completion */}
            {completion && (
                <section className="glass p-6" data-testid="profile-completion">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div>
                            <div className="heading-eyebrow">Profile completion</div>
                            <h3 className="font-display font-bold text-xl mt-1">
                                {completion.pct}% complete
                                {completion.completion_xp_awarded && <span className="chip-emerald ml-2"><Sparkle size={10} weight="fill" /> +50 XP earned</span>}
                            </h3>
                        </div>
                        {!editing ? (
                            <button onClick={() => setEditing(true)} className="btn-gold py-2 px-4 text-sm" data-testid="edit-profile-btn">
                                <PencilSimple size={14} weight="bold" /> Edit Profile
                            </button>
                        ) : (
                            <button onClick={() => setEditing(false)} className="btn-ghost text-sm" data-testid="cancel-edit-btn">
                                <X size={14} /> Cancel
                            </button>
                        )}
                    </div>
                    <ProgressBar value={completion.pct} max={100} color="gold" testId="completion-progress" />

                    {editing ? (
                        <form onSubmit={saveProfile} className="mt-6 space-y-6">
                            <FormSection title="Basic Info">
                                <FormRow>
                                    <Field label="Full Name" testId="profile-name-input">
                                        <input required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="field" />
                                    </Field>
                                    <Field label="Mobile Number" testId="profile-phone-input">
                                        <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={(e)=>setForm({...form, phone: e.target.value})} className="field" />
                                    </Field>
                                </FormRow>
                                <FormRow>
                                    <Field label="Date of Birth" testId="profile-dob-input">
                                        <input type="date" value={form.dob} onChange={(e)=>setForm({...form, dob: e.target.value})} className="field" />
                                    </Field>
                                    <Field label="Gender" testId="profile-gender-input">
                                        <select value={form.gender} onChange={(e)=>setForm({...form, gender: e.target.value})} className="field">
                                            <option value="">Select...</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                            <option value="prefer_not">Prefer not to say</option>
                                        </select>
                                    </Field>
                                </FormRow>
                                <FormRow>
                                    <Field label="Marital Status" testId="profile-marital-input">
                                        <select value={form.marital_status} onChange={(e)=>setForm({...form, marital_status: e.target.value})} className="field">
                                            <option value="">Select...</option>
                                            <option value="unmarried">Unmarried</option>
                                            <option value="married">Married</option>
                                        </select>
                                    </Field>
                                    {form.marital_status === "married" && (
                                        <Field label="Wedding Anniversary" testId="profile-anniversary-input">
                                            <input type="date" value={form.anniversary_date} onChange={(e)=>setForm({...form, anniversary_date: e.target.value})} className="field" />
                                        </Field>
                                    )}
                                </FormRow>
                                {form.marital_status === "married" && (
                                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                                        Anniversary photo upload coming soon
                                    </div>
                                )}
                                <Field label="Business Centre (Nexus ID)" testId="profile-nexus-input">
                                    <input value={form.nexus_id} onChange={(e)=>setForm({...form, nexus_id: e.target.value.toUpperCase()})} placeholder="BC-XXXX" className="field font-mono uppercase" />
                                </Field>
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                                    Profile photo · upload above using the camera icon (JPG / PNG / WEBP · max 2 MB)
                                </div>
                                <FormRow>
                                    <Field label="City" testId="profile-city-input">
                                        <input value={form.city} onChange={(e)=>setForm({...form, city: e.target.value})} className="field" />
                                    </Field>
                                    <Field label="State" testId="profile-state-input">
                                        <input value={form.state} onChange={(e)=>setForm({...form, state: e.target.value})} className="field" />
                                    </Field>
                                </FormRow>
                                <Field label="Team" testId="profile-team-input">
                                    <select value={form.team_id} onChange={(e)=>setForm({...form, team_id: e.target.value})} className="field">
                                        <option value="">Select your team...</option>
                                        {availableTeams.map((t) => (
                                            <option key={t.team_id} value={t.team_id}>{t.name}</option>
                                        ))}
                                    </select>
                                </Field>
                            </FormSection>

                            <FormSection title="Business">
                                <Field label="Joining Date" testId="profile-joining-input">
                                    <input type="date" value={form.joining_date} onChange={(e)=>setForm({...form, joining_date: e.target.value})} className="field" />
                                </Field>
                                <Field label="Club Type" testId="profile-club-input">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {["decider", "believer", "converter", "builder"].map((c) => (
                                            <button
                                                key={c} type="button"
                                                onClick={() => setForm({...form, club_type: c})}
                                                className={`p-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${
                                                    form.club_type === c
                                                        ? "bg-yellow-500 text-black border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.4)]"
                                                        : "bg-white/5 text-zinc-400 border-white/10 hover:border-white/20"
                                                }`}
                                                data-testid={`profile-club-${c}`}
                                            >{c}</button>
                                        ))}
                                    </div>
                                </Field>
                            </FormSection>

                            <FormSection title="Personal Favourites">
                                <FormRow>
                                    <Field label="Favourite Food" testId="profile-food-input">
                                        <input placeholder="Biryani" value={form.favourite_food} onChange={(e)=>setForm({...form, favourite_food: e.target.value})} className="field" />
                                    </Field>
                                    <Field label="Favourite Place" testId="profile-place-input">
                                        <input placeholder="Goa" value={form.favourite_place} onChange={(e)=>setForm({...form, favourite_place: e.target.value})} className="field" />
                                    </Field>
                                </FormRow>
                                <Field label="Favourite Hobby" testId="profile-hobby-input">
                                    <input placeholder="Cricket, Reading, Hiking..." value={form.favourite_hobby} onChange={(e)=>setForm({...form, favourite_hobby: e.target.value})} className="field" />
                                </Field>
                                <Field label="Bio" testId="profile-bio-input">
                                    <textarea rows={3} placeholder="Your story, your mission..." value={form.bio} onChange={(e)=>setForm({...form, bio: e.target.value})} className="field resize-none" />
                                </Field>
                            </FormSection>

                            <button type="submit" className="btn-gold w-full" data-testid="save-profile-btn">
                                <Check size={16} weight="bold" /> Save Profile
                                {!completion.completion_xp_awarded && completion.pct < 100 && <span className="ml-1 text-xs opacity-80">· complete all for +50 XP</span>}
                            </button>
                        </form>
                    ) : completion.missing.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {completion.missing.map((m) => (
                                <span key={m} className="chip-zinc" data-testid={`missing-${m}`}>Missing: {missingLabels[m] || m}</span>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-4 text-sm text-emerald-400 flex items-center gap-2">
                            <Check size={14} weight="bold" /> All fields filled. You're a full Spartan.
                        </div>
                    )}
                </section>
            )}

            {/* Personal Details view */}
            {!editing && (user.dob || user.city || user.club_type || user.favourite_food) && (
                <section className="glass p-6" data-testid="profile-details">
                    <div className="mb-5">
                        <div className="heading-eyebrow">Dossier</div>
                        <h3 className="font-display font-black text-2xl mt-1">Personal Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {user.dob && <DetailRow label="Date of Birth" value={user.dob} />}
                        {user.gender && <DetailRow label="Gender" value={user.gender.replace("_", " ")} />}
                        {user.marital_status && <DetailRow label="Marital Status" value={user.marital_status} />}
                        {user.anniversary_date && <DetailRow label="Anniversary" value={user.anniversary_date} />}
                        {user.phone && <DetailRow label="Mobile" value={user.phone} />}
                        {(user.city || user.state) && <DetailRow label="Location" value={[user.city, user.state].filter(Boolean).join(", ")} />}
                        {user.joining_date && <DetailRow label="Joined" value={user.joining_date} />}
                        {user.club_type && <DetailRow label="Club Type" value={user.club_type} chip="chip-gold" />}
                        {user.favourite_food && <DetailRow label="Fav. Food" value={user.favourite_food} />}
                        {user.favourite_place && <DetailRow label="Fav. Place" value={user.favourite_place} />}
                        {user.favourite_hobby && <DetailRow label="Fav. Hobby" value={user.favourite_hobby} />}
                    </div>
                    {user.anniversary_photo && (
                        <div className="mt-6">
                            <div className="heading-eyebrow mb-2">Anniversary Memory</div>
                            <img src={user.anniversary_photo} alt="Anniversary" className="rounded-2xl max-h-64 object-cover border border-white/10" data-testid="anniversary-photo" />
                        </div>
                    )}
                </section>
            )}

            {/* Badges */}
            <section>
                <div className="mb-4">
                    <div className="heading-eyebrow">Trophy Hall</div>
                    <h3 className="font-display font-black text-2xl mt-1">Badge Collection</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {badges.map((b) => (
                        <BadgeCard key={b.key} badge={b} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function FormSection({ title, children }) {
    return (
        <div className="space-y-3">
            <div className="heading-eyebrow border-b border-white/5 pb-2">{title}</div>
            {children}
        </div>
    );
}

function FormRow({ children }) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, testId, children }) {
    return (
        <div data-testid={testId}>
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">{label}</label>
            {children}
        </div>
    );
}

function DetailRow({ label, value, chip }) {
    return (
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</div>
            {chip ? (
                <div className="mt-1"><span className={chip}>{value}</span></div>
            ) : (
                <div className="mt-1 text-sm font-semibold text-white capitalize">{value}</div>
            )}
        </div>
    );
}

function BadgeCard({ badge }) {
    const tierColors = {
        bronze: { bg: "from-amber-700/20 to-transparent", border: "border-amber-700/40", icon: "text-amber-500" },
        silver: { bg: "from-zinc-300/10 to-transparent", border: "border-zinc-400/40", icon: "text-zinc-300" },
        gold: { bg: "from-yellow-500/20 to-transparent", border: "border-yellow-500/50", icon: "text-yellow-400" },
    };
    const t = tierColors[badge.tier] || tierColors.bronze;
    const unlocked = badge.unlocked;

    return (
        <motion.div
            whileHover={unlocked ? { y: -4 } : undefined}
            className={`p-5 rounded-2xl bg-gradient-to-br ${t.bg} border ${unlocked ? t.border : "border-white/5 opacity-40"} text-center relative overflow-hidden`}
            data-testid={`badge-${badge.key}`}
        >
            {unlocked ? (
                <Sparkle size={16} weight="fill" className="absolute top-2 right-2 text-yellow-400" />
            ) : (
                <LockKey size={14} weight="fill" className="absolute top-2 right-2 text-zinc-600" />
            )}
            <div className={`w-16 h-16 mx-auto rounded-full grid place-items-center mb-3 ${unlocked ? "bg-white/5 border border-white/10" : "bg-zinc-900 border border-zinc-800"}`}>
                <Sword size={30} weight={unlocked ? "duotone" : "regular"} className={unlocked ? t.icon : "text-zinc-700"} />
            </div>
            <div className={`font-display font-bold text-sm ${unlocked ? "text-white" : "text-zinc-500"}`}>{badge.name}</div>
            <div className={`text-[10px] mt-1 leading-tight ${unlocked ? "text-zinc-400" : "text-zinc-600"}`}>{badge.description}</div>
            <div className="mt-2 text-[10px] uppercase tracking-widest text-yellow-500/80">+{badge.xp_reward} XP</div>
        </motion.div>
    );
}
