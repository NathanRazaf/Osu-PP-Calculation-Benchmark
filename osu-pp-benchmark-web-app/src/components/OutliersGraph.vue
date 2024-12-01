<template>
  <div style="display:flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
    <!-- Radio Buttons -->
    <div style="margin-bottom: 20px;">
      <label>
        <input type="radio" name="displayType" value="top200best" v-model="selectedDisplayType" />
        Show Top 200 Best Outliers
      </label>
      <label style="margin-left: 20px;">
        <input type="radio" name="displayType" value="top200worst" v-model="selectedDisplayType" />
        Show Top 200 Worst Outliers
      </label>
    </div>

    <!-- Graph Container -->
    <div ref="plotlyContainer" style="width: 80%; height: 700px;"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import Plotly from 'plotly.js-dist'

const props = defineProps({
  outliersGraphData: {
    type: Object,
    required: true,
  },
  title: {
    type: String,
    default: 'Graph',
  },
})

const plotlyContainer = ref(null)
const selectedDisplayType = ref('top200best') // Default value

function renderGraph() {
  if (!plotlyContainer.value) {
    console.log("Plotly container is null or undefined.")
    return
  }

  // Select data based on the display type
  const dataToDisplay = selectedDisplayType.value === 'top200best' 
    ? props.outliersGraphData.top200best 
    : props.outliersGraphData.top200worst

  const ojsamaData = dataToDisplay.filter(outlier => outlier.model === 'ojsamaPP')
  const otpcData = dataToDisplay.filter(outlier => outlier.model === 'otpcPP')
  const rosuData = dataToDisplay.filter(outlier => outlier.model === 'rosuPP')

  const plotData = [
    {
      x: ojsamaData.map(outlier => outlier.actualPP),
      y: ojsamaData.map(outlier => outlier.error),
      mode: 'markers',
      type: 'scatter',
      name: `ojsamaPP (count: ${ojsamaData.length})`,
      marker: { color: 'red' },
      showlegend: true
    },
    {
      x: otpcData.map(outlier => outlier.actualPP),
      y: otpcData.map(outlier => outlier.error),
      mode: 'markers',
      type: 'scatter',
      name: `otpcPP (count: ${otpcData.length})`,
      marker: { color: 'blue' },
      showlegend: true
    },
    {
      x: rosuData.map(outlier => outlier.actualPP),
      y: rosuData.map(outlier => outlier.error),
      mode: 'markers',
      type: 'scatter',
      name: `rosuPP (count: ${rosuData.length})`,
      marker: { color: 'green' },
      showlegend: true
    }
  ]

  const layout = {
    title: `${props.title}<br>Error threshold: ${props.outliersGraphData.errorThreshold}`,
    xaxis: { title: 'Actual PP' },
    yaxis: { title: 'Error Magnitude' }
  }

  Plotly.newPlot(plotlyContainer.value, plotData, layout)
}

// Re-render the graph whenever `outliersGraphData` or `selectedDisplayType` changes
watch(
  [() => props.outliersGraphData, () => selectedDisplayType.value],
  ([newData]) => {
    if (newData) {
      renderGraph()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.outliersGraphData) {
    renderGraph()
  }
})
</script>

<style scoped>
.graph-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  width: 100%;
}

.plotly-graph {
  width: 100%;
  height: 700px;
}

.loading-spinner {
  font-size: 1.2rem;
  color: #3a9ad9;
  margin: 20px;
  text-align: center;
}
</style>
