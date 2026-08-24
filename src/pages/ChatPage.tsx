import { useEffect, useRef, useState } from "react"
import { MdAutoAwesome, MdSend } from "react-icons/md"
import { chatApi } from "@/lib/api"
import { initials } from "@/lib/format"
import { useAuth } from "@/lib/auth-context"
import image from "./JACK 2.png"

interface ChatMessage {
  role: "user" | "bot"
  text: string
}

const WELCOME =
  "Halo! Aku asisten coffidoor ☕\n\nAku bisa bantu jawab seputar kalori, kadar gula, ingredients menu, waktu terbaik minum kopi, dan rekomendasi kafe. Silakan pilih salah satu pertanyaan di bawah, atau tulis pertanyaanmu sendiri!"

const SHORTCUTS = [
  "Berapa kalori Kopi Latte?",
  "Berapa kadar gula Es Kopi Susu?",
  "Ingredients dari V60?",
  "Waktu terbaik untuk minum kopi?",
  "Kafe estetik hits di Bandung",
]

export default function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "bot", text: WELCOME },
  ])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, typing])

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || typing) return
    setError(null)
    setMessages((prev) => [...prev, { role: "user", text }])
    setInput("")
    setTyping(true)
    try {
      const data = await chatApi.send(text)
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengirim pesan.",
      )
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Maaf, terjadi gangguan. Silakan coba lagi nanti ya 🙏",
        },
      ])
    } finally {
      setTyping(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    send(input)
  }

  return (
      <div className="grid grid-cols-1 lg:grid-cols-2 mx-auto px-6 md:px-12 py-16">
        <div className="mb-6 text-center lg:text-left">
          <span className="tag-pill mb-3 inline-block">Tanya coffidoor</span>
          <h2
            className="text-3xl sm:text-4xl md:text-6xl font-black text-foreground leading-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Asisten Kopi
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            Chatbot sederhana Interaktif. Tanyakan pertanyaanmu seputar kopi
            dan cafe di sini.
          </p>
          <div className="w-full flex justify-center items-center">
          <img src={image} alt="Jack" className="w-auto h-32 lg:h-[440px]" />
        </div>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden flex flex-col">
          {/* Pesan */}
          <div
            ref={scrollRef}
            className="flex-1 h-[52vh] overflow-y-auto p-4 md:p-6 space-y-4"
          >
            {messages.map((m, i) =>
              m.role === "bot" ? (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[rgba(156,163,175,0.22)] border border-[rgba(156,163,175,0.35)] flex items-center justify-center text-[#d1d5db] shrink-0">
                    <MdAutoAwesome className="w-5 h-5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-background border border-border px-4 py-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap max-w-[85%]">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-start justify-end gap-3">
                  <div className="rounded-2xl rounded-tr-sm bg-[#d1d5db] text-[#111113] px-4 py-3 text-sm font-medium leading-relaxed whitespace-pre-wrap max-w-[85%]">
                    {m.text}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[rgba(156,163,175,0.22)] border border-[rgba(156,163,175,0.35)] flex items-center justify-center text-[#d1d5db] font-bold text-sm shrink-0 overflow-hidden">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials(user?.name ?? user?.email ?? "Kamu")
                    )}
                  </div>
                </div>
              ),
            )}

            {typing && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[rgba(156,163,175,0.22)] border border-[rgba(156,163,175,0.35)] flex items-center justify-center text-[#d1d5db] shrink-0">
                  <MdAutoAwesome className="w-5 h-5" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-background border border-border px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#d1d5db] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#d1d5db] animate-bounce [animation-delay:0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-[#d1d5db] animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          {/* Shortcut */}
          <div className="px-4 md:px-6 pb-3 flex flex-wrap gap-2 border-t border-border pt-3">
            {SHORTCUTS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={typing}
                className="footer-glass-pill px-3.5 py-1.5 rounded-full text-xs text-muted-foreground hover:text-[#d1d5db] transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 md:p-6 pt-2">
            <div className="flex items-center gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Contoh: Berapa kalori Flat White?"
                className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#d1d5db] focus:ring-2 focus:ring-[rgba(209,213,219,0.25)]"
              />
              <button
                type="submit"
                disabled={typing || !input.trim()}
                className="flex items-center gap-2 bg-[#d1d5db] text-[#111113] font-black px-5 py-3 rounded-full text-sm hover:bg-[#f3f4f6] transition-colors disabled:opacity-60"
              >
                <MdSend className="w-4 h-4" />
                Kirim
              </button>
            </div>
          </form>
        </div>
      </div>
  )
}
