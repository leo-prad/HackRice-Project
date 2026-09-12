import { RequireAuth } from "../components/RequireAuth";
import WorkbenchLayout from "./WorkbenchLayout";

/** Authenticated routes — unified mail workbench shell. */
export default function AppLayout() {
  return (
    <RequireAuth>
      <WorkbenchLayout />
    </RequireAuth>
  );
}
