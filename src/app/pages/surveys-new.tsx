import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

export const SurveysNewPage = async () => (
  <div className="min-h-screen bg-ink-50 text-ink-950 [background-image:radial-gradient(1200px_circle_at_top,_rgba(255,255,255,0.9),_transparent)]">
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <Card className="border-ink-200/70 bg-white/95">
        <CardHeader>
          <CardTitle>Create a new survey</CardTitle>
          <CardDescription>Start with a brief and build a narrative interview step by step.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-ink-600">
          <p>We will guide you through: brief → script → test → publish → invite.</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a href="/surveys">Back to dashboard</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);
