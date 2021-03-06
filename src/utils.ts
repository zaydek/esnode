import * as esbuild from "esbuild"
import * as path from "path"
import * as terminal from "./terminal"

export function formatMessage(message: esbuild.Message): string {
	const loc = message.location!

	let file = ""
	file += path.relative(process.cwd(), loc.file) + ":"
	file += loc.line + ":"
	file += loc.column + 1 // One-based

	const text = message.text

	if (text.endsWith("is not defined")) loc.length = text.slice(0, -" is not defined".length).length

	let code = ""
	code += loc.lineText.slice(0, loc.column)
	code += terminal.green(loc.lineText.slice(loc.column, loc.column + loc.length))
	code += loc.lineText.slice(loc.column + loc.length)

	let gap1 = ""
	gap1 += " ".repeat(3)
	gap1 += loc.line + " "
	gap1 += "│"

	let gap2 = ""
	gap2 += " ".repeat(3)
	gap2 += " ".repeat((loc.line + " ").length)
	gap2 += "│"

	return (
		terminal.bold(` > ${file}: ${terminal.red("error:")} ${text}`) +
		`
 ${gap1} ${code}
 ${gap2} ${" ".repeat(loc.column)}${loc.length === 0 ? terminal.green("^") : terminal.green("~".repeat(loc.length))}
`
	)
}

export function formatMessages(messages: esbuild.Message[]): string {
	let str = ""
	str += messages.map(message => formatMessage(message))
	str += "\n"
	str += `${messages.length} error${messages.length === 1 ? "" : "s"}`
	return str
}
