<template>
    <div class="graph-container">
      <div v-if="loading" class="loading-spinner">Loading...</div>
      <iframe
        v-if="url"
        :src="url"
        :key="key"
        width="100%"
        height="700"
        frameborder="0"
        @load="onLoad"
      ></iframe>
      <h2> {{ title }} </h2>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue'
  
  const props = defineProps({
    url: {
      type: String,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    title : {
      type: String,
      default: ''
    }
  })
  
  const emit = defineEmits(['update:loading'])
  
  // Key to force iframe reload
  const key = ref(0)
  
  function onLoad() {
    emit('update:loading', false) // Notify parent that loading has finished
  }
  
  // Watch for URL changes and force reload
  watch(() => props.url, (newUrl, oldUrl) => {
    if (newUrl !== oldUrl) {
      emit('update:loading', true) // Reset loading on new request
      key.value += 1
    }
  })
  </script>
  
  <style scoped>
  .graph-container {
    width: 90%;
    margin: 0 auto;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .loading-spinner {
  font-size: 1.2rem;
  color: #3a9ad9;
  margin: 20px;
  text-align: center;
  }
  
  </style>
  