import { MdLightMode, MdDarkMode } from "react-icons/md"
import { useTheme } from "@/lib/theme"

export default function ThemeSwitcher() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={
        theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"
      }
      className="w-9 h-9 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
    >
      {theme === "dark" ? (
        <MdLightMode className="w-4 h-4" />
      ) : (
        <MdDarkMode className="w-4 h-4" />
      )}
    </button>
  )
}
