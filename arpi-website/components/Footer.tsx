import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-brand">
            <Image src="/assets/arpi-logo.png" alt="ARPI" width={160} height={80} style={{ height: 80, width: 'auto' }} />
            <p className="footer-tagline">
              Empowering financial professionals with rigorous credentials, active community,
              and continuously updated expertise.
            </p>
            <p className="footer-address">
              1763 Columbia Road NW<br />Ste 175 PMB 481983<br />Washington, DC 20009
            </p>
            <div className="footer-social">
              <a className="footer-social-icon" href="#" title="LinkedIn">in</a>
              <a className="footer-social-icon" href="#" title="Twitter/X">𝕏</a>
              <a className="footer-social-icon" href="#" title="Facebook">f</a>
            </div>
          </div>

          {/* Credentials */}
          <div className="footer-col footer-col-credentials">
            <div className="footer-col-label">Credentials</div>
            <ul>
              <li><a href="/credentials/nssa">NSSA® — National Social Security Advisor</a></li>
              <li><a href="/credentials/irmaacp">IRMAACP™ — IRMAA Certified Planner</a></li>
              <li><a href="/credentials/celp">CELP® — Certified End-of-Life Planner</a></li>
              <li><a href="/credentials">Compare Credentials</a></li>
              <li><a href="/ce-credits">CE Credit Information</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-col">
            <div className="footer-col-label">Resources</div>
            <ul>
              <li><a href="/codex">Knowledge Base</a></li>
              <li><a href="/axiom">AXIOM® Platform</a></li>
              <li><a href="https://members.nssapros.com" target="_blank" rel="noopener noreferrer">Member Community</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="https://www.nssapros.com/directory" target="_blank" rel="noopener noreferrer">Find an Advisor</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-col">
            <div className="footer-col-label">Company</div>
            <ul>
              <li><a href="/about">About ARPI</a></li>
              <li><a href="/mission">Our Mission</a></li>
              <li><a href="/contact">Contact Us</a></li>
              <li><a href="/press">Press &amp; Media</a></li>
              <li><a href="/careers">Careers</a></li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-bar">
            <div className="footer-bottom-finra">
              <span className="footer-bottom-finra-label">FINRA Recognized</span>
              <Image src="/assets/FINRA-Logo.png" alt="FINRA" width={60} height={18} style={{ height: 18, width: 'auto' }} />
            </div>
            <div className="footer-bottom-links">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="/accessibility">Accessibility</a>
            </div>
          </div>
          <div className="footer-copyright">
            © 2026 Advanced Retirement Planning Institute (ARPI). All rights reserved. NSSA®, IRMAACP™, CELP®, and AXIOM® are registered marks of ARPI.
          </div>
        </div>
      </div>
    </footer>
  )
}
