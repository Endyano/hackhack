'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import AppNav from './AppNav';

const bgDark = '#090C0B';
const accentLime = '#D4FF3E';
const textGray = '#9CA3AF';

type PageShellProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  contentMaxWidth?: string;
  backgroundImage?: string;
};

export default function PageShell({ eyebrow, title, description, children, contentMaxWidth = '1180px', backgroundImage }: PageShellProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: bgDark,
        backgroundImage: backgroundImage
          ? `linear-gradient(180deg, rgba(9, 12, 11, 0.92) 0%, rgba(9, 12, 11, 0.82) 45%, rgba(9, 12, 11, 0.96) 100%), radial-gradient(circle at 85% 0%, rgba(212, 255, 62, 0.1) 0%, transparent 55%), url('${backgroundImage}')`
          : `radial-gradient(circle at 85% 0%, rgba(212, 255, 62, 0.1) 0%, transparent 55%)`,
        backgroundSize: backgroundImage ? 'cover, cover, cover' : undefined,
        backgroundPosition: backgroundImage ? 'center, center, center' : undefined,
        backgroundAttachment: backgroundImage ? 'fixed, fixed, fixed' : undefined,
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <style>
        {`
          .dash-btn { transition: all 0.2s ease; }
          .dash-btn:hover { transform: translateY(-2px); }
          .back-link { transition: color 0.2s ease; }
          .back-link:hover { color: white !important; }
        `}
      </style>

      <AppNav />

      <div style={{ maxWidth: contentMaxWidth, margin: '0 auto', padding: '32px 5% 60px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div>
          <Link href="/dashboard" className="back-link" style={{ color: textGray, fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
          <p style={{ margin: '18px 0 0', color: accentLime, fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {eyebrow}
          </p>
          <h1 style={{ margin: '10px 0 0', fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 900, letterSpacing: '-1px' }}>{title}</h1>
          {description && <p style={{ margin: '10px 0 0', color: '#cbd5e1', maxWidth: '640px', fontSize: '15px' }}>{description}</p>}
        </div>

        {children}
      </div>
    </div>
  );
}
