<template>
  <div class="form-container">
    <h2>Generate the pp calculation graph of the user/beatmap</h2>
    <input
      v-model="identifier"
      placeholder="Enter username or beatmap ID"
      type="text"
    />
    <select v-model="isUsername">
      <option :value="true">Username</option>
      <option :value="false">Beatmap ID</option>
    </select>
    <button @click="loadGraph">Submit</button>

    <!-- Loading Spinner -->
    <div v-if="loading" class="loading-spinner">Loading...</div>

    <!-- iframe with unique key for forcing reload -->
    <iframe
      v-if="graphUrl"
      :src="graphUrl"
      :key="iframeKey"
      width="70%"
      height="700"
      frameborder="0"
      @load="loading = false" 
    ></iframe>

    <p>If the data is insufficient, feel free to add some to the database by doing a query below with a higher number of scores to fetch. The maximum is 100 tho.</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const identifier = ref('')
const isUsername = ref(true)
const graphUrl = ref('')
const iframeKey = ref(0)
const loading = ref(false)  // Loading state

function loadGraph() {
  // Set loading to true when starting to load a new graph
  loading.value = true
  graphUrl.value = `http://127.0.0.1:5000/visualize?identifier=${identifier.value}&isUsername=${isUsername.value}`
  iframeKey.value += 1  // Changing the key forces a re-render
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
