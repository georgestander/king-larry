export type SurveyStepStatus = "complete" | "current" | "upcoming";

export type SurveyStep = {
  id: "brief" | "script" | "test" | "publish" | "results";
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
};

export const buildSurveySteps = ({
  surveyId,
  activeStep,
  hasScript,
  hasPreview,
  hasRuns,
}: BuildStepsInput): SurveyStep[] => {
  const order: SurveyStep["id"][] = ["brief", "script", "test", "publish", "results"];
  const isComplete = (step: SurveyStep["id"]) => {
    if (step === "brief") return hasScript;
    if (step === "script") return hasScript;
    if (step === "test") return hasPreview || activeStep === "publish" || activeStep === "results";
    if (step === "publish") return hasRuns;
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
            ? "Publish & invite"
            : "Results";
    return {
      id: step,
      label,
      href,
      status,
    };
  });
};
