import path from "path";
import JSON5 from "json5";
import fs from "fs";

import { analyze } from "./analyzer";
import { initialize } from "./initializer";
import { State } from "./state";
import { present, presentUnusedFiles } from "./presenter";
import { IConfigInterface } from "./configurator";
import { analyzeFilesByUnusedExports } from "./fileAnalyzer";
import { removeUnusedFiles } from "./remover";

export const run = (config: IConfigInterface, output = console.log) => {
  const tsConfigPath = path.resolve(config.project);
  const { project } = initialize(tsConfigPath);
  const tsConfigJSON = JSON5.parse(fs.readFileSync(tsConfigPath, "utf-8"));

  const entrypoints: string[] =
    tsConfigJSON?.files?.map((file: string) =>
      path.resolve(path.dirname(tsConfigPath), file)
    ) || [];

  const state = new State();

  if (config.remove_files) {
    analyzeFilesByUnusedExports(project, state, entrypoints, config);
    const presented = presentUnusedFiles(state);
    presented.forEach(value => {
      output(value);
    });
    output(`found ${presented.length} unused files`);
    if (presented.length > 0) {
      output('It is recommended to double check if these files are actually used or not before proceeding!');
      output('proceed to delete these files? (y/n)');
      process.stdin.on('data', (data) => {
        if (data != null) {
          if (data.toString().trim() === 'y') {
            output('deleting...');
            removeUnusedFiles(state);
            process.exit(0);
          }else if (data.toString().trim() === 'n') {
            process.exit(0);
          } else {
            output("please enter 'y' or 'n'")
          }
        }
      });
    }
    return presented.length;
  }

  analyze(project, state.onResult, entrypoints, config.skip, config.ignore);

  const presented = present(state);
  
  presented.forEach(value => {
    output(value);
  });

  output(`found ${presented.length} unused exports`)

  return presented.length;
};
