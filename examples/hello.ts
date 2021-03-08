function hello(who?: string): string {
	return `Hello, ${who ?? "world"}!`
}

console.log(hello("esnode"))
