<template>
  <div class="form-container">
    <h2>Calculator Stats Viewer</h2>

    <!-- Add PP Distribution Graph -->
    <PPDistributionGraph
      :distribution-data="distributionData"
    />
    <div v-if="distributionError !== ''" class="m-container error-message"><h2>{{ distributionError }}</h2></div>
    <div v-if="distributionLoading" class="m-container loading-400"><h2>Loading...</h2></div>

    <p>Adjust the PP range and threshold to study the calculators' performances.</p>
    <div class="dropdown-container">
      <label for="pp-range">Select PP Range:</label>
      <select v-model="selectedRange" id="pp-range">
        <option v-for="range in ppRanges" :value="range" :key="range.label">
        {{ range.label }}
        </option>
      </select>
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
import { ref, onMounted } from 'vue'
import axios from 'axios'
import ErrorStatsGraph from './ErrorStatsGraph.vue'
import OutliersGraph from './OutliersGraph.vue'
import PPDistributionGraph from './PPDistributionGraph.vue'


const ppRanges = ref([
  { value: [0, 200], label: '0-200' },
  { value: [200, 400], label: '200-400' },
  { value: [400, 600], label: '400-600' },
  { value: [600, 800], label: '600-800' },
  { value: [800, 1000], label: '800-1000' },
  { value: [1000, 100000], label: '1000+' },
  { value: [0, 100000], label: 'All' }
])

const distributionUrl = 'https://osu-statistics-fetcher.onrender.com/stats/distribution'
const errorUrl = 'https://osu-statistics-fetcher.onrender.com/stats/errors'
const outliersUrl = 'https://osu-statistics-fetcher.onrender.com/stats/outliers'

// PP Distribution graph
const distributionData = ref({})
const distributionLoading = ref(false)
const distributionError = ref('')

// Error stats graph
const errorStatsGraphData = ref(null)
const errorStatsLoading = ref(false)
const statsErrorMessage = ref('')

// Outliers graph
const outliersGraphData = ref(null)
const outliersLoading = ref(false)
const outliersErrorMessage = ref('')
const err_threshold = ref(200)

async function loadDistributionData() {
  try {
    distributionLoading.value = true
    const response = await axios.get(distributionUrl)
    const ranges = ['0-200', '200-400', '400-600', '600-800', '800-1000', '1000+']
    const counts = []
    for (const range of ranges) {
        let count = 0
        if (range === '1000+') {
            count = response.data['1000-100000'] || 0
        } else {
            count = response.data[range] || 0
        }
        counts.push(count)
    }
    distributionData.value = { ranges, counts }
    distributionError.value = ''
  } catch (error) {
    console.error('Error loading distribution data:', error)
    distributionError.value = 'Failed to load PP distribution data'
    distributionData.value = {}
  } finally {
    distributionLoading.value = false
  }
}

// Load distribution data on component mount
onMounted(() => {
  loadDistributionData()
})


const err_message = ref('')


const selectedRange = ref(ppRanges.value[0]) // Default to the first range object

async function loadGraphs() {
  err_message.value = ''
  
  // Access the selected range's value
  const [minPP, maxPP] = selectedRange.value.value
  
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
  width: 15%;
}

.dropdown-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

#pp-range {
  width: 150px;
  padding: 8px;
  font-size: 1rem;
  border: 1px solid #ccc;
  background-color: #2b81b7;
  border-radius: 4px;
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

.loading-400 {
  color: #3a9ad9;
  border: 2px solid #3a9ad9;
  height: 400px;
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
