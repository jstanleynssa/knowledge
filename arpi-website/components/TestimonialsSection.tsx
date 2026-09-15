const testimonials = [
  {
    initials: 'MR',
    name: 'Michael R.',
    title: 'Retirement Planning Specialist · Texas',
    text: 'The NSSA credential completely changed how I position myself with clients. The depth of the curriculum was exactly what I needed — not generic, but genuinely rigorous. My clients notice the difference.',
  },
  {
    initials: 'SL',
    name: 'Sandra L., CFP®',
    title: 'Financial Advisor · Georgia',
    text: 'IRMAACP gave me a framework for Medicare conversations I was struggling to have confidently. Now I\'m the go-to advisor in my office for high-income Medicare planning. Worth every dollar.',
  },
  {
    initials: 'DK',
    name: 'David K.',
    title: 'Tax & Retirement Planner · Ohio',
    text: 'The annual content updates alone make ARPI membership worth it. Social Security rules shifted twice last year — both times, updated modules were ready before my clients even asked me about the changes.',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="testimonials-header">
          <div className="section-eyebrow">From Our Members</div>
          <h2 className="section-title">Trusted by Professionals Across the Country</h2>
          <p className="section-sub">Our members earn credentials that open doors — and stay connected to a community that keeps them sharp.</p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t) => (
            <div className="testimonial-card" key={t.initials}>
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.initials}</div>
                <div>
                  <div className="author-name">{t.name}</div>
                  <div className="author-title">{t.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
