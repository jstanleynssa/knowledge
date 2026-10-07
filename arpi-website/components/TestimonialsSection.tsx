'use client'

import Script from 'next/script'
import './TestimonialsSection.css'

export default function TestimonialsSection() {
  return (
    <section className="testimonials-section">
      <div className="container">
        <Script
          src="https://elfsightcdn.com/platform.js"
          strategy="lazyOnload"
        />
        <div
          className="elfsight-app-0fea18cd-6017-4cd4-b52f-1c4d7d2c8c30"
          data-elfsight-app-lazy
        />
      </div>
    </section>
  )
}
