
"use client";
// This page is deprecated. Voice translation is now part of /language-learning.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VoiceTranslatorRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/language-learning?mode=voice');
  }, [router]);
  return null; 
}
    