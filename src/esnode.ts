#!/usr/bin/env node
import * as esbuild from "esbuild"
import * as fsp from "fs/promises"
import * as path from "path"
import * as terminal from "./terminal"
import * as utils from "./utils"

import parseV8ErrorStackTrace from "./parseV8ErrorStackTrace"

interface Package {
	dependencies: { [key: string]: string }
	peerDependencies: { [key: string]: string }
	devDependencies: { [key: string]: string }
}

// getDependencyKeys gets dependency keys from package.json.
async function getDependencyKeys(): Promise<string[]> {
	const resolvedPath = path.resolve("package.json")
	try {
		await fsp.stat(resolvedPath)
	} catch (error) {
		return []
	}
	let pkg: Package
	try {
		pkg = require(resolvedPath)
	} catch {}
	const dependencies = Object.keys(pkg!.dependencies ?? {})
	const peerDependencies = Object.keys(pkg!.peerDependencies ?? {})
	const devDependencies = Object.keys(pkg!.devDependencies ?? {})
	return [...new Set([dependencies, peerDependencies, devDependencies].flat())]
}

// TODO: Add support for stdin?
// https://esbuild.github.io/api/#stdin
async function runCommand(...args: string[]): Promise<void> {
	// Generate inputFile and outfile
	const inputFile = path.resolve(args[0]!)
	const outfile = path.join("__cache__", path.basename(inputFile.slice(0, -path.extname(inputFile).length) + ".js"))

	// Generate external (dependency keys)
	const external = await getDependencyKeys()

	// Run esbuild
	try {
		await esbuild.build({
			banner: `// https://github.com/evanw/node-source-map-support\nrequire("source-map-support").install();\n`,
			bundle: true,
			define: {
				__DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
				"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
			},
			entryPoints: [inputFile],
			external,
			format: "cjs",
			loader: { [".js"]: "jsx" },
			outfile,
			platform: "node",
			sourcemap: true,
		})
		// Defer to esbuild logging; logLevel is enabled by default
	} catch (_) {
		// Defer to esbuild logging; logLevel is enabled by default
		process.exit(1)
	}

	// TODO: Update process.argv

	// Use try-catch to suppress an esbuild warning
	//
	// > warning: Indirect calls to "require" will not be bundled (surround with a
	// try/catch to silence this warning)
	//
	try {
		// Reset process.argv; forward args
		process.argv = [process.argv[0]!, ...args]
		require(path.resolve(outfile))
	} catch (v8Error) {
		const message = await parseV8ErrorStackTrace(v8Error)
		console.log(utils.formatMessages([message]))
		process.exit(1)
	}
}

function getCLIArguments(): string[] {
	const args = [...process.argv]
	if (process.argv0 === "node") args.shift()
	args.shift()
	return args
}

const usage = `
  ${terminal.bold("Usage:")}

    run <entry point>

      JavaScript     -> .js
      JavaScript XML -> .js or .jsx
      TypeScript     -> .ts
      TypeScript XML -> .tsx

  ${terminal.bold("Repository:")}

    ${terminal.bold.cyan("https://github.com/zaydek/esnode")}
`

async function entry(): Promise<void> {
	const args = getCLIArguments()
	if (args.length < 2) {
		console.log(usage)
		process.exit()
	}

	const cmd = args[0]
	if (cmd === "version" || cmd === "--version" || cmd === "-v") {
		console.log("TODO")
	} else if (cmd === "run") {
		await runCommand(...args.slice(1))
	} else {
		console.error(`Unsupported command ${JSON.stringify(cmd)}`)
	}
}

entry()
