<template>
  <div class="form-container">
    <h2>Fetch User/Beatmap Best Plays</h2>
    <p>Input the username/beatmap ID you want to fetch the scores from, and choose a number of scores to fetch up to 100.</p>
    <input
      v-model="identifier"
      placeholder="Enter username or beatmap ID"
      type="text"
    />
    <input 
      v-model="limit"
      placeholder="Enter the number of scores to fetch"
      type="number"
    />
    <select v-model="isUsername">
      <option :value="true">Username</option>
      <option :value="false">Beatmap ID</option>
    </select>
    <button @click="fetchData">Submit</button>
    <button @click="fetchFatData">Submit</button>

    <p v-if="displayMessage" :style="messageStyle">{{ displayMessage }}</p>

    <!-- Progress bar and percentage display -->
    <div style="margin-top: 7px; margin-bottom: 30px;">
      <progress :value="progressValue" max="100" id="progress-bar"></progress>
      <p>{{ progressText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { fetchBeatmapScores } from '../fetchers/fetch_beatmap_scores'
import { fetchUserScores, fetchScoresMultipleUsers } from '../fetchers/fetch_user_scores'

const identifier = ref('')
const isUsername = ref(true) // Default selection as "Username"
const progressValue = ref(0)
const progressText = ref('0%')
const limit = ref()
const displayMessage = ref('')
const messageStyle = ref({})

async function fetchFatData() {
  await fetchScoresMultipleUsers(['[- Yami -]', 'SpiisSy', 'Skuppraa', 'squide', 'aerleag', 'Allan100', 'GoShinji', 'HiranMelody86', 'Nizayy', 'Mxgiwara', 'Minil', '-vile', 'Antiserum', 'ZwipFR', 'tweiste', 'thedt', 'Mugenn', 'Thornn', 'werkzu', 'Ted', 'aosora', '_2K', 'Ghsed'], 100)
}

async function fetchData() {
  // Reset progress before starting
  progressValue.value = 0
  progressText.value = '0%'
  displayMessage.value = ''

  try {
    const onProgress = (progress) => {
      progressValue.value = progress
      progressText.value = `${progress}%`
    }

    // Call the appropriate fetch function based on isUsername
    if (isUsername.value) {
      await fetchUserScores(identifier.value, limit.value, onProgress)
    } else {
      await fetchBeatmapScores(parseInt(identifier.value), limit.value, onProgress)
    }
    
    // Update display message to indicate success
    displayMessage.value = "Data fetching completed successfully!"
    messageStyle.value = { color: 'green' }
  } catch (error) {
    displayMessage.value = "Error fetching data. Please check the input and try again."
    messageStyle.value = { color: 'red' }
    console.error("Error fetching data:", error)
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

p {
  align-self: center;
  justify-self: center;
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

#progress-bar {
  width: 300px;
  height: 30px; /* Set the height of the progress bar */
  background-color: #f7f7f7; /* Set the background color */
  /* Change progress bar color */
  color: #3a9ad9;
  appearance: none; /* Remove default browser styling */
  border-radius: 4px; /* Add a border radius */

}

</style>
