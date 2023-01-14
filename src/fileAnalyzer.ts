import { State } from "./state";
import { Project } from "ts-morph";
import { IConfigInterface } from "./configurator";
import { analyze } from "./analyzer";

export const analyzeFilesByUnusedExports = (project: Project, state: State, entrypoints: string[] ,config: IConfigInterface) => {
  do {
    state.initializeResults();
    analyze(project, state.onResult, entrypoints, config.skip, config.ignore);
    state.definitelyUnused()
      .forEach(result => {
        if (!result.hasExportsReferencedInOtherFiles) {
          state.onUnusedFile(result.file);
          const sourceFile = project.getSourceFile(result.file);
          project.removeSourceFile(sourceFile);
        }
      });
  } while (state.definitelyUnused().filter(r => !r.hasExportsReferencedInOtherFiles).length);
};