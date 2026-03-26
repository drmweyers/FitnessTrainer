'use client';

import React from 'react';

/** A trainer certification with a computed days-until-expiry value. */
export interface ExpiringCertification {
  id: string;
  certificationName: string;
  issuingOrganization: string;
  expiryDate: string;
  daysUntilExpiry: number;
}

interface CertExpirationAlertProps {
  /** List of certifications expiring within the alert window. */
  certifications: ExpiringCertification[];
}

/**
 * CertExpirationAlert — amber warning banner shown on the trainer profile page
 * when one or more certifications are expiring within 30 days.
 * Items expiring within 7 days are highlighted with urgent (red) styling.
 */
export default function CertExpirationAlert({ certifications }: CertExpirationAlertProps) {
  if (certifications.length === 0) return null;

  return (
    <div
      role="alert"
      className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-3"
    >
      <div className="flex items-center space-x-2">
        <svg
          className="w-5 h-5 text-amber-600 shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <h3 className="text-sm font-semibold text-amber-800">
          Certification{certifications.length > 1 ? 's' : ''} expiring soon
        </h3>
      </div>

      <ul className="space-y-2">
        {certifications.map((cert) => {
          const isUrgent = cert.daysUntilExpiry <= 7;
          return (
            <li
              key={cert.id}
              className={`flex items-start justify-between rounded-md px-3 py-2 text-sm ${
                isUrgent
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              <div>
                <span className="font-medium">{cert.certificationName}</span>
                <span className="ml-1 text-xs opacity-75">({cert.issuingOrganization})</span>
              </div>
              <span className="ml-4 shrink-0 font-medium">
                {cert.daysUntilExpiry === 1
                  ? '1 day left'
                  : `${cert.daysUntilExpiry} days left`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
