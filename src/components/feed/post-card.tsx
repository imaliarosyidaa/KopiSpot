import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdFavorite, MdFavoriteBorder, MdBookmark, MdBookmarkBorder, MdChatBubbleOutline, MdSend, MdDelete, MdPlace } from "react-icons/md";
import { postsApi, type PostItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "@/components/ui/auth-modal";
import { initials, timeAgo } from "@/lib/format";

export default function PostCard({ post, onChanged }: { post: PostItem; onChanged?: (updated: PostItem) => void }) {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [busy, setBusy] = useState(false);

  const patch = (updates: Partial<PostItem>) => onChanged?.({ ...post, ...updates });

  const handleLike = async () => {
    if (!user) return setAuthOpen(true);
    try {
      const r = await postsApi.like(post.id);
      patch({ likedByMe: r.liked, likesCount: r.likesCount });
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!user) return setAuthOpen(true);
    try {
      const r = await postsApi.save(post.id);
      patch({ savedByMe: r.saved, savesCount: r.savesCount });
    } catch {
      // ignore
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setAuthOpen(true);
    const body = commentBody.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await postsApi.addComment(post.id, body);
      setCommentBody("");
      patch({ commentsCount: post.commentsCount + 1 });
      setShowComments(true);
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Hapus postingan ini?")) return;
    try {
      await postsApi.remove(post.id);
      onChanged?.({ ...post, _deleted: true } as PostItem & { _deleted: boolean });
    } catch {
      // ignore
    }
  };

  return (
    <article className="glass-card rounded-3xl overflow-hidden">
      <div className="p-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-[rgba(140,95,40,0.22)] border border-[rgba(140,95,40,0.35)] flex items-center justify-center text-[#b07d3f] font-bold text-sm overflow-hidden shrink-0">
          {post.author.image ? (
            <img src={post.author.image} alt="" className="w-full h-full object-cover" />
          ) : (
            initials(post.author.name)
          )}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-foreground text-sm truncate">{post.author.name ?? "Pengguna"}</div>
          <div className="text-muted-foreground text-xs">
            Lv.{post.author.level ?? 1} · {timeAgo(post.createdAt)}
          </div>
        </div>
        {user?.id === post.author.id && (
          <button
            onClick={handleDelete}
            className="ml-auto w-8 h-8 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
            title="Hapus postingan"
          >
            <MdDelete className="w-4 h-4" />
          </button>
        )}
      </div>

      {post.place && (
        <div className="px-5 pb-3">
          <Link
            to={`/places/${post.place.id}`}
            className="inline-flex items-center gap-1.5 text-[#b07d3f] text-xs font-semibold hover:underline"
          >
            <MdPlace className="w-3.5 h-3.5" />
            {post.place.name} · {post.place.city}
          </Link>
        </div>
      )}

      {post.images.length > 0 && (
        <div className={`grid ${post.images.length > 1 ? "grid-cols-2" : "grid-cols-1"} gap-0.5`}>
          {post.images.map((img, i) => (
            <img key={i} src={img} alt="" className="w-full h-64 object-cover" />
          ))}
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map((t) => (
            <span key={t} className="tag-pill">#{t}</span>
          ))}
        </div>
        <p className="text-foreground text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.caption}</p>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors footer-glass-pill ${
              post.likedByMe ? "text-destructive" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {post.likedByMe ? <MdFavorite className="w-4 h-4" /> : <MdFavoriteBorder className="w-4 h-4" />}
            {post.likesCount}
          </button>
          <button
            onClick={() => setShowComments((s) => !s)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors footer-glass-pill"
          >
            <MdChatBubbleOutline className="w-4 h-4" />
            {post.commentsCount}
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors footer-glass-pill ${
              post.savedByMe ? "text-[#b07d3f]" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {post.savedByMe ? <MdBookmark className="w-4 h-4" /> : <MdBookmarkBorder className="w-4 h-4" />}
            Simpan
          </button>
        </div>

        {showComments && (
          <div className="mt-4 pt-4 border-t border-border">
            <form onSubmit={handleComment} className="flex items-center gap-2 mb-3">
              <input
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Tulis komentar..."
                className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#b07d3f]"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-9 h-9 rounded-full bg-[#b07d3f] text-[#1a1a1a] flex items-center justify-center hover:bg-[#c9974f] transition-colors disabled:opacity-60"
              >
                <MdSend className="w-4 h-4" />
              </button>
            </form>
            <PostComments postId={post.id} count={post.commentsCount} />
          </div>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </article>
  );
}

function PostComments({ postId, count }: { postId: string; count: number }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Awaited<ReturnType<typeof postsApi.comments>> | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    setLoaded(true);
    postsApi
      .comments(postId)
      .then(setComments)
      .catch(() => setComments([]));
  }, [loaded, postId]);

  if (comments === null) {
    return <div className="text-xs text-muted-foreground animate-pulse">Memuat komentar...</div>;
  }

  if (comments.length === 0) {
    return <div className="text-xs text-muted-foreground">Belum ada komentar ({count}).</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[rgba(140,95,40,0.22)] border border-[rgba(140,95,40,0.35)] flex items-center justify-center text-[#b07d3f] font-bold text-[10px] overflow-hidden shrink-0">
            {c.user.image ? (
              <img src={c.user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(c.user.name)
            )}
          </div>
          <div className="flex-1 glass-card rounded-2xl px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">{c.user.name ?? "Pengguna"}</span>
              <span className="text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
              {user?.id === c.user.id && (
                <button
                  onClick={async () => {
                    await postsApi.deleteComment(postId, c.id).catch(() => {});
                    setComments((prev) => prev?.filter((x) => x.id !== c.id) ?? null);
                  }}
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  title="Hapus komentar"
                >
                  <MdDelete className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{c.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
