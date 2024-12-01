<template>
  <div class="form-container">
    <h2>Calculator Stats Viewer</h2>
    <p>Adjust the PP range and threshold to study the calculators' performances.</p>
    <div class="range-slider">
      <label>PP Range: {{ displayMinPP }} - {{ displayMaxPP }}</label>
      <v-range-slider
        v-model="range"
        :max="1200"
        :min="0"
        :step="200"
        strict
      ></v-range-slider>
    </div>

    <div class="range-slider">
      <label>Error threshold: {{ err_threshold }}</label>
      <v-slider
        v-model="err_threshold"
        :max="800"
        :min="200"
        :step="200"
        strict
      ></v-slider>
    </div>

    <button @click="loadGraphs">Submit</button>
    <h3 v-if="err_message !== ''">{{ err_message }}</h3>


    <div class="graph-container-grid">
      <ErrorStatsGraph
      v-if="errorStatsGraphData"
      :error-stats-graph-data="errorStatsGraphData"
      title="Error Statistics"
    />
    <div v-if="statsErrorMessage !== ''" class="m-container error-message"><h2>{{ statsErrorMessage }}</h2></div>
    <div v-if="errorStatsLoading" class="m-container loading"><h2>Loading...</h2></div>

    <OutliersGraph
      v-if="outliersGraphData"
      :outliers-graph-data="outliersGraphData"
      title="Outliers"
    />
    <div v-if="outliersErrorMessage !== ''" class="m-container error-message"><h2>{{ outliersErrorMessage }}</h2></div>
    <div v-if="outliersLoading" class="m-container loading"><h2>Loading...</h2></div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import ErrorStatsGraph from './ErrorStatsGraph.vue'
import OutliersGraph from './OutliersGraph.vue';


const displayMinPP = computed(() => range.value[0])
const displayMaxPP = computed(() => range.value[1] === 1200 ? '1000+' : range.value[1])

const errorUrl = 'https://osu-statistics-fetcher.onrender.com/stats/errors'
const outliersUrl = 'https://osu-statistics-fetcher.onrender.com/stats/outliers'

const range = ref([0, 400]) 

// Error stats graph
const errorStatsGraphData = ref(null)
const errorStatsLoading = ref(false)
const statsErrorMessage = ref('')

// Outliers graph
const outliersGraphData = ref(null)
const outliersLoading = ref(false)
const outliersErrorMessage = ref('')
const err_threshold = ref(200)

const err_message = ref('')


async function loadGraphs() {
  err_message.value = ''
  if (range.value[0] === range.value[1]) {
    err_message.value = 'Invalid range: min PP cannot be equal to max PP.'
    return
  }
  const minPP = range.value[0]
  const maxPP = range.value[1] === 1200 ? 100000 : range.value[1]

  
  // Use Promise.all to load both graphs concurrently
  await Promise.all([
    loadErrorStatsGraph(minPP, maxPP),
    loadOutliersGraph(minPP, maxPP)
  ])
}


async function loadErrorStatsGraph(min_pp, max_pp) {
  try {
    errorStatsLoading.value = true
    errorStatsGraphData.value = null
    const response = await axios.get(errorUrl, { params: { min_pp, max_pp } })
    errorStatsGraphData.value = response.data
    statsErrorMessage.value = ''
  } catch (error) {
    if (error.status === 404) {
      console.log('No data found in that range.')
      errorStatsGraphData.value = null
      statsErrorMessage.value = 'No data found in that range.'
    } else {
      console.log('An error occurred:', error.message)
      statsErrorMessage.value = error.message
    }
  } finally {
    errorStatsLoading.value = false
  }
}

async function loadOutliersGraph(min_pp, max_pp) {
  try {
    outliersLoading.value = true
    outliersGraphData.value = null
    const response = await axios.get(outliersUrl, { params: { min_pp, max_pp, err_threshold:err_threshold.value } })
    outliersGraphData.value = response.data
    outliersErrorMessage.value = ''
  } catch (error) {
    if (error.status === 404) {
      console.log('No outliers found in that range.')
      outliersGraphData.value = null
      outliersErrorMessage.value = 'No outliers found in that range.'
    } else {
      console.log('An error occurred:', error.message)
      outliersErrorMessage.value = error.message
    }
  } finally {
    outliersLoading.value = false
  }
}
</script>

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
  margin-bottom: 50px;
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

.m-container {
  font-size: 1.2rem;
  display: flex;
  margin: 20px;
  align-items: center;
  justify-content: center;
  align-self: center;
  justify-self: center;
  padding: 10px;
  width: 70%;
  height: 700px;
}

.loading {
  color: #3a9ad9;
  border: 2px solid #3a9ad9;
}

.error-message {
  color: #ff0000;
  border: 2px solid #ff0000;
}

@media (max-width: 900px) {
  .graph-container-grid {
    grid-template-columns: 1fr; /* Single column layout */
  }
}

.error-threshold-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
}

.error-threshold-input label {
  font-weight: bold;
  margin-bottom: 5px;
}

.error-threshold-input input {
  width: 150px;
  padding: 8px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
}
</style>
