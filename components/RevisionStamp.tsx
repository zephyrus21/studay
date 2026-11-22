export function RevisionStamp({ count, done }: { count: number; done: boolean }) {
  if (count === 0 && !done) return null
  return (
    <span
      className={`inline-block -rotate-6 rounded-md border-[1.5px] border-brand px-1.5 py-px text-[10px] font-extrabold text-brand ${count === 0 ? 'opacity-45' : ''}`}
    >
      {count > 0 ? `REVISED ×${count}` : 'DUE'}
    </span>
  )
}
