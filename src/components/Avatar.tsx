/** Avatar/escudo com fallback para inicial quando não há imagem. */
export function Avatar({
  src,
  name,
  size = 40,
  rounded = 'full',
}: {
  src?: string
  name: string
  size?: number
  rounded?: 'full' | 'lg'
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const radius = rounded === 'full' ? 'rounded-full' : 'rounded-lg'
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`${radius} object-cover`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className={`${radius} flex items-center justify-center bg-pitch-100 font-bold text-pitch-700`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initial}
    </div>
  )
}
