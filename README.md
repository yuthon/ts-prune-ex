![npm](https://img.shields.io/npm/dm/ts-prune-ex) ![GitHub issues](https://img.shields.io/github/issues-raw/yuthon/ts-prune-ex)

# ts-prune-ex

[ts-prune](https://github.com/nadeesha/ts-prune) is a library that finds potentially unused exports in your Typescript project with zero configuration. I expanded and added an '-rf' configuration option to find and remove unused files based on those unused exports.

※The option is experimental. I recommend you to checkout to a new branch to test out before actually using it.

## Getting Started

`ts-prune-ex` exposes a cli that reads your tsconfig file and prints out all the unused exports in your source files.

### Installing

Install ts-prune-ex with yarn or npm

```sh
# npm
npm install ts-prune-ex --save-dev
# yarn
yarn add -D ts-prune-ex
```

### Usage

You can install it in your project and alias it to a npm script in package.json.

```json
{
  "scripts": {
    "find-deadcode": "ts-prune-ex"
  }
}
```

If you want to run against different Typescript configuration than tsconfig.json:

```sh
ts-prune-ex -p tsconfig.dev.json
```

### When using in a NextJS project

NextJS has files with default exports under src/pages, and these exports will be detected as unused by ts-prune since they are not imported anywhere. Because of this, ts-prune-ex will detect files under src/pages as unused.

To solve this issue, you need to use `-i 'src/ignore-this-path'` option like below.

```sh
ts-prune-ex -i 'src/pages'
```

this will cause ts-prune to ignore all files under 'src/pages'.

### Configuration

ts-prune-ex supports CLI and file configuration via [cosmiconfig](https://github.com/davidtheclark/cosmiconfig#usage) (all file formats are supported).

#### Configuration options

- `-p, --project` - __tsconfig.json__ path(`tsconfig.json` by default)
- `-i, --ignore` - errors ignore RegExp pattern
- `-e, --error` - return error code if unused exports are found
- `-s, --skip` - skip these files when determining whether code is used. (For example, `.test.ts?` will stop ts-prune from considering an export in test file usages)
- `-rf, --remove_files` - find unused files based on unused exports and print those files, and then you can choose to proceed to delete them or not.

CLI configuration options:

```bash
ts-prune-ex -p my-tsconfig.json -i my-component-ignore-patterns?
```

Configuration file example `.ts-prunerc`: 

```json
{
  "ignore": "my-component-ignore-patterns?"
}
```

### FAQ

#### How do I get the count of unused exports?

```sh
ts-prune-ex | wc -l
```

#### How do I ignore a specific path?

You can either,

##### 1. Use the `-i, --ignore` configuration option:

```sh
ts-prune-ex --ignore 'src/ignore-this-path'
```

##### 2. Use `grep -v` to filter the output:

```sh
ts-prune-ex | grep -v src/ignore-this-path
```

#### How do I ignore multiple paths?

You can either,

##### 1. Use the `-i, --ignore` configuration option:

```sh
ts-prune-ex --ignore 'src/ignore-this-path|src/also-ignore-this-path'
```

##### 2. Use multiple `grep -v` to filter the output:

```sh
ts-prune-ex | grep -v src/ignore-this-path | grep -v src/also-ignore-this-path
```

#### How do I ignore a specific identifier?

You can either,

##### 1. Prefix the export with `// ts-prune-ignore-next`

```ts
// ts-prune-ignore-next
export const thisNeedsIgnoring = foo;
```

##### 2. Use `grep -v` to ignore a more widely used export name

```sh
ts-prune-ex | grep -v ignoreThisThroughoutMyCodebase
```
