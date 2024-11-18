<script setup>
import { ref } from 'vue'
import FetchDataForm from './FetchDataForm.vue';
import GenerateGraphForm from './GenerateGraphForm.vue';
import StatsForm from './StatsForm.vue';
const activeTab = ref('fetchData') // Default tab is 'FetchData'

function switchTab(tab) {
  activeTab.value = tab
}
</script>

<template>
  <div class="tab-selector">
    <button 
      :class="{ active: activeTab === 'fetchData' }" 
      class="one"
      @click="switchTab('fetchData')"
    >
      Fetch Data
    </button>
    <button 
        class="two"
      :class="{ active: activeTab === 'generateGraph' }" 
      @click="switchTab('generateGraph')"
    >
      Generate Graph
    </button>
    <button 
        class="three"
      :class="{ active: activeTab === 'statsForm' }" 
      @click="switchTab('statsForm')"
    >
      Stats
    </button>
  </div>
  <div class="tab-content">
    <FetchDataForm v-if="activeTab === 'fetchData'" />
    <GenerateGraphForm v-if="activeTab === 'generateGraph'" />
    <StatsForm v-if="activeTab === 'statsForm'" />
  </div>
</template>

<style scoped>
.tab-selector {
  display: flex;
  justify-content: center;
  margin: 0;
  width: 100%;
  border-bottom: #1a3b5d 1px solid;
}

button {
  padding: 20px 30px;
  margin: 0;
  background-color: #181818;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  width: 10%;
  transition: background-color 0.3s;
  border-top: none;
  border-bottom: none;
}

.one {
  border-left: 1px solid #1a3b5d;
}

.two {
  border-left: 1px solid #1a3b5d;
  border-right: 1px solid #1a3b5d;
}

.three {
  border-left: none;
  border-right: 1px solid #1a3b5d;
}

button:hover {
  background-color: #2b81b7;
}


button:focus {
  text-decoration: underline;
}

.tab-content {
  margin-top: 20px;
}
</style>
