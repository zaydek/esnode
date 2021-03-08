#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __exportStar = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  return __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? {get: () => module2.default, enumerable: true} : {value: module2, enumerable: true})), module2);
};

// src/esnode.ts
var esbuild = __toModule(require("esbuild"));
var fsp2 = __toModule(require("fs/promises"));
var path2 = __toModule(require("path"));

// src/terminal/terminal.ts
var opts = [
  {name: "normal", code: "[0m"},
  {name: "bold", code: "[1m"},
  {name: "dim", code: "[2m"},
  {name: "underline", code: "[4m"},
  {name: "black", code: "[30m"},
  {name: "red", code: "[31m"},
  {name: "green", code: "[32m"},
  {name: "yellow", code: "[33m"},
  {name: "blue", code: "[34m"},
  {name: "magenta", code: "[35m"},
  {name: "cyan", code: "[36m"},
  {name: "white", code: "[37m"},
  {name: "bgBlack", code: "[40m"},
  {name: "bgRed", code: "[41m"},
  {name: "bgGreen", code: "[42m"},
  {name: "bgYellow", code: "[43m"},
  {name: "bgBlue", code: "[44m"},
  {name: "bgMagenta", code: "[45m"},
  {name: "bgCyan", code: "[46m"},
  {name: "bgWhite", code: "[47m"}
];
function build(...codes) {
  function format2(...args) {
    if (args.length === 0)
      return "";
    const code = codes.join("");
    return code + args.join(" ").replaceAll("[0m", "[0m" + code) + "[0m";
  }
  for (const {name, code} of opts) {
    Object.defineProperty(format2, name, {
      enumerable: true,
      get() {
        return build(...new Set([...codes, code]));
      }
    });
  }
  return format2;
}
var normal = build("[0m");
var bold = build("[1m");
var dim = build("[2m");
var underline = build("[4m");
var black = build("[30m");
var red = build("[31m");
var green = build("[32m");
var yellow = build("[33m");
var blue = build("[34m");
var magenta = build("[35m");
var cyan = build("[36m");
var white = build("[37m");
var bgBlack = build("[40m");
var bgRed = build("[41m");
var bgGreen = build("[42m");
var bgYellow = build("[43m");
var bgBlue = build("[44m");
var bgMagenta = build("[45m");
var bgCyan = build("[46m");
var bgWhite = build("[47m");

// src/utils/formatMessages.ts
var path = __toModule(require("path"));
function formatImpl(message) {
  const loc = message.location;
  let namespace = "";
  namespace += path.relative(process.cwd(), loc.file) + ":";
  namespace += loc.line + ":";
  namespace += loc.column + 1;
  let text = message.text;
  if (text.endsWith("is not defined")) {
    loc.length = text.slice(0, -" is not defined".length).length;
  }
  let code = "";
  code += loc.lineText.slice(0, loc.column);
  code += green(loc.lineText.slice(loc.column, loc.column + loc.length));
  code += loc.lineText.slice(loc.column + loc.length);
  let gutter1 = "";
  gutter1 += " ".repeat(3);
  gutter1 += loc.line + " ";
  gutter1 += "\u2502";
  let gutter2 = "";
  gutter2 += " ".repeat(3);
  gutter2 += " ".repeat((loc.line + " ").length);
  gutter2 += "\u2502";
  let emphasis = " ".repeat(loc.column) + green("~".repeat(loc.length) || "^");
  return `${bold(` > ${namespace}: ${red("error:")} ${text}`)}

 ${gutter1} ${code}
 ${gutter2} ${emphasis}
`;
}
function formatErrorAndMessages(error, messages) {
  const stack = error.stack.split("\n").map((line) => " " + line).join("\n");
  let str = "";
  for (const message of messages) {
    if (str !== "") {
      str += "\n";
    }
    str += formatImpl(message);
  }
  if (process.env["STACK_TRACE"] === "true") {
    str += "\n" + dim(stack) + "\n";
  }
  str += `
${messages.length} error${messages.length === 1 ? "" : "s"}`;
  return str;
}

// src/utils/parseV8Error.ts
var fsp = __toModule(require("fs/promises"));
async function parseV8Error(error) {
  let text = "Internal error";
  let location = null;
  try {
    text = (error && error.message || error) + "";
  } catch {
  }
  try {
    const stack = error.stack + "";
    const lines = stack.split("\n", 3);
    const at = "    at ";
    if (!lines[0].startsWith(at) && lines[1].startsWith(at)) {
      let line = lines[1].slice(at.length);
      while (true) {
        let match = /^\S+ \((.*)\)$/.exec(line);
        if (match) {
          line = match[1];
          continue;
        }
        match = /^eval at \S+ \((.*)\)(?:, \S+:\d+:\d+)?$/.exec(line);
        if (match) {
          line = match[1];
          continue;
        }
        match = /^(\S+):(\d+):(\d+)$/.exec(line);
        if (match) {
          const contents = await fsp.readFile(match[1], "utf8");
          const lineText = contents.split(/\r\n|\r|\n|\u2028|\u2029/)[+match[2] - 1] || "";
          location = {
            file: match[1],
            namespace: "file",
            line: +match[2],
            column: +match[3] - 1,
            length: 0,
            lineText
          };
        }
        break;
      }
    }
  } catch {
  }
  const message = {
    detail: void 0,
    location,
    notes: [],
    text
  };
  return message;
}

// src/esnode.ts
async function external() {
  let pkg;
  try {
    pkg = require(path2.resolve("package.json"));
  } catch {
    return [];
  }
  const deps = Object.keys(pkg.dependencies ?? {});
  const peerDeps = Object.keys(pkg.peerDependencies ?? {});
  const devDeps = Object.keys(pkg.devDependencies ?? {});
  return [...new Set([...deps, ...peerDeps, ...devDeps])];
}
async function cleanup(outfile) {
  try {
    fsp2.unlink(outfile);
    fsp2.unlink(outfile.replace(/\.js$/, ".js.map"));
  } catch {
  }
}
async function run(args) {
  const inputFile = path2.resolve(args[0]);
  const outfile = ".outfile.esbuild.js";
  const external_ = await external();
  try {
    await esbuild.build({
      banner: `require("source-map-support").install();
`,
      bundle: true,
      define: {
        __DEV__: JSON.stringify(process.env["NODE_ENV"] !== "production"),
        "process.env.NODE_ENV": JSON.stringify(process.env["NODE_ENV"] ?? "development")
      },
      entryPoints: [inputFile],
      external: external_,
      format: "cjs",
      loader: {
        [".js"]: "jsx"
      },
      outfile,
      platform: "node",
      sourcemap: true
    });
  } catch (error) {
    if (!("errors" in error) && !("warnings" in error))
      console.error(error);
    await cleanup(outfile);
    process.exit(1);
  }
  try {
    require(path2.resolve(outfile));
  } catch (error) {
    const message = await parseV8Error(error);
    console.error(formatErrorAndMessages(error, [message]));
    await cleanup(outfile);
    process.exit(1);
  }
  await cleanup(outfile);
}
function accent(str) {
  return str.replace(/('[^']+')/g, cyan("$1"));
}
function format(usage2) {
  const arr = usage2.split("\n");
  return arr.map((line) => " " + accent(line)).join("\n");
}
var usage = format(`
${bold("esnode [file]")}

	esnode runs a JavaScript or TypeScript file using the Node.js runtime. This is
	almost the same as 'node [file]' except that 'esnode [file]' is compatible with
	'.js', '.jsx', '.ts', and '.tsx' files. You may even interoperate JavaScript
	and TypeScript.

	Your entry point and its dependencies are transpiled on-the-fly by esbuild.
	esbuild is configured to not bundle 'package.json' dependencies at build-time;
	these dependencies use 'require' at runtime.

	Note that '.ts' and '.tsx' files are not type-checked. You may use VS Code or
	the TypeScript CLI 'tsc' for type-checking. To add the TypeScript CLI, use
	'npm i --save-dev typescript' or 'yarn add --dev typescript'.

${bold("Examples")}

	${cyan("%")} ./node_modules/.bin/esnode hello.ts
	${dim("Hello, esnode!")}

	${cyan("%")} alias esnode=./node_modules/.bin/esnode
	${cyan("%")} esnode hello.ts
	${dim("Hello, esnode!")}

${bold("Repositories")}

	esnode:  ${underline("https://github.com/zaydek/esnode")}
	esbuild: ${underline("https://github.com/evanw/esbuild")}
`);
async function main() {
  const args = [...process.argv.slice(2)];
  if (args.length === 0) {
    console.log(usage);
    return;
  }
  const cmd = args[0];
  if (cmd === "version" || cmd === "--version" || cmd === "-v") {
    console.log("TODO");
    return;
  } else if (cmd === "usage" || cmd === "help") {
    console.log(usage);
    return;
  }
  await run(args);
}
main();
