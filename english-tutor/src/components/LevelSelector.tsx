import { LEVELS, levelInfo } from "@/lib/constants";

export function LevelSelector({
  level,
  setLevel,
}: {
  level: string;
  setLevel: (level: string) => void;
}) {
  const current = levelInfo(level);
  return (
    <div className="hb-level-selector">
      <select
        className="hb-badge hb-badge-select"
        value={level}
        onChange={(e) => setLevel(e.target.value)}
      >
        {LEVELS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      <span className="hb-level-hint">{current.hint}</span>
    </div>
  );
}
