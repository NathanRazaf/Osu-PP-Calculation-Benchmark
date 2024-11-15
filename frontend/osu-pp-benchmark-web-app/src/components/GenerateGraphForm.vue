<template>
  <div class="form-container">
    <h2>Performance Points Graph Generator</h2>

    <!-- Radio buttons to select mode -->
    <div class="mode-selector">
      <label>
        <input type="radio" v-model="mode" value="userOrBeatmap" /> User/Beatmap
      </label>
      <label>
        <input type="radio" v-model="mode" value="range" /> ActualPP range
      </label>
    </div>

    <!-- Form for User/Beatmap selection -->
    <div v-if="mode === 'userOrBeatmap'" class="form-container">
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

    <!-- Form for Range selection -->
  <div v-if="mode === 'range'" class="range-inputs">
    <input
      v-model="minPP"
      placeholder="Min PP"
      type="number"
      min="0"
      class="min-range"
    />
    <input
      v-model="maxPP"
      placeholder="Max PP"
      type="number"
      min="0"
      class="max-range"
    />
    <input
      v-model="limit"
      placeholder="Limit"
      type="number"
      min="1"
      class="limit-input"
    />
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
    <button @click="loadGraph">Submit</button>

    <!-- Loading Spinner -->
    <div v-if="loading" class="loading-spinner">Loading...</div>

    <!-- iframe for displaying the graph -->
    <iframe
      v-if="graphUrl"
      :src="graphUrl"
      :key="iframeKey"
      width="70%"
      height="700"
      frameborder="0"
      @load="loading = false" 
    ></iframe>

    <p v-if="mode === 'userOrBeatmap'">If the data is insufficient, feel free to add some to the database by doing a query below with a higher number of scores to fetch. The maximum is 100 tho.</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const mode = ref('userOrBeatmap') // Mode toggle: 'userOrBeatmap' or 'range'
const identifier = ref('')
const isUsername = ref(true)
const addOjsamaPP = ref(false)
const addRosuPP = ref(false)
const addOtpcPP = ref(false)
const addActualPP = ref(true)
const minPP = ref() // For range mode
const maxPP = ref() // For range mode
const limit = ref() // For range mode
const graphUrl = ref('')
const iframeKey = ref(0)
const loading = ref(false)

function loadGraph() {
  loading.value = true

  // Generate the URL based on the selected mode
  if (mode.value === 'userOrBeatmap') {
    graphUrl.value = `http://127.0.0.1:5000/visualize?identifier=${identifier.value}&isUsername=${isUsername.value}&addOjsamaPP=${addOjsamaPP.value}&addRosuPP=${addRosuPP.value}&addOtpcPP=${addOtpcPP.value}&addActualPP=${addActualPP.value}`
  } else if (mode.value === 'range') {
    graphUrl.value = `http://127.0.0.1:5000/visualize-general?min_pp=${minPP.value}&max_pp=${maxPP.value}&limit=${limit.value}&addOjsamaPP=${addOjsamaPP.value}&addRosuPP=${addRosuPP.value}&addOtpcPP=${addOtpcPP.value}&addActualPP=${addActualPP.value}`
  }

  iframeKey.value += 1
}
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.mode-selector {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  gap: 20px;
  margin-top: 10px;
}

.mode-selector input {
  width: 20px;
  height: 20px;
  margin-right: 5px;
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

.range-inputs {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr; /* Min/Max inputs take 1fr, limit takes 2fr */
  grid-template-areas: 
    "min-range max-range" 
    "limit limit";
  width: 20%; /* Shrink the width while preventing overflow */
  margin: 0 auto; /* Center the container */
  justify-items: center; 
  align-items: center; 
}

.min-range,
.max-range {
  grid-area: min-range;
  width: 100%; /* Shrink the inputs horizontally */
  padding: 10px;
  background-color: #1a3b5d;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem; /* Slightly smaller text for these inputs */
}

.max-range {
  grid-area: max-range;
}

.limit-input {
  grid-area: limit;
  width: 100%; /* Twice the size of the min/max inputs */
  padding: 12px;
  background-color: #1a3b5d;
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

.loading-spinner {
  font-size: 1.2rem;
  color: #3a9ad9;
  margin: 20px;
  text-align: center;
}
</style>
