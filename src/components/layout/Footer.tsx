import React from 'react';
import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

interface FooterProps {
  onSignInClick?: () => void;
}

export function Footer({ onSignInClick }: FooterProps) {
  return (
    <footer className="bg-white border-t border-[#E3E9E5] py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#E3E9E5]">
          <div className="md:col-span-1">
            <span className="text-xl font-bold tracking-tight text-[#183331] block mb-2">
              {BRAND_NAME}
            </span>
            <p className="text-xs text-[#71847D] leading-relaxed">
              A calmer way through what comes next. Thoughtful transition coordination for families.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#183331] mb-3">Product</h4>
            <ul className="space-y-2 text-xs text-[#71847D]">
              <li>
                <a href="/#how-it-works" className="hover:text-[#183331] transition-colors">How it works</a>
              </li>
              <li>
                <a href="/#for-families" className="hover:text-[#183331] transition-colors">For families</a>
              </li>
              <li>
                <Link href="/get-started" className="hover:text-[#183331] transition-colors">Talk to Nora</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#183331] mb-3">Account</h4>
            <ul className="space-y-2 text-xs text-[#71847D]">
              <li>
                {onSignInClick ? (
                  <button
                    type="button"
                    onClick={onSignInClick}
                    className="hover:text-[#183331] transition-colors cursor-pointer text-left"
                  >
                    Sign in
                  </button>
                ) : (
                  <Link href="/home" className="hover:text-[#183331] transition-colors">
                    My transitions
                  </Link>
                )}
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#183331] mb-3">Trust</h4>
            <ul className="space-y-2 text-xs text-[#71847D]">
              <li>
                <Link href="/privacy" className="hover:text-[#183331] transition-colors">Privacy</Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-[#183331] transition-colors">Security</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#879890]">
          <p>&copy; {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
          <p>Built with care for families everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
