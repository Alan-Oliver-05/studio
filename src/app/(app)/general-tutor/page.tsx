// This page has been merged into the new Unified Agent page at /agent.
// You can now access the Conversational Tutor from there.
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/agent?tab=tutor');
  }, [router]);
  return null;
}
    