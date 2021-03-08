#!/usr/bin/env node

import * as esbuild from "esbuild"
import * as fsp from "fs/promises"
import * as path from "path"
import * as terminal from "./terminal"
import * as utils from "./utils"

// Dependencies describes dependencies abstractly.
type Dependencies = { [key: string]: string }

// Package describes package.json (only dependencies).
interface Package {
	dependencies: Dependencies
	peerDependencies: Dependencies
	devDependencies: Dependencies
}

async function external(): Promise<string[]> {
	// NOTE: Use try-catch to suppress esbuild dynamic require warning.
	let pkg: Package
	try {
		pkg = require(path.resolve("package.json"))
	} catch {
		return []
	}

	const deps = Object.keys(pkg!.dependencies ?? {})
	const peerDeps = Object.keys(pkg!.peerDependencies ?? {})
	const devDeps = Object.keys(pkg!.devDependencies ?? {})

	// Return distinct dependencies:
	return [...new Set([...deps, ...peerDeps, ...devDeps])]
}

// cleanup cleans emitted hidden files. source-map-support does not appear to
// support 'new Function(code)', therefore '.outfile.esbuild.js' and
// '.outfile.esbuild.map.js' are written to disk where source-map-support
// depends on '.outfile.esbuild.map.js'.
async function cleanup(outfile: string): Promise<void> {
	try {
		fsp.unlink(outfile)
		fsp.unlink(outfile.replace(/\.js$/, ".js.map"))
	} catch {}
}

// TODO: Add support for stdin? See https://esbuild.github.io/api/#stdin.
async function run(args: string[]): Promise<void> {
	const inputFile = path.resolve(args[0]!)
	const outfile = ".outfile.esbuild.js"

	const external_ = await external()

	try {
		await esbuild.build({
			banner: `require("source-map-support").install();\n`,
			bundle: true,
			define: {
				__DEV__: JSON.stringify(process.env["NODE_ENV"] !== "production"),
				"process.env.NODE_ENV": JSON.stringify(process.env["NODE_ENV"] ?? "development"),
			},
			entryPoints: [inputFile],
			external: external_,
			format: "cjs",
			loader: {
				[".js"]: "jsx",
			},
			outfile,
			platform: "node",
			sourcemap: true,
		})
	} catch (error) {
		// Write non-esbuild errors to stderr:
		if (!("errors" in error) && !("warnings" in error)) console.error(error)

		// Fatally exit (status code 1):
		await cleanup(outfile)
		process.exit(1)
	}

	// NOTE: Use try-catch to suppress esbuild dynamic require warning.
	try {
		// // FIXME: Updating process.argv appears to break parseV8Error;
		// // 'namespace += path.relative(process.cwd(), loc.file) + ":";'.
		// const entry = path.join(process.cwd(), args[0]!)
		// process.argv = [process.argv[0]!, entry, ...args.slice(1)]
		require(path.resolve(outfile))
	} catch (error) {
		const message = await utils.parseV8Error(error)
		console.error(utils.formatErrorAndMessages(error, [message]))

		// Fatally exit (status code 1):
		await cleanup(outfile)
		process.exit(1)
	}

	await cleanup(outfile)
}

function accent(str: string): string {
	return str.replace(/('[^']+')/g, terminal.cyan("$1"))
}

function format(usage: string): string {
	const arr = usage.split("\n")
	return arr
		.map(line => {
			if (line === "") return ""
			return "\x20" + accent(line.replace(/\t/g, "  ")) // Tabs -> spaces
		})
		.join("\n")
}

// TODO: Add watch mode support.
const usage = format(`
${terminal.bold("esnode [file]")}

	esnode runs a JavaScript or TypeScript file using the Node.js runtime. This is
	almost the same as 'node [file]' except that 'esnode [file]' is compatible with
	'.js', '.jsx', '.ts', and '.tsx' files. You may even interoperate JavaScript and
	TypeScript.

	Your entry point and its dependencies are transpiled on-the-fly by esbuild.
	esbuild is configured to not bundle 'package.json' dependencies at build-time;
	these dependencies use 'require' at runtime.

	Note that '.ts' and '.tsx' files are not type-checked. You may use VS Code or the
	TypeScript CLI 'tsc' for type-checking. To add the TypeScript CLI, use
	'npm i --save-dev typescript' or 'yarn add --dev typescript'.

${terminal.bold("Examples")}

	${terminal.cyan("%")} ./node_modules/.bin/esnode hello.ts
	${terminal.dim("Hello, world!")}

	${terminal.cyan("%")} alias esnode=./node_modules/.bin/esnode
	${terminal.cyan("%")} esnode hello.ts
	${terminal.dim("Hello, world!")}

${terminal.bold("Repositories")}

	esnode:  ${terminal.underline("https://github.com/zaydek/esnode")}
	esbuild: ${terminal.underline("https://github.com/evanw/esbuild")}
`)

async function main(): Promise<void> {
	// Remove node and esnode arguments:
	const args = [...process.argv.slice(2)]
	if (args.length === 0) {
		console.log(usage)
		return
	}
	const cmd = args[0]
	if (cmd === "version" || cmd === "--version" || cmd === "-v") {
		console.log("TODO")
		return
	} else if (cmd === "usage" || cmd === "help") {
		console.log(usage)
		return
	}
	await run(args)
}

main()
