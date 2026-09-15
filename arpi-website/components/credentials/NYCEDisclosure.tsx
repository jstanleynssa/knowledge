/**
 * NY State Insurance CE Disclosure
 *
 * Required by the New York State Department of Financial Services for
 * online continuing education courses sold to NY licensees.
 *
 * Must appear on the purchase page BEFORE the licensee purchases the course.
 * Update PROVIDER_NUMBER, CREDIT_HOURS, LICENSE_CLASSES, and EXPIRATION_DATE
 * once NY formally approves each course.
 */

interface NYCEDisclosureProps {
  /** e.g. "NSSA®" or "IRMAACP™" */
  credential: string
  /** Number of exam questions */
  examQuestions: number
  /** NY-approved CE hours (null = still pending) */
  ceHours: number | null
  /** NY provider approval number (null = still pending) */
  providerNumber: string | null
  /** NY license classes (null = still pending) */
  licenseClasses: string | null
  /** NY course expiration date (null = still pending) */
  expirationDate: string | null
}

const PENDING = (
  <span style={{
    display: 'inline-block',
    background: '#fef9c3',
    color: '#854d0e',
    fontWeight: 700,
    fontSize: '0.72rem',
    padding: '2px 8px',
    borderRadius: 3,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
  }}>
    Pending NY Approval
  </span>
)

export default function NYCEDisclosure({
  credential,
  examQuestions,
  ceHours,
  providerNumber,
  licenseClasses,
  expirationDate,
}: NYCEDisclosureProps) {
  return (
    <section style={{
      background: '#f8fafc',
      border: '1px solid #e5e7eb',
      borderLeft: '4px solid #374151',
      borderRadius: 8,
      padding: '28px 32px',
      marginTop: 32,
    }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{
          fontSize: '0.7rem',
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          color: '#374151',
          margin: '0 0 6px',
        }}>
          New York State — Insurance CE Disclosure
        </p>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
          The following information is required by the New York State Department of Financial
          Services for online continuing education courses. This must be reviewed before purchase.
        </p>
      </div>

      {/* Provider info grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 24,
        padding: '16px 0',
        borderTop: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb',
      }}>
        {[
          { label: 'Provider Approval Number', value: providerNumber ?? PENDING },
          { label: 'CE Credits', value: ceHours !== null ? `${ceHours} hours` : PENDING },
          { label: 'License Classes', value: licenseClasses ?? PENDING },
          { label: 'Course Expiration Date', value: expirationDate ?? PENDING },
        ].map((item, i) => (
          <div key={i}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#9ca3af', margin: '0 0 4px' }}>
              {item.label}
            </p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0 }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Exam requirement notice */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#374151', margin: '0 0 8px' }}>
          Exam Requirement
        </p>
        <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.7, margin: 0 }}>
          To receive CE credit, you must take and pass a final exam{' '}
          <strong>without assistance or reference material</strong>.
          A minimum grade of 70% is required to pass.
          The {credential} exam contains {examQuestions} questions.
        </p>
      </div>

      {/* System requirements */}
      <div>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#374151', margin: '0 0 8px' }}>
          System Requirements
        </p>
        <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.7, margin: '0 0 8px' }}>
          To complete this course you will need:
        </p>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem', color: '#374151', lineHeight: 1.8 }}>
          <li>A modern web browser — Google Chrome, Mozilla Firefox, Apple Safari, or Microsoft Edge (most recent version recommended)</li>
          <li>Stable broadband internet connection (minimum 3 Mbps)</li>
          <li>Speakers or headphones for audio and video content</li>
          <li>A PDF viewer for the course companion reference guide</li>
          <li>JavaScript and cookies enabled in your browser</li>
        </ul>
      </div>
    </section>
  )
}
