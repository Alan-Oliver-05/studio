"use client";
// This page is being redirected to /ai-note-taker to resolve a routing conflict.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SummarizerRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/ai-note-taker');
  }, [router]);
  return null; 
}
