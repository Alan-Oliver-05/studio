
import { OnboardingForm } from "./components/onboarding-form";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 sm:p-6 lg:p-8">
      <OnboardingForm />
    </div>
  );
}
