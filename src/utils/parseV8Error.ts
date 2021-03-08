import * as esbuild from "esbuild"
import * as fs from "fs"

// This implementation is heavily based on @evanw’s extractErrorMessageV8 and
// parseStackLinesV8 implementations in esbuild.
//
// https://github.com/evanw/esbuild
// https://github.com/evanw/esbuild/blob/master/lib/common.ts

export async function parseV8Error(error: any): Promise<esbuild.Message> {
	let text = "Internal error"
	let location: esbuild.Location | null = null

	try {
		text = ((error && error.message) || error) + ""
	} catch {}

	// Optionally attempt to extract the file from the stack trace, works in V8/node
	try {
		const stack = error.stack + ""
		const lines = stack.split("\n", 3)
		const at = "    at "

		// Check to see if this looks like a V8 stack trace
		if (!lines[0]!.startsWith(at) && lines[1]!.startsWith(at)) {
			let line = lines[1]!.slice(at.length)
			while (true) {
				// Unwrap a function name
				let match = /^\S+ \((.*)\)$/.exec(line)
				if (match) {
					line = match[1]!
					continue
				}

				// Unwrap an eval wrapper
				match = /^eval at \S+ \((.*)\)(?:, \S+:\d+:\d+)?$/.exec(line)
				if (match) {
					line = match[1]!
					continue
				}

				// Match on the file location
				match = /^(\S+):(\d+):(\d+)$/.exec(line)
				if (match) {
					const contents = await fs.promises.readFile(match[1]!, "utf8")
					const lineText = contents.split(/\r\n|\r|\n|\u2028|\u2029/)[+match[2]! - 1] || ""
					location = {
						file: match[1]!,
						namespace: "file",
						line: +match[2]!,
						column: +match[3]! - 1,
						length: 0,
						lineText: lineText,
					}
				}
				break
			}
		}
	} catch {}

	const message: esbuild.Message = {
		detail: undefined, // Must be defined
		location,
		notes: [], // Must be defined
		text,
	}
	return message
}
