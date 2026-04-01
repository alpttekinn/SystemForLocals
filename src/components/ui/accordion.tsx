'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionItem {
  id: string
  title: string
  content: string
}

interface AccordionProps {
  items: AccordionItem[]
  /** Allow multiple items open at once */
  multiple?: boolean
  className?: string
}

function Accordion({ items, multiple = false, className }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(multiple ? prev : [])
      if (prev.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className={cn('divide-y divide-cream-200 border-y border-cream-200', className)}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id)
        return (
          <div key={item.id}>
            <button
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between py-4 px-1 text-left group"
              aria-expanded={isOpen}
            >
              <span className="font-sans text-base font-medium text-charcoal-900 group-hover:text-forest-800 transition-colors">
                {item.title}
              </span>
              <ChevronDown
                size={18}
                className={cn(
                  'shrink-0 ml-4 text-charcoal-400 transition-transform duration-200',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-200',
                isOpen ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0',
              )}
            >
              <div className="px-1 text-sm text-charcoal-600 leading-relaxed prose prose-sm max-w-none">
                {item.content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { Accordion, type AccordionItem }
