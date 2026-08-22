import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"

export interface FeatureGalleryItem {
  name: string
  description: string
  image: string
  href: string
}

interface ImageGalleryProps {
  items: FeatureGalleryItem[]
}

export default function ImageGallery({ items }: ImageGalleryProps): React.JSX.Element {
  return (
    <section className="w-full px-6 py-16 md:px-12 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-[360px] w-full gap-2 overflow-hidden sm:h-[420px] md:gap-3">
          {items.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-muted transition-[flex] duration-500 ease-out hover:flex-[2.5] focus-visible:flex-[2.5]",
              )}
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-5">
                <h3 className="text-sm font-black leading-tight sm:text-lg">{item.name}</h3>
                <p className="mt-1 hidden text-xs leading-relaxed text-white/75 sm:block">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}