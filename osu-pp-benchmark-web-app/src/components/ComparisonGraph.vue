<template>
  <!-- Render the Plotly container only if comparisonGraphData exists -->
  <div v-if="comparisonGraphData" ref="plotlyContainer" style="width: 70%; height: 700px;"></div>
  <div v-if="comparisonGraphData" style="width: 70%; display:flex; flex-direction: row; align-self: center; align-items: center; justify-content: space-around; margin-bottom: 60px;">
    <div v-if="graphData.ojsamaPP && graphData.addOjsamaPP" class="stat-ul">
      <h3>Statistics of oj-sama:</h3>
      <ul>
        <li>Mean Absolute Error: {{ ojsamaMAE.toFixed(2) }}</li>
        <li>Mean Squared Error: {{ ojsamaMSE.toFixed(2) }}</li>
        <li>Root Mean Squared Error: {{ ojsamaRMSE.toFixed(2) }}</li>
      </ul>
    </div>
    <div v-if="graphData.rosuPP && graphData.addRosuPP" class="stat-ul">
      <h3>Statistics of Rosu:</h3>
      <ul>
        <li>Mean Absolute Error: {{ rosuMAE.toFixed(2) }}</li>
        <li>Mean Squared Error: {{ rosuMSE.toFixed(2) }}</li>
        <li>Root Mean Squared Error: {{ rosuRMSE.toFixed(2) }}</li>
      </ul>
    </div>
    <div v-if="graphData.otpcPP && graphData.addOtpcPP" class="stat-ul">
      <h3>Statistics of OTPC:</h3>
      <ul>
        <li>Mean Absolute Error: {{ otpcMAE.toFixed(2) }}</li>
        <li>Mean Squared Error: {{ otpcMSE.toFixed(2) }}</li>
        <li>Root Mean Squared Error: {{ otpcRMSE.toFixed(2) }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import Plotly from 'plotly.js-dist'

// Define props
const props = defineProps({
comparisonGraphData: {
  type: Object,
  required: true,
},
title: {
  type: String,
  default: 'Graph',
},
})

// Create a computed property for the graph data
const graphData = computed(() => ({
playIndex: props.comparisonGraphData.playIndex || [],
ojsamaPP: props.comparisonGraphData.ojsamaPP || [],
rosuPP: props.comparisonGraphData.rosuPP || [],
otpcPP: props.comparisonGraphData.otpcPP || [],
actualPP: props.comparisonGraphData.actualPP || [],
pp_min: props.comparisonGraphData.pp_min || 0,
pp_cap: props.comparisonGraphData.pp_cap || 100,
addOjsamaPP: props.comparisonGraphData.addOjsamaPP || false,
addRosuPP: props.comparisonGraphData.addRosuPP || false,
addOtpcPP: props.comparisonGraphData.addOtpcPP || false,
addActualPP: props.comparisonGraphData.addActualPP || false,
}))

// Ref for the Plotly container
const plotlyContainer = ref(null)
const ojsamaMAE = ref(0)
const rosuMAE = ref(0)
const otpcMAE = ref(0)
const ojsamaMSE = ref(0)
const rosuMSE = ref(0)
const otpcMSE = ref(0)
const ojsamaRMSE = ref(0)
const rosuRMSE = ref(0)
const otpcRMSE = ref(0)

function renderGraph() {
if (!plotlyContainer.value) {
  console.log('Plotly container is null or undefined.')
  return
}

const {
  playIndex,
  ojsamaPP,
  rosuPP,
  otpcPP,
  actualPP,
  pp_min,
  pp_cap,
  addOjsamaPP,
  addRosuPP,
  addOtpcPP,
  addActualPP,
} = graphData.value

// Calculate the MAE, MSE and RMSE of each model compared to the actual PP
if (ojsamaPP && actualPP && addOjsamaPP) {
  ojsamaMAE.value = ojsamaPP.reduce((acc, val, i) => acc + Math.abs(val - actualPP[i]), 0) / ojsamaPP.length
  ojsamaMSE.value = ojsamaPP.reduce((acc, val, i) => acc + Math.pow(val - actualPP[i], 2), 0) / ojsamaPP.length
  ojsamaRMSE.value = Math.sqrt(ojsamaMSE.value)
}

if (rosuPP && actualPP && addRosuPP) {
  rosuMAE.value = rosuPP.reduce((acc, val, i) => acc + Math.abs(val - actualPP[i]), 0) / rosuPP.length
  rosuMSE.value = rosuPP.reduce((acc, val, i) => acc + Math.pow(val - actualPP[i], 2), 0) / rosuPP.length
  rosuRMSE.value = Math.sqrt(rosuMSE.value)
}

if (otpcPP && actualPP && addOtpcPP) {
  otpcMAE.value = otpcPP.reduce((acc, val, i) => acc + Math.abs(val - actualPP[i]), 0) / otpcPP.length
  otpcMSE.value = otpcPP.reduce((acc, val, i) => acc + Math.pow(val - actualPP[i], 2), 0) / otpcPP.length
  otpcRMSE.value = Math.sqrt(otpcMSE.value)
}

const plotData = []

if (addOjsamaPP && ojsamaPP) {
  plotData.push({
    x: playIndex,
    y: ojsamaPP,
    mode: 'lines+markers',
    name: 'Ojsama PP',
    line: { color: 'blue' },
  })
}

if (addRosuPP && rosuPP) {
  plotData.push({
    x: playIndex,
    y: rosuPP,
    mode: 'lines+markers',
    name: 'Rosu PP',
    line: { color: 'red' },
  })
}

if (addOtpcPP && otpcPP) {
  plotData.push({
    x: playIndex,
    y: otpcPP,
    mode: 'lines+markers',
    name: 'OTPC PP',
    line: { color: 'purple' },
  })
}

if (addActualPP && actualPP) {
  plotData.push({
    x: playIndex,
    y: actualPP,
    mode: 'lines+markers',
    name: 'Actual PP',
    line: { width: 4, color: 'limegreen' },
    marker: { size: 8, color: 'limegreen' },
  })
}

const layout = {
  title: props.title,
  xaxis: { title: 'Play Rank' },
  yaxis: {
    title: 'Performance Points (PP)',
    range: [pp_min, pp_cap],
  },
  autosize: true,
  hovermode: 'x unified',
  showlegend: true,
}

Plotly.newPlot(plotlyContainer.value, plotData, layout)
}

// Watch for `comparisonGraphData` changes and re-render the graph
watch(
() => props.comparisonGraphData,
(newData) => {
  if (newData) {
    renderGraph()
  }
},
{ immediate: true }
)

// Ensure the container exists before rendering the graph
onMounted(() => {
if (props.comparisonGraphData) {
  renderGraph()
}
})
</script>