<template>
  <div class="stats-config">
    <p style="text-align: center;">Adjust the PP range and threshold to study the calculators' performances.</p>
    
    <div class="dropdown-container">
      <label for="pp-range">Select PP Range:</label>
      <select 
        :value="selectedRange.label"  
        id="pp-range"
        @change="handleRangeChange($event)"
      >
        <option 
          v-for="range in ppRanges" 
          :value="range.label"
          :key="range.label"
        >
          {{ range.label }}
        </option>
      </select>
    </div>

    <div class="range-slider">
      <label>Error threshold: {{ errorThreshold }}</label>
      <v-slider
        :value="errorThreshold"
        :max="800"
        :min="200"
        :step="200"
        strict
        @update:model-value="$emit('update:errorThreshold', $event)"
      ></v-slider>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  selectedRange: Object,
  errorThreshold: Number,
  ppRanges: Array
})

const emit = defineEmits(['update:selectedRange', 'update:errorThreshold'])

function handleRangeChange(event) {
  const selectedLabel = event.target.value
  const selectedRange = props.ppRanges.find(range => range.label === selectedLabel)
  emit('update:selectedRange', selectedRange)
}
</script>

<style scoped>
.stats-config {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  width: 100%;
}

.range-slider {
  width: max(15%, 200px);
}

.dropdown-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

#pp-range {
  width: 150px;
  padding: 8px;
  font-size: 1rem;
  border: 1px solid #ccc;
  background-color: #2b81b7;
  border-radius: 4px;
}
</style>