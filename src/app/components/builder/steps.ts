export type SurveyStepStatus = "complete" | "current" | "upcoming";

export type SurveyStep = {
  id: "brief" | "script" | "test" | "publish" | "invite" | "results";
  label: string;
  href: string;
  status: SurveyStepStatus;
};

type BuildStepsInput = {
  surveyId: string;
  activeStep: SurveyStep["id"];
  hasScript: boolean;
  hasPreview: boolean;
  hasRuns: boolean;
  hasInvites: boolean;
};

export const buildSurveySteps = ({
  surveyId,
  activeStep,
  hasScript,
  hasPreview,
  hasRuns,
  hasInvites,
}: BuildStepsInput): SurveyStep[] => {
  const order: SurveyStep["id"][] = ["brief", "script", "test", "publish", "invite", "results"];
  const activeIndex = Math.max(order.indexOf(activeStep), 0);
  const isPast = (step: SurveyStep["id"]) => order.indexOf(step) < activeIndex;

  const isComplete = (step: SurveyStep["id"]) => {
    if (isPast(step)) return true;
    if (step === "brief") return hasScript;
    if (step === "script") return hasScript;
    if (step === "test") return hasPreview;
    if (step === "publish") return hasRuns;
    if (step === "invite") return hasInvites;
    if (step === "results") return hasRuns;
    return false;
  };

  return order.map((step) => {
    const status: SurveyStepStatus = step === activeStep
      ? "current"
      : isComplete(step)
        ? "complete"
        : "upcoming";
    const hrefBase = `/surveys/${surveyId}`;
    const href = step === "script"
      ? `${hrefBase}/script`
      : step === "test"
        ? `${hrefBase}/test`
        : step === "publish"
          ? `${hrefBase}/publish`
          : step === "invite"
            ? `${hrefBase}/invite`
            : step === "results"
              ? `${hrefBase}/runs`
              : hrefBase;
    const label = step === "brief"
      ? "Brief"
      : step === "script"
        ? "Script"
        : step === "test"
          ? "Test chat"
          : step === "publish"
            ? "Publish"
            : step === "invite"
              ? "Invite"
              : "Results";
    return {
      id: step,
      label,
      href,
      status,
    };
  });
};
