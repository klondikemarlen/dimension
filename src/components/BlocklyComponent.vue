<script setup>
import Blockly from "blockly"

import { onMounted } from "vue"

// const props = defineProps({
// 	toolbox: Object,
// })

onMounted(() => {
	const toolbox = {
		kind: "flyoutToolbox",
		contents: [
			{
				kind: "block",
				type: "controls_if",
			},
			{
				kind: "block",
				type: "controls_repeat_ext",
			},
			{
				kind: "block",
				type: "logic_compare",
			},
			{
				kind: "block",
				type: "math_number",
			},
			{
				kind: "block",
				type: "math_arithmetic",
			},
			{
				kind: "block",
				type: "text",
			},
			{
				kind: "block",
				type: "text_print",
			},
		],
	}

	const blocklyArea = document.getElementById("blockly-area")
	const blocklyDiv = document.getElementById("blockly-container")
	const demoWorkspace = Blockly.inject(blocklyDiv, { toolbox })

	const onresize = function (e) {
		// Compute the absolute coordinates and dimensions of blocklyArea.
		let element = blocklyArea
		let x = 0
		let y = 0
		do {
			x += element.offsetLeft
			y += element.offsetTop
			element = element.offsetParent
		} while (element)
		// Position blocklyDiv over blocklyArea.
		blocklyDiv.style.left = x + "px"
		blocklyDiv.style.top = y + "px"
		blocklyDiv.style.width = blocklyArea.offsetWidth + "px"
		blocklyDiv.style.height = blocklyArea.offsetHeight + "px"
		Blockly.svgResize(demoWorkspace)

		console.log("resize")
	}
	window.addEventListener("resize", onresize, false)
	onresize()
})
</script>

<template>
	<div>
		<div id="blockly-area"></div>
		<div
			id="blockly-container"
			style="position: absolute"
		></div>
	</div>
</template>

<style scoped>
#blockly-area {
	min-height: 480px;
}
</style>
