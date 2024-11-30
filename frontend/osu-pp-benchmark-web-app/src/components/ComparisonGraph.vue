<template>
    <!-- Render the Plotly container only if comparisonGraphData exists -->
    <div v-if="comparisonGraphData" ref="plotlyContainer" style="width: 70%; height: 700px;"></div>
</template>
  
  <script setup>
  import { ref, watch, onMounted } from 'vue'
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
  
  // Ref for the Plotly container
  const plotlyContainer = ref(null)
  
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
    } = props.comparisonGraphData
  
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