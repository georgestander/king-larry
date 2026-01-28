export type EditorQuestion = {
  id: number;
  topic: string;
  question: string;
  probes: string[];
};

export type ScriptEditorDraft = {
  meta: {
    title: string;
    subtitle: string;
    id?: string;
    version?: string;
  };
  briefingMarkdown: string;
  promptMarkdown: string;
  questions: EditorQuestion[];
};
