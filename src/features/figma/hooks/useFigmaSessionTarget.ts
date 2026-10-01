import { useSyncExternalStore } from "react";
import { sameProjectPath } from "../../projects/model/recents";
import {
  figmaSessionTarget,
  subscribeFigmaSessionTarget,
  type FigmaSessionTarget,
} from "../model/figmaTarget";

export function useFigmaSessionTarget(
  project: string,
): FigmaSessionTarget | null {
  const target = useSyncExternalStore(
    subscribeFigmaSessionTarget,
    figmaSessionTarget,
    figmaSessionTarget,
  );
  return target && sameProjectPath(target.cwd, project) ? target : null;
}
