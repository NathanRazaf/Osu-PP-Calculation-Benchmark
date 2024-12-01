<template>
    <div style="display:flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
      <h3>Overall best model in this range (assuming the 3 metrics have the same weight) :</h3>
      <h3 style="margin-bottom: 10px;">{{ bestModel }}</h3>
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
  const bestModel = ref(null)
  function renderGraph() {
    if (!plotlyContainer.value) {
      console.log("Plotly container is null or undefined.")
      return
    }
  
    const { mae, rmse, mbe, dataSize } = props.errorStatsGraphData

    const calculators = ['ojsama', 'rosu-pp-js', "osu-tools' PC"]
    
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

    // Calculate the best model based on the 3 metrics
    const scoreOjsama = mae[0] + rmse[0] +  mbe[0]
    const scoreRosu = mae[1] + rmse[1] + mbe[1]
    const scoreOtpc = mae[2] + rmse[2] + mbe[2]

    // Select the model with the lowest score
    if (scoreOjsama < scoreRosu && scoreOjsama < scoreOtpc) {
      bestModel.value = 'oj-sama'
    } else if (scoreRosu < scoreOjsama && scoreRosu < scoreOtpc) {
      bestModel.value = 'rosu-pp-js'
    } else {
      bestModel.value = 'osu-tools\' Performance Calculator'
    }
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
  