"use client";
// This page handles the redirect from /summarizer to /ai-note-taker

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SummarizerRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/ai-note-taker');
  }, [router]);

  // Render nothing as it will redirect
  return null;
}
