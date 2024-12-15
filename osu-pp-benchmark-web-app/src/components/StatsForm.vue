<template>
  <div class="form-container">
    <h2 style="margin-bottom: 40px;">Calculator Stats Viewer</h2>

    <!-- Add PP Distribution Graph -->
    <PPDistributionGraph v-if="distributionData && distributionError === '' && !distributionLoading"
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


    <div class="graph-container-grid">
      <ErrorStatsGraph
      v-if="errorStatsGraphData && statsErrorMessage === '' && !errorStatsLoading"
      :error-stats-graph-data="errorStatsGraphData"
      title="Error Statistics"
    />
    <div v-if="statsErrorMessage !== ''" class="m-container error-message"><h2>{{ statsErrorMessage }}</h2></div>
    <div v-if="errorStatsLoading" class="m-container loading"><h2>Loading...</h2></div>

    <OutliersGraph
      v-if="outliersGraphData && outliersErrorMessage === '' && !outliersLoading"
      :outliers-graph-data="outliersGraphData"
      title="Outliers"
    />
    <div v-if="outliersErrorMessage !== ''" class="m-container error-message"><h2>{{ outliersErrorMessage }}</h2></div>
    <div v-if="outliersLoading" class="m-container loading"><h2>Loading...</h2></div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
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


const allStatsUrl = 'https://osu-statistics-fetcher.onrender.com/stats/all'
const statsCache = ref({})

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


const selectedRange = ref(ppRanges.value[6])  // Default to 'All'
const err_threshold = ref(200) // Default to 200

async function loadAllStats() {
  try {
    const response = await axios.get(allStatsUrl)
    statsCache.value = response.data
    loadDistributionData()
    loadErrorStatsGraph(selectedRange.value.value[0], selectedRange.value.value[1]),
    loadOutliersGraph(selectedRange.value.value[0], selectedRange.value.value[1])
  } catch (err) {
    console.error('Error loading stats:', err)
  } finally {
  }
}





async function loadErrorStatsGraph(min_pp, max_pp) {
  errorStatsLoading.value = true
  const data = statsCache.value?.errorStats?.[min_pp + '-' + max_pp]
  
  if (data === null || data === undefined) {
    errorStatsGraphData.value = null
    statsErrorMessage.value = 'No data found in that range.'
  } else {
    errorStatsGraphData.value = data
    statsErrorMessage.value = ''
  }
  errorStatsLoading.value = false
}

async function loadOutliersGraph(min_pp, max_pp) {
  outliersLoading.value = true
  const data = statsCache.value?.outliers?.[min_pp + '-' + max_pp]?.[err_threshold.value]
  
  if (data === null || data === undefined) {
    outliersGraphData.value = null
    outliersErrorMessage.value = 'No outliers found in that range.'
  } else {
    outliersGraphData.value = data
    outliersErrorMessage.value = ''
  }
  outliersLoading.value = false
}

async function loadDistributionData() {
  distributionLoading.value = true
  const distribution = statsCache.value?.distribution
  
  if (!distribution) {
    distributionError.value = 'Failed to load PP distribution data'
    distributionData.value = {}
  } else {
    const ranges = ['0-200', '200-400', '400-600', '600-800', '800-1000', '1000-100000']
    const counts = ranges.map(range => distribution[range] ?? 0)
    ranges[ranges.length - 1] = '1000+'
    
    distributionData.value = { ranges, counts }
    distributionError.value = ''
  }
  distributionLoading.value = false
}

// Load distribution data on component mount
onMounted(() => {
  loadAllStats()
})

// Watch for changes in selection
watch([selectedRange, err_threshold], async () => {
  await Promise.all([
    loadErrorStatsGraph(selectedRange.value.value[0], selectedRange.value.value[1]),
    loadOutliersGraph(selectedRange.value.value[0], selectedRange.value.value[1])
  ])
})

// Initial load and set up periodic refresh
let refreshInterval
onMounted(() => {
  loadAllStats()
  
  // Refresh every 10 seconds
  refreshInterval = setInterval(() => {
    loadAllStats()
  }, 10000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
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
