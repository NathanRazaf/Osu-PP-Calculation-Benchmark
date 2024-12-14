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
        <span>Add Ojsama PP</span>
      </label>
      <label>
        <input type="checkbox" v-model="addRosuPP" />
        <span>Add Rosu PP</span>
      </label>
      <label>
        <input type="checkbox" v-model="addOtpcPP" />
        <span>Add Otpc PP</span>
      </label>
      <label>
        <input type="checkbox" v-model="addActualPP" />
        <span>Add actual PP</span>
      </label>
    </div>

    <!-- Submit button -->
    <button 
      @click="onButtonPress" 
      :disabled="loading"
    >
      {{ loadingData ? `Loading... ${ progressValue }%` : 'Submit' }}
    </button>

    <!-- Loading Container -->
    <div v-if="loading" class="m-container loading">Loading... </div>

    <!-- Error Display -->
    <div v-if="errorMessage !== ''" class="m-container error-message"><h2>{{ errorMessage }}</h2></div>

    <!-- Graph container -->
    <ComparisonGraph
    v-if="comparisonGraphData"
    :comparisonGraphData="comparisonGraphData"
    title="Performance Points Comparison"
    />

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { fetchBeatmapScores } from '../fetchers/fetch_beatmap_scores'
import { fetchUserScores } from '../fetchers/fetch_user_scores'
import ComparisonGraph from './ComparisonGraph.vue'
import axios from 'axios'
const identifier = ref('')
const isUsername = ref(true)
const progressValue = ref(0)
const addOjsamaPP = ref(false)
const addRosuPP = ref(false)
const addOtpcPP = ref(false)
const addActualPP = ref(true)
const loading = ref(false)
const loadingData = ref(false)
const dataUrl = 'https://osu-statistics-fetcher.onrender.com/graph/get-pp-data'
const comparisonGraphData = ref(null)
const errorMessage = ref('')

async function onButtonPress() {
  try {
    // Reset progress before starting
    progressValue.value = 0
    loadingData.value = true

    const params = {
      identifier: identifier.value,
      isUsername: isUsername.value,
      addOjsamaPP: addOjsamaPP.value,
      addRosuPP: addRosuPP.value,
      addOtpcPP: addOtpcPP.value,
      addActualPP: addActualPP.value,
    }
    
    try {
      const response = await axios.get(dataUrl, { params })
      const actualPParray = response.data.actualPP
      // Call the fetcher if there's less than 100 values in the database
      if (actualPParray.length < 100) {
        await callFetcher()
      }
      loadGraph()
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // If 404, call fetcher to get new data
        await callFetcher()
        loadGraph()
      } else {
        // Re-throw other errors to be caught by outer try-catch
        throw error
      }
    }
  } catch (error) {
    console.error('Error calling fetcher:', error)
  }
}

async function callFetcher() {
  try {
    const onProgress = (progress) => {
      progressValue.value = progress
      loadGraph()
    }

    // Call the appropriate fetch function based on isUsername
    if (isUsername.value) {
      await fetchUserScores(identifier.value, 100, onProgress)
    } else {
      await fetchBeatmapScores(parseInt(identifier.value), 100, onProgress)
    }

    loadingData.value = false
  
  } catch (error) {
    console.error('Error calling fetcher:', error)
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
    loading.value = true
    comparisonGraphData.value = response.data
    loading.value = false
    loadingData.value = false
    errorMessage.value = ''
  } catch (error) {
    if (error.status === 404) {
      console.log('Data not found.')
      comparisonGraphData.value = null
      loading.value = false
      loadingData.value = false
      errorMessage.value = 'User/Beatmap not found.'
    } else {
      console.log('An error occurred:', error.message)
      loading.value = false
      loadingData.value = false
      errorMessage.value = error.message
    }
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
}

label {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 1rem;
  color: #fff;
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

.loading {
  color: #3a9ad9;
  border: 2px solid #3a9ad9;
}

.error-message {
  color: #ff0000;
  border: 2px solid #ff0000;
}
</style>
