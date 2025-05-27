
"use client";
// This page is deprecated. Camera translation is now part of /language-learning.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CameraTranslatorRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/language-learning?mode=camera');
  }, [router]);
  return null; 
}
    