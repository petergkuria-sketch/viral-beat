import { LayoutGrid, List, Rows, LayoutDashboard, Smartphone } from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  grid:    <LayoutGrid className="w-3 h-3" />,
  list:    <List className="w-3 h-3" />,
  cards:   <LayoutGrid className="w-3 h-3" />,
  feed:    <Rows className="w-3 h-3" />,
  widget:  <Smartphone className="w-3 h-3" />,
  classic: <LayoutDashboard className="w-3 h-3" />,
  icon:    <LayoutGrid className="w-3 h-3" />,
};

interface ViewToggleProps {
  options: { value: string; label: string }[];
  current: string;
  onChange: (v: string) => void;
}

export function ViewToggle({ options, current, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 gap-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
            current === opt.value
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {ICON_MAP[opt.value] ?? <LayoutGrid className="w-3 h-3" />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
