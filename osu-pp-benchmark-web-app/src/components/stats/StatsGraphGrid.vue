<template>
    <div class="graph-container-grid">
      <div class="graph-wrapper">
        <ErrorStatsGraph
          v-if="!errorStatsLoading && !errorStatsError && errorStatsData"
          :error-stats-graph-data="errorStatsData"
          title="Error Statistics"
        />
        <div v-if="errorStatsError" class="m-container error-message">
          <h2>{{ errorStatsError }}</h2>
        </div>
        <div v-if="errorStatsLoading" class="m-container loading">
          <h2>Loading...</h2>
        </div>
      </div>
  
      <div class="graph-wrapper">
        <OutliersGraph
          v-if="!outliersLoading && !outliersError && outliersData"
          :outliers-graph-data="outliersData"
          title="Outliers"
        />
        <div v-if="outliersError" class="m-container error-message">
          <h2>{{ outliersError }}</h2>
        </div>
        <div v-if="outliersLoading" class="m-container loading">
          <h2>Loading...</h2>
        </div>
      </div>
    </div>
  </template>


<script setup>
import ErrorStatsGraph from './ErrorStatsGraph.vue'
import OutliersGraph from './OutliersGraph.vue'

defineProps({
  errorStatsData: Object,
  outliersData: Object,
  errorStatsLoading: Boolean,
  outliersLoading: Boolean,
  errorStatsError: String,
  outliersError: String
})
</script>

<style scoped>
.graph-container-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.graph-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.m-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.error-message {
  font-size: 1.5rem;
  color: red;
}

.loading {
  font-size: 1.5rem;
  color: #3a9ad9;
}


@media (max-width: 768px) {
  .graph-container-grid {
    grid-template-columns: 1fr;
  }
}
</style>
