'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const WHATSAPP_SVG = (
  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

interface TrainerWhatsApp {
  name: string;
  whatsappNumber: string | null;
  whatsappLink: string | null;
}

export default function ClientWhatsAppFloat() {
  const { user, isAuthenticated } = useAuth();
  const [trainer, setTrainer] = useState<TrainerWhatsApp | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'client') return;

    const token = localStorage.getItem('accessToken');
    fetch('/api/clients/trainer', {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
      .then(res => res.ok ? res.json() : null)
      .then(result => {
        if (result?.success && result.data) {
          const d = result.data;
          if (d.whatsappNumber || d.whatsappLink) {
            setTrainer({
              name: d.name || d.email?.split('@')[0] || 'Trainer',
              whatsappNumber: d.whatsappNumber || null,
              whatsappLink: d.whatsappLink || null,
            });
          }
        }
      })
      .catch(() => {});
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  if (!trainer) return null;

  const hasNumber = !!trainer.whatsappNumber;
  const hasLink = !!trainer.whatsappLink;
  const hasBoth = hasNumber && hasLink;

  const directUrl = hasNumber
    ? `https://wa.me/${trainer.whatsappNumber!.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hi ${trainer.name}, I'm reaching out from EvoFit!`)}`
    : null;

  const communityUrl = hasLink
    ? (trainer.whatsappLink!.startsWith('http') ? trainer.whatsappLink! : `https://${trainer.whatsappLink}`)
    : null;

  if (!hasBoth) {
    const url = directUrl || communityUrl!;
    const label = hasNumber ? `Chat with ${trainer.name}` : 'Join Community';
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
        aria-label={label}
      >
        {WHATSAPP_SVG}
      </a>
    );
  }

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
      {menuOpen && (
        <div className="absolute bottom-16 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden w-64 animate-in fade-in slide-in-from-bottom-2">
          <div className="px-4 py-3 bg-[#25D366] text-white">
            <p className="font-semibold text-sm">Contact {trainer.name}</p>
          </div>
          <a
            href={directUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <svg className="w-5 h-5 text-[#25D366] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Direct Message</p>
              <p className="text-xs text-gray-500">Chat 1-on-1 with your trainer</p>
            </div>
          </a>
          <div className="border-t border-gray-100" />
          <a
            href={communityUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            <svg className="w-5 h-5 text-[#25D366] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Join Community</p>
              <p className="text-xs text-gray-500">Group chat with fellow clients</p>
            </div>
          </a>
        </div>
      )}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className={`w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 ${menuOpen ? 'ring-2 ring-white ring-offset-2 ring-offset-[#25D366]' : ''}`}
        aria-label="WhatsApp options"
        aria-expanded={menuOpen}
      >
        {WHATSAPP_SVG}
      </button>
    </div>
  );
}
