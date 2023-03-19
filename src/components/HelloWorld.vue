<script setup>
import { parse } from "acorn"

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

const code = JSON.stringify(parse("1 + 1", { ecmaVersion: 2020 }), null, 2)

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
