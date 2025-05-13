
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/contexts/user-profile-context";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { profile, isLoading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (profile && profile.name) { // check for a valid profile
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [profile, isLoading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading EduAI...</p>
    </div>
  );
}
