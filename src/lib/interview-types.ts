export type InterviewQuestion = {
  id: number;
  topic: string;
  question: string;
  probes?: string[];
};

export type InterviewDefinition = {
  meta: {
    id: string;
    version: string;
    title: string;
    subtitle: string;
    participant?: string;
  };
  context?: {
    briefingMarkdown?: string;
    scriptMarkdown?: string;
    scriptMarkdownPath?: string;
    [key: string]: unknown;
  };
  questions: InterviewQuestion[];
};
