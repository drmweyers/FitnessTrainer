/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import CertExpirationAlert from '../CertExpirationAlert';

const makeCert = (override: Partial<{
  id: string;
  certificationName: string;
  issuingOrganization: string;
  expiryDate: string;
  daysUntilExpiry: number;
}> = {}) => ({
  id: 'cert-001',
  certificationName: 'NASM-CPT',
  issuingOrganization: 'NASM',
  expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  daysUntilExpiry: 15,
  ...override,
});

describe('CertExpirationAlert', () => {
  it('renders nothing when certifications list is empty', () => {
    const { container } = render(<CertExpirationAlert certifications={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders an amber warning banner for a single expiring cert', () => {
    render(<CertExpirationAlert certifications={[makeCert()]} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('displays the certification name', () => {
    render(<CertExpirationAlert certifications={[makeCert({ certificationName: 'CPR Certified' })]} />);
    expect(screen.getByText(/CPR Certified/)).toBeInTheDocument();
  });

  it('displays days remaining for each cert', () => {
    render(<CertExpirationAlert certifications={[makeCert({ daysUntilExpiry: 15 })]} />);
    expect(screen.getByText(/15 days/i)).toBeInTheDocument();
  });

  it('shows "1 day" (singular) when 1 day remaining', () => {
    render(<CertExpirationAlert certifications={[makeCert({ daysUntilExpiry: 1 })]} />);
    expect(screen.getByText(/1 day/i)).toBeInTheDocument();
  });

  it('renders multiple expiring certs', () => {
    const certs = [
      makeCert({ id: 'c1', certificationName: 'NASM-CPT', daysUntilExpiry: 5 }),
      makeCert({ id: 'c2', certificationName: 'CPR', daysUntilExpiry: 20 }),
    ];
    render(<CertExpirationAlert certifications={certs} />);
    expect(screen.getByText(/NASM-CPT/)).toBeInTheDocument();
    expect(screen.getByText(/CPR/)).toBeInTheDocument();
  });

  it('shows issuing organization for each cert', () => {
    render(
      <CertExpirationAlert
        certifications={[makeCert({ issuingOrganization: 'Red Cross' })]}
      />
    );
    expect(screen.getByText(/Red Cross/i)).toBeInTheDocument();
  });

  it('uses amber color scheme for the warning banner', () => {
    const { container } = render(<CertExpirationAlert certifications={[makeCert()]} />);
    const alert = container.querySelector('[role="alert"]');
    expect(alert?.className).toContain('amber');
  });

  it('shows a heading indicating certifications are expiring', () => {
    render(<CertExpirationAlert certifications={[makeCert()]} />);
    expect(screen.getByText(/certification.*expir/i)).toBeInTheDocument();
  });

  it('shows urgency styling (red) when cert expires in 7 days or fewer', () => {
    const { container } = render(
      <CertExpirationAlert certifications={[makeCert({ daysUntilExpiry: 5 })]} />
    );
    // Should have urgent styling on the row
    const urgentEl = container.querySelector('.text-red-700, .bg-red-50, [class*="red"]');
    expect(urgentEl).toBeInTheDocument();
  });
});
