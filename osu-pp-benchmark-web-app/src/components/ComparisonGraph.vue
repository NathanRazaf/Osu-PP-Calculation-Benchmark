<template>
  <!-- Render the Plotly container only if comparisonGraphData exists -->
  <div v-if="comparisonGraphData" ref="plotlyContainer" style="width: 70%; height: 700px;"></div>
  <div v-if="comparisonGraphData" style="width: 70%; display:flex; flex-direction: row; align-self: center; align-items: center; justify-content: space-around; margin-bottom: 60px;">
    <div v-if="graphData.ojsamaPP && graphData.addOjsamaPP" class="stat-ul">
      <h3>Statistics of oj-sama:</h3>
      <ul>
        <li>Mean Absolute Error: {{ ojsamaMAE.toFixed(2) }}</li>
        <li>Mean Bias Error: {{ ojsamaMBE.toFixed(2) }}</li>
        <li>Root Mean Squared Error: {{ ojsamaRMSE.toFixed(2) }}</li>
      </ul>
    </div>
    <div v-if="graphData.rosuPP && graphData.addRosuPP" class="stat-ul">
      <h3>Statistics of Rosu:</h3>
      <ul>
        <li>Mean Absolute Error: {{ rosuMAE.toFixed(2) }}</li>
        <li>Mean Bias Error: {{ rosuMBE.toFixed(2) }}</li>
        <li>Root Mean Squared Error: {{ rosuRMSE.toFixed(2) }}</li>
      </ul>
    </div>
    <div v-if="graphData.otpcPP && graphData.addOtpcPP" class="stat-ul">
      <h3>Statistics of OTPC:</h3>
      <ul>
        <li>Mean Absolute Error: {{ otpcMAE.toFixed(2) }}</li>
        <li>Mean Bias Error: {{ otpcMBE.toFixed(2) }}</li>
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
addOjsamaPP: {
  type: Boolean,
  required: true
},
addRosuPP: {
  type: Boolean,
  required: true
},
addOtpcPP: {
  type: Boolean,
  required: true
},
addActualPP: {
  type: Boolean,
  required: true
}
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
addOjsamaPP: props.addOjsamaPP || false,
addRosuPP: props.addRosuPP || false,
addOtpcPP: props.addOtpcPP || false,
addActualPP: props.addActualPP || false,
}))

// Ref for the Plotly container
const plotlyContainer = ref(null)
const ojsamaMAE = ref(0)
const rosuMAE = ref(0)
const otpcMAE = ref(0)
const ojsamaMBE = ref(0)
const rosuMBE = ref(0)
const otpcMBE = ref(0)
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

// Calculate the MAE, MBE and RMSE of each model compared to the actual PP
if (addOjsamaPP && ojsamaPP && actualPP) {
  const ojsamaErrors = actualPP.map((actual, index) => Math.abs(actual - ojsamaPP[index]))
  const ojsamaBiasErrors = actualPP.map((actual, index) => actual - ojsamaPP[index])
  
  ojsamaMAE.value = ojsamaErrors.reduce((acc, val) => acc + val, 0) / ojsamaErrors.length
  ojsamaMBE.value = ojsamaBiasErrors.reduce((acc, val) => acc + val, 0) / ojsamaErrors.length
  ojsamaRMSE.value = Math.sqrt(ojsamaErrors.map((val) => val ** 2).reduce((acc, val) => acc + val, 0) / ojsamaErrors.length)
}

if (addRosuPP && rosuPP && actualPP) {
  const rosuErrors = actualPP.map((actual, index) => Math.abs(actual - rosuPP[index]))
  const rosuBiasErrors = actualPP.map((actual, index) => actual - rosuPP[index])

  rosuMAE.value = rosuErrors.reduce((acc, val) => acc + val, 0) / rosuErrors.length
  rosuMBE.value = rosuBiasErrors.reduce((acc, val) => acc + val, 0) / rosuErrors.length
  rosuRMSE.value = Math.sqrt(rosuErrors.map((val) => val ** 2).reduce((acc, val) => acc + val, 0) / rosuErrors.length)
}

if (addOtpcPP && otpcPP && actualPP) {
  const otpcErrors = actualPP.map((actual, index) => Math.abs(actual - otpcPP[index]))
  const otpcBiasErrors = actualPP.map((actual, index) => actual - otpcPP[index])

  otpcMAE.value = otpcErrors.reduce((acc, val) => acc + val, 0) / otpcErrors.length
  otpcMBE.value = otpcBiasErrors.reduce((acc, val) => acc + val, 0) / otpcErrors.length
  otpcRMSE.value = Math.sqrt(otpcErrors.map((val) => val ** 2).reduce((acc, val) => acc + val, 0) / otpcErrors.length)
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
  legend: {
        orientation: 'h', // horizontal 
        yanchor: 'bottom',
        y: -0.3, // position below the chart
        xanchor: 'center',
        x: 0.5,
      },
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

watch(
  [
    () => props.addOjsamaPP,
    () => props.addRosuPP,
    () => props.addOtpcPP,
    () => props.addActualPP
  ],
  () => {
    if (props.comparisonGraphData) {
      renderGraph()
    }
  }
)
</script>