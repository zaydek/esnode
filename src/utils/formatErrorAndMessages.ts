import * as esbuild from "esbuild"
import * as path from "path"
import * as terminal from "../terminal/terminal"

// https://github.com/evanw/esbuild/issues/920
function formatImpl(message: esbuild.Message): string {
	const loc = message.location!

	let namespace = ""
	namespace += path.relative(process.cwd(), loc.file) + ":"
	namespace += loc.line + ":"
	namespace += loc.column + 1 // One-based

	let text = message.text
	if (text.endsWith("is not defined")) {
		loc.length = text.slice(0, -" is not defined".length).length
	}

	let code = ""
	code += loc.lineText.slice(0, loc.column)
	code += terminal.green(loc.lineText.slice(loc.column, loc.column + loc.length))
	code += loc.lineText.slice(loc.column + loc.length)

	let gutter1 = ""
	gutter1 += " ".repeat(3)
	gutter1 += loc.line + " "
	gutter1 += "│"

	let gutter2 = ""
	gutter2 += " ".repeat(3)
	gutter2 += " ".repeat((loc.line + " ").length)
	gutter2 += "│"

	// prettier-ignore
	let emphasis = " ".repeat(loc.column) +
		terminal.green("~".repeat(loc.length) || "^")

	return `${terminal.bold(` > ${namespace}: ${terminal.red("error:")} ${text}`)}

 ${gutter1} ${code}
 ${gutter2} ${emphasis}
`
}

export function formatErrorAndMessages(error: any, messages: esbuild.Message[]): string {
	// prettier-ignore
	const stack = (error.stack as string).split("\n").map(line => "\x20" + line).join("\n")

	let str = ""
	for (const message of messages) {
		if (str !== "") {
			str += "\n"
		}
		str += formatImpl(message)
	}
	if (process.env["STACK_TRACE"] === "true") {
		str += "\n" + terminal.dim(stack) + "\n"
	}
	str += "\n" + `${messages.length} error${messages.length === 1 ? "" : "s"}`
	return str
}
