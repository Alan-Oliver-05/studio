
"use client";
// This page is deprecated. Conversation translation is now part of /language-learning.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConversationTranslatorRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/language-learning?mode=conversation');
  }, [router]);
  return null; 
}
    