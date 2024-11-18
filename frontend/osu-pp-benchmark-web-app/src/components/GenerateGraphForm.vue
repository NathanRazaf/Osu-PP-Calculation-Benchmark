<template>
  <div class="form-container">
    <h2>Performance Points Graph Generator</h2>
    <p>Input the username/beatmap ID or the PP range you want to generate the graph for.</p>
    
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

    <p>If the data is insufficient, feel free to add some to the database by doing a query below with a higher number of scores to fetch on the left tab.</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

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
  graphUrl.value = `http://127.0.0.1:5000/visualize-instance?identifier=${identifier.value}&isUsername=${isUsername.value}&addOjsamaPP=${addOjsamaPP.value}&addRosuPP=${addRosuPP.value}&addOtpcPP=${addOtpcPP.value}&addActualPP=${addActualPP.value}`
  

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

.loading-spinner {
  font-size: 1.2rem;
  color: #3a9ad9;
  margin: 20px;
  text-align: center;
}
</style>
