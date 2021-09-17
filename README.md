# esnode

esnode is the answer to the question: How do I run JSX or TypeScript on the server without build-steps?

esnode builds on [esbuild](https://github.com/evanw/esbuild) and
[source-map-support](https://github.com/evanw/node-source-map-support) (thanks [@evanw](https://github.com/evanw)!) to
enable transpilation on-the-fly for `.js`, `.jsx`, `.ts`, and `.tsx` files.

Note that esnode does not type-check at build-time. If this is important to you, you may want to use
[ts-node](https://github.com/TypeStrong/ts-node) or [Deno](https://github.com/denoland/deno). Note that
[Deno](https://github.com/denoland/deno) is not largely compatible with the existing Node.js ecosystem. Therefore if
type-checking at build-time and interoperability with Node.js is important to you, you may want to use
[ts-node](https://github.com/TypeStrong/ts-node) or defer to VS Code and or `tsc` for type-checking.

## Installation

To install esnode, simply install `@zaydek/esnode` and run `./node_modules/.bin/esnode`.

**NPM**

```sh
npm i --save-dev @zaydek/esnode
./node_modules/.bin/esnode [file]
```

**Yarn**

```sh
yarn add --dev @zaydek/esnode
./node_modules/.bin/esnode [file]
```

Finally, create and run a JSX or TypeScript file:

```ts
// hello.ts
function hello(who?: string): string {
	return `Hello, ${who ?? "world"}!`
}

console.log(hello())
```

```sh
% ./node_modules/.bin/esnode hello.ts
Hello, world!
```

For convenience, you may want to alias esnode as `alias esnode=./node_modules/.bin/esnode`. To alias esnode globally,
add `alias esnode=./node_modules/.bin/esnode` to your `~/.bash_profile`.

## CLI

```sh

 esnode [file]

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

 Examples

   % ./node_modules/.bin/esnode hello.ts
   Hello, world!

   % alias esnode=./node_modules/.bin/esnode
   % esnode hello.ts
   Hello, world!

   % STACK_TRACE=true esnode hello.ts
   Hello, world!

 Repositories

   esnode:  https://github.com/zaydek/esnode
   esbuild: https://github.com/evanw/esbuild

```

## License

Licensed as MIT open source.
