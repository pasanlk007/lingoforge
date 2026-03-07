import { Navigation } from "@/components/Navigation";
import { AIGuideClient } from "@/components/AIGuideClient";

export default function AIGuidePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl py-12">
            <AIGuideClient />
        </div>
      </main>
    </div>
  );
}
