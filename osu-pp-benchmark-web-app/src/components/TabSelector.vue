<script setup>
import { ref, computed } from 'vue'
import GenerateGraphForm from './GenerateGraphForm.vue';
import StatsForm from './StatsForm.vue';
const activeTab = ref('generateGraph') // Default tab is 'generateGraph'

function switchTab(tab) {
  activeTab.value = tab
}

// Compute the current component based on activeTab
const currentComponent = computed(() => {
  switch (activeTab.value) {
    case 'generateGraph':
      return GenerateGraphForm
    case 'statsForm':
      return StatsForm
    default:
      return FetchDataForm
  }
})
</script>

<template>
  <div class="tab-selector">
    <button 
      class="one"
      :class="{ active: activeTab === 'generateGraph' }" 
      @click="switchTab('generateGraph')"
    >
      Generate Graph
    </button>
    <button 
      class="two"
      :class="{ active: activeTab === 'statsForm' }" 
      @click="switchTab('statsForm')"
    >
      PP Stats
    </button>
  </div>
  <div class="tab-content">
    <keep-alive>
      <component :is="currentComponent" />
    </keep-alive>
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
  width: 50%;
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
  background-color: #2b81b7;
}

.tab-content {
  margin-top: 20px;
}
</style>
