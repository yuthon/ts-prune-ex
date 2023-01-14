import path from "path";
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  constants,
  promises,
} from "fs";
import { Project } from "ts-morph";
import { State } from "./state";
import { analyzeFilesByUnusedExports } from "./fileAnalyzer";
import { IConfigInterface } from "./configurator";
import { removeUnusedFiles } from "./remover";
import JSON5 from "json5";

const tsconfigSrc = `
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "noImplicitAny": true,
    "removeComments": true,
    "preserveConstEnums": true,
    "outDir": "lib",
    "sourceMap": true,
    "declaration": true,
    "lib": [
      "esnext"
    ],
    "esModuleInterop": true
  },
  "files": [
    "src/index.ts"
  ],
  "include": [
    "src"
  ],
  "exclude": [
    "node_modules",
    "**/*.spec.ts",
  ]
}
`;
// starting point of the project, use export from file1
const indexSrc = `
import {x} from './file1';
const root = x;
`;
// have an export referenced in index.ts, used in the project
const file1Src = `
import {y} from './file2';
export const x = 'x';
`;
// have an export referenced in other files, used in a project
const file2Src = `
export const y = 'y';
`;
// only have an export not used anywhere
const file3Src = `
export cosnt unused = 'unused';
`;
// file4 and file5 are intended to be detected as unused
// have an export referenced in other files, but not used in a project
const file4Src = `
export const foo = 'foo';
`;
// only have an export not used anywhere, import from unused-file
const file5Src = `
import {foo} from './file4';
export const use_foo = foo;
`;

describe("remove files that are unused when compiling based on tsconfig.json", () => {
  try {
    mkdirSync('remove-files-test-root');
    mkdirSync('remove-files-test-root/src');
    writeFileSync('remove-files-test-root/tsconfig.json',tsconfigSrc);
    writeFileSync('remove-files-test-root/src/index.ts',indexSrc);
    writeFileSync('remove-files-test-root/src/file1.ts',file1Src);
    writeFileSync('remove-files-test-root/src/file2.ts',file2Src);
    writeFileSync('remove-files-test-root/src/file3.ts',file3Src);
    writeFileSync('remove-files-test-root/src/file4.ts',file4Src);
    writeFileSync('remove-files-test-root/src/file5.ts',file5Src);
  } catch (err) {
    console.error(err);
  }

  const project = new Project({tsConfigFilePath: path.resolve("remove-files-test-root/tsconfig.json")});

  const state = new State();

  const config: IConfigInterface = {
    project: "tsconfig.json",
    ignore: undefined,
    error: undefined,
    skip: undefined,
    remove_files: "true",
  };

  const tsConfigPath = path.resolve(config.project!);

  const tsConfigJSON = JSON5.parse(readFileSync(tsConfigPath, "utf-8"));

  const entrypoints: string[] =
  tsConfigJSON?.files?.map((file: string) =>
    path.resolve(path.dirname(tsConfigPath), file)
  ) || [];


  const indexFilePath = path.resolve("remove-files-test-root/src/index.ts");
  const file1Path = path.resolve("remove-files-test-root/src/file1.ts");
  const file2Path = path.resolve("remove-files-test-root/src/file2.ts");
  const file3Path = path.resolve("remove-files-test-root/src/file3.ts");
  const file4Path = path.resolve("remove-files-test-root/src/file4.ts");
  const file5Path = path.resolve("remove-files-test-root/src/file5.ts");
  
  it("find unused files in a project", () => {
    analyzeFilesByUnusedExports(project, state, entrypoints, config);
    expect(state.getUnusedFiles().sort()).toEqual([file4Path, file5Path].sort());
  });

  it("remove unused files", async() => {
    analyzeFilesByUnusedExports(project, state, entrypoints, config);
    removeUnusedFiles(state);
    let error = null;
    try {
      await promises.access(indexFilePath, constants.F_OK);
      await promises.access(file1Path, constants.F_OK);
      await promises.access(file2Path, constants.F_OK);
      await promises.access(file3Path, constants.F_OK);
    } catch (err) {
      error = err;
    }
    expect(error).toBeNull();
    try {
      await promises.readFile(file4Path);
    } catch (err) {
      expect(err.message).toContain('ENOENT');
    }
    try {
      await promises.readFile(file5Path);
    } catch (err) {
      expect(err.message).toContain('ENOENT');
    }
  });

  afterAll(async() => {
    const pathToRootDir = path.resolve("remove-files-test-root");
    const pathToSrcDir = path.resolve("remove-files-test-root/src");
  
    const filesUnderSrc = await promises.readdir(pathToSrcDir)
    filesUnderSrc.forEach(async(file) => {
      await promises.unlink(pathToSrcDir + '/' + file);
    })
    await promises.unlink(pathToRootDir + '/tsconfig.json');
    await promises.rmdir(pathToSrcDir);
    await promises.rmdir(pathToRootDir);
  });
});

