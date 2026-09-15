'use client'

import { useState } from 'react'

export interface Module {
  title: string
  items: string[]
  isFinal?: boolean
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

export default function CurriculumAccordion({
  modules,
  primaryColor,
  lightColor,
}: {
  modules: Module[]
  primaryColor: string
  lightColor: string
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <div className="accordion">
      {modules.map((mod, i) => {
        const isOpen = openIndex === i
        return (
          <div key={i} className={`accordion-item${isOpen ? ' accordion-item--open' : ''}`}>
            <button
              className="accordion-header"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="accordion-label">
                <span
                  className="accordion-num"
                  style={{ background: mod.isFinal ? '#374151' : primaryColor }}
                >
                  {mod.isFinal ? '★' : i + 1}
                </span>
                <span className="accordion-title">{mod.title}</span>
              </span>
              <span className="accordion-arrow" style={{ color: primaryColor }}>
                {isOpen ? <IconChevronUp /> : <IconChevronDown />}
              </span>
            </button>
            {isOpen && (
              <div className="accordion-body" style={{ background: lightColor }}>
                <ul className="accordion-list">
                  {mod.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
