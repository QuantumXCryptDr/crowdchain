"use client"

const blocks = Array.from({ length: 16 }, (_, index) => {
  const column = index % 4
  const row = Math.floor(index / 4)

  return {
    id: index,
    left: `${14 + column * 20}%`,
    top: `${10 + row * 18}%`,
    delay: `${index * 180}ms`,
    duration: `${4200 + (index % 4) * 500}ms`,
    rotate: `${(index % 3) * 8 - 8}deg`,
  }
})

export default function ThreeBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_32%)]" />

      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="float-block absolute h-20 w-20 rounded-2xl border border-cyan-200/10 bg-gradient-to-br from-emerald-300/12 via-cyan-300/10 to-sky-400/12 shadow-[0_0_30px_rgba(34,211,238,0.08)]"
            style={{
              left: block.left,
              top: block.top,
              animationDelay: block.delay,
              animationDuration: block.duration,
              transform: `rotate(${block.rotate})`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-x-0 top-[18%] h-px bg-gradient-to-r from-transparent via-cyan-300/18 to-transparent" />
      <div className="absolute inset-x-0 top-[54%] h-px bg-gradient-to-r from-transparent via-emerald-300/12 to-transparent" />
      <div className="absolute left-[24%] inset-y-0 w-px bg-gradient-to-b from-transparent via-sky-300/14 to-transparent" />
      <div className="absolute left-[72%] inset-y-0 w-px bg-gradient-to-b from-transparent via-cyan-300/12 to-transparent" />
    </div>
  )
}
