import { useEffect, useState } from "react"
import { MdArrowUpward } from "react-icons/md"

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Kembali ke atas"
      className={`footer-glass-pill fixed bottom-20 right-20 z-40 flex h-18 w-18 items-center justify-center rounded-full bg-[#d1d5db] text-foreground/60 shadow-lg transition-all duration-300 hover:bg-[#f3f4f6] md:bottom-6 md:right-20 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <MdArrowUpward className="h-10 w-10" />
    </button>
  )
}
