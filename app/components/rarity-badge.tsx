import { Badge } from "@/components/ui/badge"

export function RarityBadge({ rarity, className = "" }: { rarity?: string; className?: string }) {
  if (!rarity) return null;

  // Normalize for safe checking
  const r = rarity.toLowerCase().trim();
  
  let colorClass = "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"; // default Common

  if (r.includes("mythic") || r.includes("secret")) {
    colorClass = "bg-gradient-to-r from-orange-500 to-red-600 text-white border-transparent hover:from-orange-600 hover:to-red-700 font-bold shadow-[0_0_8px_rgba(234,88,12,0.6)]";
  } else if (r.includes("rare")) {
    colorClass = "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-transparent hover:from-yellow-500 hover:to-yellow-700 font-bold shadow-sm";
  } else if (r.includes("uncommon")) {
    colorClass = "bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300 font-semibold";
  } else if (r.includes("promo") || r.includes("special")) {
    colorClass = "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200";
  } else if (r.includes("land") || r.includes("token")) {
    colorClass = "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200";
  }

  return (
    <Badge variant="outline" className={`${colorClass} ${className} transition-all duration-300 uppercase tracking-wider text-[10px] px-2 py-0.5`}>
      {rarity}
    </Badge>
  );
}
