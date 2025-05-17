
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChartBig, Construction } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="pr-4 md:pr-6 pb-4 md:pb-6 pt-0">
      <div className="mb-6 pt-0">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center mt-0">
          <BarChartBig className="mr-3 h-8 w-8" /> Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Insights into your learning patterns and progress.
        </p>
      </div>

      <Card className="text-center py-12 shadow-lg max-w-2xl mx-auto">
        <CardHeader className="p-4">
          <div className="mx-auto bg-accent/10 rounded-full p-4 w-fit">
            <Construction className="h-12 w-12 text-accent" />
          </div>
          <CardTitle className="mt-6 text-2xl">Analytics Coming Soon!</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-muted-foreground">
            We're working on bringing you detailed analytics and insights into your study habits.
            Stay tuned for updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
