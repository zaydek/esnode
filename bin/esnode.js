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

// src/terminal.ts
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
  function format(...args) {
    const str = codes.join("");
    return str + args.join(" ").replaceAll("[0m", "[0m" + str) + "[0m";
  }
  for (const {name, code} of opts) {
    Object.defineProperty(format, name, {
      enumerable: true,
      get() {
        return build(...new Set([...codes, code]));
      }
    });
  }
  return format;
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

// src/utils.ts
var path = __toModule(require("path"));
function formatMessage(message) {
  const loc = message.location;
  let file = "";
  file += path.relative(process.cwd(), loc.file) + ":";
  file += loc.line + ":";
  file += loc.column + 1;
  const text = message.text;
  if (text.endsWith("is not defined"))
    loc.length = text.slice(0, -" is not defined".length).length;
  let code = "";
  code += loc.lineText.slice(0, loc.column);
  code += green(loc.lineText.slice(loc.column, loc.column + loc.length));
  code += loc.lineText.slice(loc.column + loc.length);
  let gap1 = "";
  gap1 += " ".repeat(3);
  gap1 += loc.line + " ";
  gap1 += "\u2502";
  let gap2 = "";
  gap2 += " ".repeat(3);
  gap2 += " ".repeat((loc.line + " ").length);
  gap2 += "\u2502";
  return bold(` > ${file}: ${red("error:")} ${text}`) + `
 ${gap1} ${code}
 ${gap2} ${" ".repeat(loc.column)}${loc.length === 0 ? green("^") : green("~".repeat(loc.length))}
`;
}
function formatMessages(messages) {
  let str = "";
  str += messages.map((message) => formatMessage(message));
  str += "\n";
  str += `${messages.length} error${messages.length === 1 ? "" : "s"}`;
  return str;
}

// src/parseV8ErrorStackTrace.ts
var fsp = __toModule(require("fs/promises"));
async function parseV8ErrorStackTrace(error) {
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
async function getDependencyKeys() {
  const resolvedPath = path2.resolve("package.json");
  try {
    await fsp2.stat(resolvedPath);
  } catch (error) {
    return [];
  }
  let pkg;
  try {
    pkg = require(resolvedPath);
  } catch {
  }
  const dependencies = Object.keys(pkg.dependencies ?? {});
  const peerDependencies = Object.keys(pkg.peerDependencies ?? {});
  const devDependencies = Object.keys(pkg.devDependencies ?? {});
  return [...new Set([dependencies, peerDependencies, devDependencies].flat())];
}
async function runCommand(...args) {
  const inputFile = path2.resolve(args[0]);
  const outfile = path2.join("__cache__", path2.basename(inputFile.slice(0, -path2.extname(inputFile).length) + ".js"));
  const external = await getDependencyKeys();
  try {
    await esbuild.build({
      banner: `// https://github.com/evanw/node-source-map-support
require("source-map-support").install();
`,
      bundle: true,
      define: {
        __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development")
      },
      entryPoints: [inputFile],
      external,
      format: "cjs",
      loader: {[".js"]: "jsx"},
      outfile,
      platform: "node",
      sourcemap: true
    });
  } catch (_) {
    process.exit(1);
  }
  try {
    process.argv = [process.argv[0], ...args];
    require(path2.resolve(outfile));
  } catch (v8Error) {
    const message = await parseV8ErrorStackTrace(v8Error);
    console.log(formatMessages([message]));
    process.exit(1);
  }
}
function getCLIArguments() {
  const args = [...process.argv];
  if (process.argv0 === "node")
    args.shift();
  args.shift();
  return args;
}
var usage = `
  ${bold("Usage:")}

    run <entry point>

      JavaScript     -> .js
      JavaScript XML -> .js or .jsx
      TypeScript     -> .ts
      TypeScript XML -> .tsx

  ${bold("Repository:")}

    ${bold.cyan("https://github.com/zaydek/esnode")}
`;
async function entry() {
  const args = getCLIArguments();
  if (args.length < 2) {
    console.log(usage);
    process.exit();
  }
  const cmd = args[0];
  if (cmd === "version" || cmd === "--version" || cmd === "-v") {
    console.log("TODO");
  } else if (cmd === "run") {
    await runCommand(...args.slice(1));
  } else {
    console.error(`Unsupported command ${JSON.stringify(cmd)}`);
  }
}
entry();
