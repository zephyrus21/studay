'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

export function Sheet({
  trigger,
  title,
  children,
}: {
  trigger: (open: () => void) => ReactNode
  title: string
  children: (close: () => void) => ReactNode
}) {
  const [shown, setShown] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (shown && !ref.current?.open) ref.current?.showModal()
  }, [shown])
  return (
    <>
      {trigger(() => setShown(true))}
      {shown && (
        <dialog
          ref={ref}
          aria-label={title}
          onClose={() => setShown(false)}
          onClick={(e) => e.target === ref.current && ref.current?.close()}
          className="m-0 mt-auto w-full max-w-none bg-transparent p-0 text-ink backdrop:bg-ink/35"
        >
          <div className="mx-auto w-full max-w-md rounded-t-[24px] bg-card px-4 font-normal pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2.5">
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line" />
            <h2 className="mb-2 truncate text-base font-black">{title}</h2>
            {children(() => setShown(false))}
          </div>
        </dialog>
      )}
    </>
  )
}
