all:
	./node_modules/.bin/esbuild \
		src/esnode.ts \
			--bundle \
			--external:esbuild \
			--format=cjs \
			--outfile=bin/esnode.js \
			--platform=node
