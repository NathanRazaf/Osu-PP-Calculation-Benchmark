<script setup>
import { ref, computed } from 'vue'
import GraphIFrame from './GraphIFrame.vue'

const outlierUrl = 'http://127.0.0.1:5000/stats/outliers'
const errorUrl = 'http://127.0.0.1:5000/stats/errors'
const errorDistributionUrl = 'http://127.0.0.1:5000/stats/error-distribution'

const range = ref([0, 500]) 
const outlierGraphUrl = ref('')
const errorGraphUrl = ref('')
const errorDistributionGraphUrl = ref('')
const loading = ref(false)

// Display computed values with '1000+' for the maximum
const displayMinPP = computed(() => range.value[0])
const displayMaxPP = computed(() => range.value[1] === 1050 ? '1000+' : range.value[1])

function loadGraphs() {
  loadOutlierGraph()
  loadErrorGraph()
  loadErrorDistributionGraph()
}

function loadOutlierGraph() {
  // Reset loading and update URL
  const minPP = range.value[0]
  const maxPP = range.value[1] === 1050 ? 100000 : range.value[1]

  if (outlierGraphUrl.value === `${outlierUrl}?min_pp=${minPP}&max_pp=${maxPP}`) {
    // Force reload even if the URL hasn't changed
    loading.value = true
    outlierGraphUrl.value = ''
    setTimeout(() => {
      outlierGraphUrl.value = `${outlierUrl}?min_pp=${minPP}&max_pp=${maxPP}`
    }, 10)
  } else {
    // Standard behavior for a new request
    loading.value = true
    outlierGraphUrl.value = `${outlierUrl}?min_pp=${minPP}&max_pp=${maxPP}`
  }
}

function loadErrorGraph() {
  // Reset loading and update URL
  const minPP = range.value[0]
  const maxPP = range.value[1] === 1050 ? 100000 : range.value[1]

  if (errorGraphUrl.value === `${errorUrl}?min_pp=${minPP}&max_pp=${maxPP}`) {
    // Force reload even if the URL hasn't changed
    loading.value = true
    errorGraphUrl.value = ''
    setTimeout(() => {
      errorGraphUrl.value = `${errorUrl}?min_pp=${minPP}&max_pp=${maxPP}`
    }, 10)
  } else {
    // Standard behavior for a new request
    loading.value = true
    errorGraphUrl.value = `${errorUrl}?min_pp=${minPP}&max_pp=${maxPP}`
  }
}

function loadErrorDistributionGraph() {
  // Reset loading and update URL
  const minPP = range.value[0]
  const maxPP = range.value[1] === 1050 ? 100000 : range.value[1]

  if (errorDistributionGraphUrl.value === `${errorDistributionUrl}?min_pp=${minPP}&max_pp=${maxPP}`) {
    // Force reload even if the URL hasn't changed
    loading.value = true
    errorDistributionGraphUrl.value = ''
    setTimeout(() => {
      errorDistributionGraphUrl.value = `${errorDistributionUrl}?min_pp=${minPP}&max_pp=${maxPP}`
    }, 10)
  } else {
    // Standard behavior for a new request
    loading.value = true
    errorDistributionGraphUrl.value = `${errorDistributionUrl}?min_pp=${minPP}&max_pp=${maxPP}`
  }
}

</script>

<template>
  <div class="form-container">
    <h2>Calculator Stats Viewer</h2>
    <p>Adjust the PP range to study the calculators' performances.</p>
    <div class="range-slider">
      <label>PP Range: {{ displayMinPP }} - {{ displayMaxPP }}</label>
      <v-range-slider
        v-model="range"
        :max="1050"
        :min="0"
        :step="50"
        strict
      ></v-range-slider>
    </div>

    <button @click="loadGraphs">Submit</button>

    <div class="graph-container-grid">
    <GraphIFrame
      v-if="outlierGraphUrl"
      :url="outlierGraphUrl"
      :loading="loading"
      @update:loading="loading = $event"
      title="Outliers"
    />
    <GraphIFrame
      v-if="errorGraphUrl"
      :url="errorGraphUrl"
      :loading="loading"
      @update:loading="loading = $event"
      title="Errors"
    />
    <GraphIFrame
      v-if="errorDistributionGraphUrl"
      :url="errorDistributionGraphUrl"
      :loading="loading"
      @update:loading="loading = $event"
      title="Error Distribution"
    />
    </div>
  </div>
</template>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.graph-container-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(45%, 1fr)); 
  gap: 20px; 
  width: 100%;
  padding: 10px;
  margin-bottom: 30px;
}

.range-slider {
  width: 25%;
}

button {
  margin-top: 10px;
  margin-bottom: 20px;
  width: 150px;
  padding: 12px;
  background-color: #3a9ad9;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #2b81b7;
}

@media (max-width: 900px) {
  .graph-container-grid {
    grid-template-columns: 1fr; /* Single column layout */
  }
}
</style>
