'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      };
      const formattedDateTime = now.toLocaleString("en-US", options);
      setCurrentDateTime(formattedDateTime);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  priority
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">PT Influencer</p>
                  <p className="text-xs text-gray-500">Professional Training Platform</p>
                </div>
              </Link>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-gray-900 mb-2 flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                <span>Live Updates</span>
              </p>
              <p className="text-sm text-gray-600">{currentDateTime}</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Links</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link 
                  href="/workouts" 
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Workouts
                </Link>
                <Link 
                  href="/recipes" 
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Recipes
                </Link>
                <Link 
                  href="/programs" 
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Programs
                </Link>
                <Link 
                  href="/clients" 
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Clients
                </Link>
              </div>
            </div>

            <div className="text-center md:text-right text-sm text-gray-500">
              <p>© {new Date().getFullYear()} PT Influencer. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 