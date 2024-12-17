<template>
    <div class="distribution-section">
      <PPDistributionGraph 
        v-if="!loading && !error && distributionData"
        :distribution-data="distributionData"
      />
      <div v-if="error" class="m-container error-message">
        <h2>{{ error }}</h2>
      </div>
      <div v-if="loading" class="m-container loading-400">
        <h2>Loading...</h2>
      </div>
    </div>
  </template>


<script setup>
import PPDistributionGraph from './PPDistributionGraph.vue'

defineProps({
  distributionData: Object,
  error: String,
  loading: Boolean
})
</script>


<style scoped>
.distribution-section {
  width: 100%;
}
</style>  