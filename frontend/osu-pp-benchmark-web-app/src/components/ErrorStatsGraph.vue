<template>
    <div style="display:flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
      <div ref="plotlyContainer" style="width: 80%; height: 700px;"></div>
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref, watch } from 'vue'
  import Plotly from 'plotly.js-dist'
  
  const props = defineProps({
    errorStatsGraphData: {
      type: Object,
      required: true,
    },
    title: {
      type: String,
      default: 'Graph',
    },
  })
  
  const plotlyContainer = ref(null)
  
  function renderGraph() {
    if (!plotlyContainer.value) {
      console.log("Plotly container is null or undefined.")
      return
    }
  
    const { mae, rmse, mbe, calculators, dataSize } = props.errorStatsGraphData
  
    const plotData = [
      { x: calculators, y: mae, type: 'bar', name: 'Mean Absolute Error', marker: { color: 'blue' } },
      { x: calculators, y: rmse, type: 'bar', name: 'Root Mean Squared Error', marker: { color: 'orange' } },
      { x: calculators, y: mbe, type: 'bar', name: 'Mean Bias Error', marker: { color: 'purple' } },
    ]
  
    const layout = {
      title: `${props.title}<br>Data Points: ${dataSize}`,
      xaxis: { title: 'Calculators' },
      yaxis: { title: 'Error Value' },
      barmode: 'group',
    }

    Plotly.newPlot(plotlyContainer.value, plotData, layout)
  }
  
  // Re-render the graph whenever `errorStatsGraphData` changes
  watch(
    () => props.errorStatsGraphData,
    (newData) => {
      if (newData) {
        renderGraph()
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    if (props.errorStatsGraphData) {
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
  