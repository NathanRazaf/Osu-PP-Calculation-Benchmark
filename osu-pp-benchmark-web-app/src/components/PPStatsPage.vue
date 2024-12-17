<template>
    <div class="stats-page">
      <h2 class="page-title">Calculator Stats Viewer</h2>
      <PPDistributionSection 
        :distribution-data="distributionData"
        :error="distributionError"
        :loading="distributionLoading"
      />
      
      <StatsConfigForm
      :selected-range="selectedRange"
      :error-threshold="err_threshold"
      :pp-ranges="ppRanges"
      @update:selected-range="selectedRange = $event"
      @update:error-threshold="err_threshold = $event"
      />

      <StatsGraphGrid
        :error-stats-data="errorStatsGraphData"
        :outliers-data="outliersGraphData"
        :error-stats-loading="errorStatsLoading"
        :outliers-loading="outliersLoading"
        :error-stats-error="statsErrorMessage"
        :outliers-error="outliersErrorMessage"
      />
    </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import axios from 'axios'
import PPDistributionSection from '../components/stats/PPDistributionSection.vue'
import StatsConfigForm from '../components/stats/StatsConfigForm.vue'
import StatsGraphGrid from '../components/stats/StatsGraphGrid.vue'

const allStatsUrl = 'https://osu-statistics-fetcher.onrender.com/stats/all'
const statsCache = ref({})

// State refs for all child components
const distributionData = ref({})
const distributionLoading = ref(false)
const distributionError = ref('')
const errorStatsGraphData = ref(null)
const errorStatsLoading = ref(false)
const statsErrorMessage = ref('')
const outliersGraphData = ref(null)
const outliersLoading = ref(false)
const outliersErrorMessage = ref('')

// Form state
const ppRanges = ref([
  { value: [0, 200], label: '0-200' },
  { value: [200, 400], label: '200-400' },
  { value: [400, 600], label: '400-600' },
  { value: [600, 800], label: '600-800' },
  { value: [800, 1000], label: '800-1000' },
  { value: [1000, 100000], label: '1000+' },
  { value: [0, 100000], label: 'All' }
])
const selectedRange = ref(ppRanges.value[6])
const err_threshold = ref(200)

// Data loading functions
async function loadAllStats() {
  try {
    const response = await axios.get(allStatsUrl)
    statsCache.value = response.data
    await Promise.all([
      loadDistributionData(),
      loadErrorStatsGraph(selectedRange.value.value[0], selectedRange.value.value[1]),
      loadOutliersGraph(selectedRange.value.value[0], selectedRange.value.value[1])
    ])
  } catch (err) {
    console.error('Error loading stats:', err)
  }
}

async function loadErrorStatsGraph(min_pp, max_pp) {
  errorStatsLoading.value = true
  const data = statsCache.value?.errorStats?.[min_pp + '-' + max_pp]
  errorStatsGraphData.value = data ?? null
  statsErrorMessage.value = data ? '' : 'No data found in that range.'
  errorStatsLoading.value = false
}

async function loadOutliersGraph(min_pp, max_pp) {
  outliersLoading.value = true
  const data = statsCache.value?.outliers?.[min_pp + '-' + max_pp]?.[err_threshold.value]
  outliersGraphData.value = data ?? null
  outliersErrorMessage.value = data ? '' : 'No outliers found in that range.'
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

// Lifecycle hooks and watchers
onMounted(() => {
  loadAllStats()
  const refreshInterval = setInterval(loadAllStats, 10000)
  onUnmounted(() => clearInterval(refreshInterval))
})

watch([selectedRange, err_threshold], async () => {
  await Promise.all([
    loadErrorStatsGraph(selectedRange.value.value[0], selectedRange.value.value[1]),
    loadOutliersGraph(selectedRange.value.value[0], selectedRange.value.value[1])
  ])
})
</script>


<style scoped>
.stats-page {
  display: flex;
  width: 100%;
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

</style>