import { useState } from "react"
import { MdAdd, MdFavorite, MdFavoriteBorder, MdShoppingCart } from "react-icons/md"
import type { MenuItemOption } from "@/lib/api"
import { useCartStore, type CartItem } from "@/lib/cart-store"
import { formatRupiah } from "@/lib/format"
import { menuImageUrl } from "@/lib/menu-images"

interface MenuProductCardProps {
  menu: MenuItemOption
  quantity: number
  onNotice: (message: string) => void
  onBuyNow: (item: Omit<CartItem, "quantity">) => void
}

function cartItemFromMenu(menu: MenuItemOption): Omit<CartItem, "quantity"> {
  return {
    id: menu.id,
    placeId: menu.place.id,
    placeName: menu.place.name,
    name: menu.name,
    price: menu.price,
    category: menu.category,
    imageUrl: menu.imageUrl,
  }
}

export default function MenuProductCard({
  menu,
  quantity,
  onNotice,
  onRequireLogin,
  onBuyNow,
}: MenuProductCardProps): React.JSX.Element {
  const add = useCartStore((state) => state.add)
  const wishlist = useCartStore((state) => state.wishlist)
  const toggleWishlist = useCartStore((state) => state.toggleWishlist)
  const [heartPulse, setHeartPulse] = useState(false)
  const item = cartItemFromMenu(menu)
  const isWishlisted = wishlist.some((wishlistItem) => wishlistItem.id === menu.id)

  const handleWishlist = () => {
    toggleWishlist(item)
    setHeartPulse(true)
    window.setTimeout(() => setHeartPulse(false), 240)
  }

  const handleAdd = () => {
    add(item)
    onNotice("Produk berhasil ditambahkan ke keranjang.")
  }

  return (
    <article className="glass-card flex min-w-0 flex-col overflow-hidden rounded-2xl">
      <div className="relative h-36 w-full overflow-hidden bg-muted">
        <img
          src={menuImageUrl(menu.category, menu.imageUrl, menu.name)}
          alt={menu.name}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <span className="tag-pill absolute left-2 top-2">{menu.category}</span>
        <button
          type="button"
          aria-label={isWishlisted ? `Hapus ${menu.name} dari wishlist` : `Simpan ${menu.name} ke wishlist`}
          aria-pressed={isWishlisted}
          onClick={handleWishlist}
          className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur transition-transform hover:scale-105 ${heartPulse ? "scale-125" : ""}`}
        >
          {isWishlisted ? <MdFavorite className="h-5 w-5 text-rose-400" /> : <MdFavoriteBorder className="h-5 w-5" />}
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-foreground">{menu.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{menu.place.name}</p>
          <p className="mt-1 text-sm font-black text-primary">{formatRupiah(menu.price)}</p>
        </div>
        {menu.description && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{menu.description}</p>}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          <button type="button" onClick={handleAdd} className="flex min-w-0 items-center justify-center gap-1 rounded-xl border border-primary/40 px-2 py-2 text-[11px] font-bold text-primary transition-colors hover:bg-primary/10">
            <MdShoppingCart className="h-4 w-4 shrink-0" />
            <span className="truncate">{quantity > 0 ? `Keranjang · ${quantity}` : "Tambah"}</span>
          </button>
          <button type="button" onClick={() => onBuyNow(item)} className="flex min-w-0 items-center justify-center gap-1 rounded-xl bg-primary px-2 py-2 text-[11px] font-black text-primary-foreground transition-opacity hover:opacity-90">
            <MdAdd className="h-4 w-4 shrink-0" />
            <span>Beli langsung</span>
          </button>
        </div>
      </div>
    </article>
  )
}
