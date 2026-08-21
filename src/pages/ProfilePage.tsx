import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MdEdit,
  MdImage,
  MdLock,
  MdLogout,
  MdStar,
  MdBookmark,
  MdCampaign,
  MdEmojiEvents,
  MdInsights,
} from "react-icons/md";
import { profileApi, uploadFile, type ProfileData } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/ui/auth-modal";
import StarRating from "@/components/ui/star-rating";
import PostCard from "@/components/feed/post-card";
import { formatDate, formatRupiah, initials, levelProgress, nextLevelXp, timeAgo } from "@/lib/format";

type Tab = "postingan" | "tersimpan" | "ulasan" | "lencana" | "statistik";

const TABS: { key: Tab; label: string; icon: typeof MdStar }[] = [
  { key: "postingan", label: "Postingan Saya", icon: MdCampaign },
  { key: "tersimpan", label: "Tersimpan", icon: MdBookmark },
  { key: "ulasan", label: "Ulasan", icon: MdStar },
  { key: "lencana", label: "Lencana", icon: MdEmojiEvents },
  { key: "statistik", label: "Statistik", icon: MdInsights },
];

export default function ProfilePage() {
  const { user, loading, logout, refresh } = useAuth();
  const [tab, setTab] = useState<Tab>("postingan");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      setProfile(await profileApi.me());
    } catch {
      setLoadError("Gagal memuat profil.");
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground animate-pulse pt-16">
        Memuat...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="glass-card rounded-3xl p-10 text-center max-w-md">
          <div className="text-4xl mb-3">👤</div>
          <h1 className="text-xl font-black text-foreground mb-2">Masuk untuk melihat profil</h1>
          <p className="text-muted-foreground text-sm mb-6">Login dulu untuk melihat postingan, lencana, dan statistikmu.</p>
          <button
            onClick={() => setAuthOpen(true)}
            className="bg-[#d1d5db] text-[#111113] font-black px-6 py-3 rounded-full text-sm hover:bg-[#f3f4f6] transition-colors"
          >
            Masuk Sekarang
          </button>
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="glass-card rounded-3xl p-10 text-center max-w-md">
          <p className="text-foreground font-semibold">{loadError}</p>
          <button onClick={load} className="mt-4 bg-[#d1d5db] text-[#111113] font-black px-6 py-3 rounded-full text-sm">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground animate-pulse pt-16">
        Memuat profil...
      </div>
    );
  }

  const progress = levelProgress(profile.xp, profile.level);
  const nextXp = nextLevelXp(profile.level);

  return (
    <div className="pt-24 px-6 md:px-12 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[rgba(156,163,175,0.22)] border-2 border-[rgba(156,163,175,0.4)] flex items-center justify-center text-[#d1d5db] font-black text-3xl overflow-hidden">
              {profile.image ? (
                <img src={profile.image} alt={profile.name ?? ""} className="w-full h-full object-cover" />
              ) : (
                initials(profile.name)
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 tag-pill bg-[#d1d5db] text-[#111113] border-0">Lv.{profile.level}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                {profile.name ?? "Pengguna"}
              </h1>
              <button
                onClick={() => setEditing((s) => !s)}
                className="footer-glass-pill px-4 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5"
              >
                <MdEdit className="w-3.5 h-3.5" />
                Edit Profil
              </button>
            </div>
            {profile.username && <div className="text-[#d1d5db] text-sm font-semibold">@{profile.username}</div>}
            <div className="text-muted-foreground text-sm mt-1">{profile.email}</div>
            {profile.bio && <p className="text-muted-foreground text-sm mt-2">{profile.bio}</p>}
            <div className="text-xs text-muted-foreground mt-2">Bergabung {formatDate(profile.createdAt)}</div>
          </div>

          <div className="w-full md:w-56">
            <div className="flex items-end justify-between mb-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Level {profile.level}</span>
              <span className="text-xs font-black text-[#d1d5db]">{profile.xp.toLocaleString()} XP</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-[#d1d5db] transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 text-right">
              {Math.round(progress * 100)}% menuju Lv.{profile.level + 1} ({nextXp.toLocaleString()} XP)
            </div>
          </div>
        </div>

        {editing && <EditProfile onDone={() => { setEditing(false); load(); refresh(); }} />}
        {changingPassword ? (
          <ChangePassword onDone={() => setChangingPassword(false)} />
        ) : (
          <button
            onClick={() => setChangingPassword(true)}
            className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <MdLock className="w-3.5 h-3.5" />
            Ubah kata sandi
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: "Postingan", value: profile.stats.posts },
          { label: "Rating", value: profile.stats.ratings },
          { label: "Ulasan", value: profile.stats.reviews },
          { label: "Tersimpan", value: profile.stats.saved },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-[#d1d5db]" style={{ fontFamily: "'Fraunces', serif" }}>
              {s.value}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
              tab === t.key
                ? "bg-[#d1d5db] text-[#111113]"
                : "footer-glass-pill text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "postingan" && (
        <div className="flex flex-col gap-5 max-w-2xl">
          {profile.posts.length === 0 ? (
            <EmptyState text="Kamu belum membuat postingan." ctaTo="/post/new" cta="Buat Postingan" />
          ) : (
            profile.posts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </div>
      )}

      {tab === "tersimpan" && (
        <div className="flex flex-col gap-5 max-w-2xl">
          {profile.savedPosts.length === 0 ? (
            <EmptyState text="Belum ada postingan yang kamu simpan." />
          ) : (
            profile.savedPosts.map((s) => <PostCard key={s.savedAt + s.post.id} post={s.post} />)
          )}
        </div>
      )}

      {tab === "ulasan" && (
        <div className="flex flex-col gap-5 max-w-2xl">
          <h2 className="text-lg font-black text-foreground">Rating yang diberikan</h2>
          {profile.ratings.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada rating.</p>
          ) : (
            profile.ratings.map((r) => (
              <div key={r.id} className="glass-card rounded-2xl p-5 flex items-center justify-between gap-3">
                <Link to={`/places/${r.place.id}`} className="min-w-0">
                  <div className="font-semibold text-foreground truncate">{r.place.name}</div>
                  <div className="text-muted-foreground text-xs">{timeAgo(r.createdAt)}</div>
                </Link>
                <StarRating rating={r.value} />
              </div>
            ))
          )}

          <h2 className="text-lg font-black text-foreground mt-6">Ulasan tertulis</h2>
          {profile.comments.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada ulasan tertulis.</p>
          ) : (
            profile.comments.map((c) => (
              <div key={c.id} className="glass-card rounded-2xl p-5">
                <Link to={`/places/${c.place.id}`} className="text-[#d1d5db] font-semibold text-sm hover:underline">
                  {c.place.name}
                </Link>
                <p className="text-muted-foreground text-sm mt-1.5">{c.body}</p>
                <div className="text-xs text-muted-foreground mt-2">{timeAgo(c.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "lencana" && (
        <div>
          {profile.badges.length === 0 ? (
            <EmptyState text="Belum ada lencana. Berpartisipasilah untuk mendapatkannya!" ctaTo="/feed" cta="Jelajahi Komunitas" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.badges.map((b) => (
                <div key={b.id} className="glass-card rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[rgba(209,213,219,0.15)] border border-[rgba(209,213,219,0.3)] flex items-center justify-center text-3xl shrink-0">
                    {b.icon}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{b.name}</div>
                    <div className="text-sm text-muted-foreground">{b.description}</div>
                    <div className="text-xs text-[#d1d5db] font-semibold mt-1">+{b.xpReward} XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "statistik" && (
        <div className="glass-card rounded-3xl p-6">
          <h2 className="text-lg font-black text-foreground mb-4">Statistik Kontribusi</h2>
          <div className="space-y-3">
            {[
              { label: "Total XP", value: profile.xp.toLocaleString() },
              { label: "Level", value: String(profile.level) },
              { label: "Postingan dibuat", value: String(profile.stats.posts) },
              { label: "Rating diberikan", value: String(profile.stats.ratings) },
              { label: "Ulasan ditulis", value: String(profile.stats.reviews) },
              { label: "Postingan disimpan", value: String(profile.stats.saved) },
              { label: "Lencana diraih", value: String(profile.badges.length) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-muted-foreground text-sm">{row.label}</span>
                <span className="font-black text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-destructive"
          >
            <MdLogout className="w-4 h-4" />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text, cta, ctaTo }: { text: string; cta?: string; ctaTo?: string }) {
  return (
    <div className="glass-card rounded-3xl p-12 text-center">
      <p className="text-muted-foreground text-sm">{text}</p>
      {cta && ctaTo && (
        <Link to={ctaTo} className="inline-block mt-4 bg-[#d1d5db] text-[#111113] font-black px-6 py-3 rounded-full text-sm">
          {cta}
        </Link>
      )}
    </div>
  );
}

const fieldClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#d1d5db] focus:ring-2 focus:ring-[rgba(209,213,219,0.25)]";

function EditProfile({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [image, setImage] = useState(user?.image ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAvatar = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const r = await uploadFile(file);
      setImage(r.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah avatar.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await profileApi.update({ name: name.trim(), username: username.trim() || undefined, bio: bio.trim(), image: image || undefined });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t border-border flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[rgba(156,163,175,0.22)] border border-[rgba(156,163,175,0.35)] flex items-center justify-center text-[#d1d5db] font-bold text-lg overflow-hidden shrink-0">
          {image ? (
            <img src={image} alt="" className="w-full h-full object-cover" />
          ) : (
            initials(name)
          )}
        </div>
        <label className="flex items-center gap-1.5 footer-glass-pill px-4 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer">
          <MdImage className="w-4 h-4" />
          {uploading ? "Mengunggah..." : "Unggah Foto Profil"}
          <input type="file" accept="image/*" hidden onChange={(e) => handleAvatar(e.target.files)} disabled={uploading} />
        </label>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Nama</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className={fieldClass} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className={fieldClass} minLength={3} maxLength={20} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={`${fieldClass} resize-none`} placeholder="Ceritakan tentang dirimu..." />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="bg-[#d1d5db] text-[#111113] font-black px-6 py-3 rounded-full text-sm hover:bg-[#f3f4f6] disabled:opacity-60">
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        <button type="button" onClick={onDone} className="footer-glass-pill px-6 py-3 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground">
          Batal
        </button>
      </div>
    </form>
  );
}

function ChangePassword({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      await profileApi.changePassword(current, next);
      setOk("Kata sandi berhasil diubah.");
      setCurrent("");
      setNext("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah kata sandi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 glass-card rounded-2xl p-5 flex flex-col gap-3">
      <h3 className="text-sm font-black text-foreground">Ubah Kata Sandi</h3>
      <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required placeholder="Kata sandi lama" className={fieldClass} />
      <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={6} placeholder="Kata sandi baru (min. 6 karakter)" className={fieldClass} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {ok && <p className="text-sm text-emerald-600">{ok}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="bg-[#d1d5db] text-[#111113] font-black px-5 py-2.5 rounded-full text-xs hover:bg-[#f3f4f6] disabled:opacity-60">
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        <button type="button" onClick={onDone} className="footer-glass-pill px-5 py-2.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground">
          Batal
        </button>
      </div>
    </form>
  );
}
