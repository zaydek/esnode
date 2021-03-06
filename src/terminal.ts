// BuilderFunction describes the builder pattern where a function or a method
// (recursively) can be called.
//
// For example:
//
// - function(...)
// - function.method(...)
// - function.method.method(...)
//
export interface Builder {
	(...args: unknown[]): string
	normal: Builder
	bold: Builder
	dim: Builder
	underline: Builder
	black: Builder
	red: Builder
	green: Builder
	yellow: Builder
	blue: Builder
	magenta: Builder
	cyan: Builder
	white: Builder
	bgBlack: Builder
	bgRed: Builder
	bgGreen: Builder
	bgYellow: Builder
	bgBlue: Builder
	bgMagenta: Builder
	bgCyan: Builder
	bgWhite: Builder
}

const opts = [
	{ name: "normal", code: "\x1b[0m" },
	{ name: "bold", code: "\x1b[1m" },
	{ name: "dim", code: "\x1b[2m" },
	{ name: "underline", code: "\x1b[4m" },
	{ name: "black", code: "\x1b[30m" },
	{ name: "red", code: "\x1b[31m" },
	{ name: "green", code: "\x1b[32m" },
	{ name: "yellow", code: "\x1b[33m" },
	{ name: "blue", code: "\x1b[34m" },
	{ name: "magenta", code: "\x1b[35m" },
	{ name: "cyan", code: "\x1b[36m" },
	{ name: "white", code: "\x1b[37m" },
	{ name: "bgBlack", code: "\x1b[40m" },
	{ name: "bgRed", code: "\x1b[41m" },
	{ name: "bgGreen", code: "\x1b[42m" },
	{ name: "bgYellow", code: "\x1b[43m" },
	{ name: "bgBlue", code: "\x1b[44m" },
	{ name: "bgMagenta", code: "\x1b[45m" },
	{ name: "bgCyan", code: "\x1b[46m" },
	{ name: "bgWhite", code: "\x1b[47m" },
]

function build(...codes: string[]): Builder {
	// Create a format function
	function format(...args: unknown[]): string {
		const str = codes.join("")
		return str + args.join(" ").replaceAll("\x1b[0m", "\x1b[0m" + str) + "\x1b[0m"
	}

	// Define "name" as a property of "format"
	for (const { name, code } of opts) {
		Object.defineProperty(format, name, {
			enumerable: true,
			get() {
				return build(...new Set([...codes, code]))
			},
		})
	}
	return format as Builder
}

export const noop = (...args: unknown[]): string => args.join(" ")
export const normal = build("\x1b[0m")
export const bold = build("\x1b[1m")
export const dim = build("\x1b[2m")
export const underline = build("\x1b[4m")
export const black = build("\x1b[30m")
export const red = build("\x1b[31m")
export const green = build("\x1b[32m")
export const yellow = build("\x1b[33m")
export const blue = build("\x1b[34m")
export const magenta = build("\x1b[35m")
export const cyan = build("\x1b[36m")
export const white = build("\x1b[37m")
export const bgBlack = build("\x1b[40m")
export const bgRed = build("\x1b[41m")
export const bgGreen = build("\x1b[42m")
export const bgYellow = build("\x1b[43m")
export const bgBlue = build("\x1b[44m")
export const bgMagenta = build("\x1b[45m")
export const bgCyan = build("\x1b[46m")
export const bgWhite = build("\x1b[47m")
