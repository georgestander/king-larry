import Dashboard from "./dashboard.js";
import { ensureSeedData, listScripts, listSessions } from "@/server/store";

export const Home = async () => {
  await ensureSeedData();
  const [scripts, sessions] = await Promise.all([listScripts(), listSessions()]);
  return <Dashboard scripts={scripts} sessions={sessions} />;
};
