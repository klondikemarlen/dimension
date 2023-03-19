<script setup>
import { parse } from "acorn"
import { full } from "acorn-walk"

// Acorn exports
// export {
//  Node,
//  Parser,
//  Position,
//  SourceLocation,
//  TokContext,
//  Token,
//  TokenType,
//  defaultOptions,
//  getLineInfo,
//  isIdentifierChar,
//  isIdentifierStart,
//  isNewLine,
//  keywords as keywordTypes,
//  lineBreak,
//  lineBreakG,
//  nonASCIIwhitespace,
//  parse,
//  parseExpressionAt,
//  types as tokContexts,
//  types$1 as tokTypes,
//  tokenizer,
//  version,
// }

// const modules = import.meta.glob("@/*.js", { as: "raw" })
// console.log(Object.keys(modules))

import rawCode from "./../main.js?raw"
const parsedCode = parse(rawCode, { ecmaVersion: 2020, sourceType: "module" })
full(parsedCode, (node) => {
	console.log(`There's a ${node.type} node at ${node.start}`)
})

const code = JSON.stringify(parsedCode, null, 2)

defineProps({
	msg: {
		type: String,
		required: true,
	},
})
</script>

<template>
	<div class="greetings">
		<h1 class="green">{{ msg }}</h1>
		<h3>
			You’ve successfully created a project with
			<a
				href="https://vitejs.dev/"
				target="_blank"
				rel="noopener"
				>Vite</a
			>
			+
			<a
				href="https://vuejs.org/"
				target="_blank"
				rel="noopener"
				>Vue 3</a
			>.
		</h3>
		<pre>
      {{ code }}
    </pre>
	</div>
</template>

<style scoped>
h1 {
	font-weight: 500;
	font-size: 2.6rem;
	top: -10px;
}

h3 {
	font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
	text-align: center;
}

@media (min-width: 1024px) {
	.greetings h1,
	.greetings h3 {
		text-align: left;
	}
}
</style>
