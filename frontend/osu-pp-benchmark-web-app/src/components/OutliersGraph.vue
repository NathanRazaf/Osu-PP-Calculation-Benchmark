<template>
    <div style="display:flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
      <div ref="plotlyContainer" style="width: 80%; height: 700px;"></div>
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref, watch } from 'vue'
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
  
  function renderGraph() {
    if (!plotlyContainer.value) {
      console.log("Plotly container is null or undefined.")
      return
    }
  
    const {top200best, top200worst, errorThreshold } = props.outliersGraphData
    const ojsamaData = top200best.filter(outlier => outlier.model === 'ojsamaPP')
    const otpcData = top200best.filter(outlier => outlier.model === 'otpcPP')
    const rosuData = top200best.filter(outlier => outlier.model === 'rosuPP')

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
      title: `${props.title}<br>Error threshold: ${errorThreshold}`,
      xaxis: { title: 'Actual PP' },
      yaxis: { title: 'Error Magnitude' }
    }

    Plotly.newPlot(plotlyContainer.value, plotData, layout)
  }
  
  // Re-render the graph whenever `top200bestGraphData` changes
  watch(
    () => props.outliersGraphData,
    (newData) => {
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
  