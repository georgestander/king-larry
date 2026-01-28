import { StudioShell } from "@/app/components/shell/StudioShell";
import { SettingsClient } from "@/app/pages/settings-client";
import { listSurveySummaries } from "@/server/store";

export const SettingsPage = async () => {
  const surveys = await listSurveySummaries();

  return (
    <StudioShell
      surveys={surveys.map((survey) => ({
        id: survey.id,
        title: survey.title,
        version_count: survey.version_count,
      }))}
      activeNav="settings"
    >
      <section className="flex-1 space-y-6">
        <SettingsClient />
      </section>
    </StudioShell>
  );
};

