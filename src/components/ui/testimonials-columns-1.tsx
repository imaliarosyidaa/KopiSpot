import React from "react"

export interface Testimonial {
  id?: string
  text: string
  image: string | null
  name: string
  role: string
  onDelete?: () => void
}

interface TestimonialsColumnProps {
  className?: string
  testimonials: Testimonial[]
  duration?: number
}

export function TestimonialsColumn({
  className = "",
  testimonials,
  duration = 15,
}: TestimonialsColumnProps): React.JSX.Element {
  return (
    <div className={`testimonials-column min-w-0 flex-1 ${className}`}>
      <div
        className="testimonials-track flex flex-col gap-6 pb-6"
        style={{ animationDuration: `${duration}s` }}
      >
        {[0, 1].map((copy) => (
          <React.Fragment key={copy}>
            {testimonials.map((testimonial, index) => (
              <article
                className="glass-card w-full rounded-3xl border p-6 shadow-lg shadow-primary/10 sm:p-8"
                key={`${copy}-${testimonial.name}-${index}`}
              >
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {testimonial.text}
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-bold text-foreground">
                    {testimonial.image ? (
                      <img
                        width={40}
                        height={40}
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      testimonial.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold leading-5 text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="truncate text-xs leading-5 text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                  {testimonial.onDelete && (
                    <button
                      type="button"
                      onClick={testimonial.onDelete}
                      aria-label={`Hapus ulasan ${testimonial.name}`}
                      className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  )}
                </div>
              </article>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}