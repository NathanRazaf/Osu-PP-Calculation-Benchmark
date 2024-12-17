<template>
  <div class="form-container">
    <h2>Performance Points Graph Generator</h2>
    <p>Input the username/beatmap ID to generate the graph for.</p>
    
    <!-- Form for User/Beatmap selection -->
    <div class="form-container">
      <input
        v-model="identifier"
        placeholder="Enter username or beatmap ID"
        type="text"
      />
      <select v-model="isUsername">
        <option :value="true">Username</option>
        <option :value="false">Beatmap ID</option>
      </select>
    </div>

    <!-- Checkbox container (common for both modes) -->
    <div class="checkbox-container">
      <label>
        <input type="checkbox" v-model="addOjsamaPP" />
        <span>Add ojsama's PP calculations</span>
      </label>
      <label>
        <input type="checkbox" v-model="addRosuPP" />
        <span>Add rosu-pp-js' PP calculations</span>
      </label>
      <label>
        <input type="checkbox" v-model="addOtpcPP" />
        <span>Add osu-tools' PP calculations</span>
      </label>
      <label>
        <input type="checkbox" v-model="addActualPP" />
        <span>Add actual PP</span>
      </label>
    </div>

    <!-- Submit button -->
    <button 
      @click="onButtonPress" 
      :disabled="loadingData"
    >
      {{ loadingData ? `Loading... ${ progressValue }%` : 'Submit' }}
    </button>


    <!-- Error Display -->
    <div v-if="errorMessage !== ''" class="m-container error-message"><h2>{{ errorMessage }}</h2></div>

    <!-- Graph container -->
    <ComparisonGraph
      v-if="comparisonGraphData"
      :comparisonGraphData="comparisonGraphData"
      :addOjsamaPP="addOjsamaPP"
      :addRosuPP="addRosuPP"
      :addOtpcPP="addOtpcPP"
      :addActualPP="addActualPP"
      title="Performance Points Comparison"
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchBeatmapScores } from '../fetchers/fetch_beatmap_scores'
import { fetchUserScores } from '../fetchers/fetch_user_scores'
import ComparisonGraph from './ComparisonGraph.vue'
import axios from 'axios'
import { CacheManager } from '../assets/cacheManager'

const identifier = ref('')
const isUsername = ref(true)
const progressValue = ref(0)
const addOjsamaPP = ref(false)
const addRosuPP = ref(false)
const addOtpcPP = ref(false)
const addActualPP = ref(true)
const loadingData = ref(false)
const dataUrl = 'https://osu-statistics-fetcher.onrender.com/graph/get-pp-data'
const comparisonGraphData = ref(null)
const errorMessage = ref('')

// Initialize cache manager
const cacheManager = new CacheManager()

async function onButtonPress() {
  try {
    progressValue.value = 0
    loadingData.value = true
    errorMessage.value = ''

    // Check cache first
    const cachedData = cacheManager.getCachedData(identifier.value, isUsername.value)
    
    if (cachedData && cacheManager.isDataValid(identifier.value, isUsername.value)) {
      // Use cached data if it's valid
      comparisonGraphData.value = cachedData.data
      console.log('Using cached data')
    } else {
      // Fetch new data if cache is invalid or missing
      try {
        await callFetcher()
        await loadGraph()
      } catch (error) {
        if (error.response && error.response.status === 404) {
          await callFetcher()
          await loadGraph()
        } else {
          throw error
        }
      }
    }
  } catch (error) {
    console.error('Error:', error)
    errorMessage.value = `The ${isUsername ? 'user' : 'beatmap'} could not be found.`
  } finally {
    loadingData.value = false
  }
}

async function callFetcher() {
  try {
    const onProgress = (progress) => {
      progressValue.value = progress
      loadGraph()
    }

    if (isUsername.value) {
      await fetchUserScores(identifier.value, 100, onProgress)
    } else {
      await fetchBeatmapScores(parseInt(identifier.value), 100, onProgress)
    }
    loadingData.value = false
  } catch (error) {
    console.error('Error calling fetcher:', error)
    throw error
  }
}

async function loadGraph() {
  try {
    const params = {
      identifier: identifier.value,
      isUsername: isUsername.value,
      addOjsamaPP: addOjsamaPP.value,
      addRosuPP: addRosuPP.value,
      addOtpcPP: addOtpcPP.value,
      addActualPP: addActualPP.value,
    }
    
    const response = await axios.get(dataUrl, { params })
    comparisonGraphData.value = response.data
    
    // Cache the new data
    cacheManager.saveData(identifier.value, isUsername.value, response.data)
    
    errorMessage.value = ''
  } catch (error) {
    if (error.status === 404) {
      console.log('Data not found.')
      comparisonGraphData.value = null
      errorMessage.value = 'User/Beatmap not found.'
    } else {
      console.log('An error occurred:', error.message)
      errorMessage.value = error.message
    }
  }
}

// Clean up expired cache entries when component is mounted
onMounted(() => {
  cacheManager.clearExpiredCache()
})
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}


input {
  width: 300px;
  padding: 12px;
  background-color: #1a3b5d;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
}

select {
  width: auto;
  padding: 10px;
  background-color: #1e2d3d;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
}

.checkbox-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 20px;
  margin-top: 10px;
  flex-wrap: wrap; 
  max-width: 800px; 
}
label {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 1rem;
  color: #fff;
  width: 150px; 
  text-align: center;
}

input[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: #3a9ad9;
  margin-bottom: 5px;
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
  padding: 10px;
  width: 70%;
  height: 700px;
}

.error-message {
  color: #ff0000;
  border: 2px solid #ff0000;
}
</style>
