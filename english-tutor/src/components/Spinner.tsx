export function Spinner({ label }: { label: string }) {
  return (
    <div className="hb-spinner">
      <span className="hb-dot" />
      <span className="hb-dot" />
      <span className="hb-dot" />
      <span className="hb-spinner-label">{label}</span>
    </div>
  );
}
