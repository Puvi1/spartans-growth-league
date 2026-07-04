import { Crown, Star, Sparkle, Medal, UserCircleCheck } from "@phosphor-icons/react";

export const POSITION_BADGE_META = {
    team_leader: { label: "Team Leader", icon: Crown, color: "text-yellow-400", chip: "chip-gold" },
    star_performer: { label: "Star Performer", icon: Star, color: "text-yellow-300", chip: "chip-gold" },
    rising_star: { label: "Rising Star", icon: Sparkle, color: "text-blue-400", chip: "chip-blue" },
    consistent_achiever: { label: "Consistent Achiever", icon: Medal, color: "text-emerald-400", chip: "chip-emerald" },
    top_recruiter: { label: "Top Recruiter", icon: UserCircleCheck, color: "text-purple-400", chip: "chip-blue" },
};

export default function PositionBadges({ badges = [], size = "sm", limit = null }) {
    if (!badges || badges.length === 0) return null;
    const shown = limit ? badges.slice(0, limit) : badges;
    const rest = limit && badges.length > limit ? badges.length - limit : 0;
    return (
        <span className="inline-flex items-center gap-1 flex-wrap" data-testid="position-badges">
            {shown.map((b) => {
                const meta = POSITION_BADGE_META[b];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                    <span
                        key={b}
                        className={meta.chip}
                        style={{ padding: size === "xs" ? "1px 6px" : "2px 8px", fontSize: size === "xs" ? "9px" : "10px" }}
                        title={meta.label}
                        data-testid={`badge-${b}`}
                    >
                        <Icon size={size === "xs" ? 9 : 10} weight="fill" />
                        {size !== "xs" && meta.label}
                    </span>
                );
            })}
            {rest > 0 && <span className="text-[10px] text-zinc-500">+{rest}</span>}
        </span>
    );
}
