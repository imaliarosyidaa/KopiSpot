import { PLACE_CATEGORIES } from "@/lib/constants";

interface LeftSidebarProps {
  cities: string[];
  activeCategory: string;
  activeCity: string;
  onCategory: (value: string) => void;
  onCity: (value: string) => void;
}

export default function LeftSidebar({ cities, activeCategory, activeCity, onCategory, onCity }: LeftSidebarProps) {
  return (
    <aside className="hidden lg:block w-60 shrink-0 sticky top-24 self-start space-y-6">
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Kategori</h3>
        <div className="flex flex-col gap-1">
          {PLACE_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => onCategory(c.value)}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeCategory === c.value
                  ? "bg-[#b07d3f]/15 text-[#b07d3f] font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Kota</h3>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onCity("SEMUA")}
            className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeCity === "SEMUA"
                ? "bg-[#b07d3f]/15 text-[#b07d3f] font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Semua Kota
          </button>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => onCity(city)}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeCity === city
                  ? "bg-[#b07d3f]/15 text-[#b07d3f] font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
