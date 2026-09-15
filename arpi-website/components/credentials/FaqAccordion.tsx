'use client'

import { useState } from 'react'

export interface FaqItem {
  q: string
  a: string
}

function IconChevronDown({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function IconChevronUp({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

export default function FaqAccordion({
  items,
  primaryColor,
  lightColor,
}: {
  items: FaqItem[]
  primaryColor: string
  lightColor: string
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <div className="faq-accordion">
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={i} className={`faq-item${isOpen ? ' faq-item--open' : ''}`}>
            <button
              className="faq-question"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="faq-q-text">{item.q}</span>
              <span className="faq-chevron" style={{ color: primaryColor }}>
                {isOpen ? <IconChevronUp /> : <IconChevronDown />}
              </span>
            </button>
            {isOpen && (
              <div className="faq-answer" style={{ borderLeftColor: primaryColor, background: lightColor }}>
                <p>{item.a}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
