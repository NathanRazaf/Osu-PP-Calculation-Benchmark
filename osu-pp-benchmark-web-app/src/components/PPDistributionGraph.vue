<!-- PPDistributionGraph.vue -->
<template>
    <div style="display:flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
      <h3>PP Distribution Across Ranges</h3>
      <div ref="plotlyContainer" style="width: 50%; height: 400px;"></div>
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref, watch } from 'vue'
  import Plotly from 'plotly.js-dist'
  
  const props = defineProps({
    distributionData: {
      type: Object,
      required: true
    }
  })
  
  const plotlyContainer = ref(null)
  
  function renderGraph() {
    if (!plotlyContainer.value || !props.distributionData) {
      return
    }

    console.log(props.distributionData) // Debugging
  
    const { ranges, counts } = props.distributionData

    const plotData = [{
      x: ranges,
      y: counts,
      type: 'bar',
      name: 'Number of Plays',
      marker: {
        color: '#2b81b7'
      }
    }]
  
    const layout = {
      title: 'PP Distribution',
      xaxis: {
        title: 'PP Range',
        tickangle: -45
      },
      yaxis: {
        title: 'Number of Plays'
      },
      margin: {
        b: 100 // Add more bottom margin for rotated labels
      }
    }
  
  
    Plotly.newPlot(plotlyContainer.value, plotData, layout)
  }
  
  // Re-render the graph whenever distributionData changes
  watch(
    () => props.distributionData,
    (newData) => {
      if (newData) {
        renderGraph()
      }
    },
    { deep: true }
  )
  
  onMounted(() => {
    if (props.distributionData) {
      renderGraph()
    }
  })
  </script>