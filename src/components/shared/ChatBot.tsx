import { useEffect, useRef, useState } from "react"
import { MdClose, MdSend } from "react-icons/md"
import { chatApi } from "@/lib/api"
import jackAvatar from "../../pages/JACK 2.png"

interface Msg {
  role: "user" | "bot"
  text: string
}

const WELCOME =
  "Halo! Aku Jack ☕ asisten coffidoor. Tanya seputar kopi & cafe di sini ya!"

const SHORTCUTS = [
  "Berapa kalori Kopi Latte?",
  "Waktu terbaik minum kopi?",
  "Kafe estetik di Bandung",
]

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([{ role: "bot", text: WELCOME }])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, typing])

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || typing) return
    setMessages((prev) => [...prev, { role: "user", text }])
    setInput("")
    setTyping(true)
    try {
      const data = await chatApi.send(text)
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Maaf, lagi ada gangguan. Coba lagi nanti ya 🙏" },
      ])
    } finally {
      setTyping(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Tutup chatbot" : "Buka chatbot"}
        className="footer-glass-pill fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center bg-[#d1d5db] text-[#111113] shadow-lg transition-colors hover:bg-[#f3f4f6] md:bottom-6 md:right-6"
      >
        {open ? (
          <MdClose className="h-6 w-6" />
        ) : (
          <img src={jackAvatar} alt="Jack" className="h-9 w-9 rounded-full object-cover" />
        )}
      </button>

      {open && (
        <div className="fixed bottom-36 right-4 z-40 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl md:bottom-24 md:right-6">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <img src={jackAvatar} alt="Jack" className="h-9 w-9 rounded-full object-cover" />
            <div className="min-w-0">
              <p className="text-sm font-black text-foreground">Jack · Asisten Kopi</p>
              <p className="truncate text-[11px] text-muted-foreground">Tanya seputar kopi &amp; cafe</p>
            </div>
          </div>

          <div ref={scrollRef} className="h-72 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) =>
              m.role === "bot" ? (
                <div key={i} className="flex items-start gap-2">
                  <img src={jackAvatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                  <div className="whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-border bg-background px-3 py-2 text-sm text-foreground">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-start justify-end gap-2">
                  <div className="whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#d1d5db] px-3 py-2 text-sm font-medium text-[#111113]">
                    {m.text}
                  </div>
                </div>
              ),
            )}

            {typing && (
              <div className="flex items-start gap-2">
                <img src={jackAvatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                <div className="flex gap-1 rounded-2xl rounded-tl-sm border border-border bg-background px-3 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#d1d5db]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#d1d5db] [animation-delay:0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#d1d5db] [animation-delay:0.3s]" />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2">
            {SHORTCUTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={typing}
                className="footer-glass-pill rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-[#d1d5db] disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pertanyaan..."
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[#d1d5db]"
            />
            <button
              type="submit"
              disabled={typing || !input.trim()}
              aria-label="Kirim"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d1d5db] text-[#111113] transition-colors hover:bg-[#f3f4f6] disabled:opacity-60"
            >
              <MdSend className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
