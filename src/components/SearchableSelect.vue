<template>
  <div class="searchable-select" :class="{ 'is-open': isOpen }" ref="container" @click.stop>
    <div class="select-input" @click="toggleDropdown">
      <div v-if="!isOpen" class="display-value">
        <span v-if="selectedLabel" class="selected-text">{{ selectedLabel }}</span>
        <span v-else class="placeholder-text">{{ placeholder }}</span>
      </div>
      <input 
        v-else
        v-model="search" 
        :placeholder="placeholder"
        @focus="isOpen = true"
        @input="onSearch"
        @click.stop
        ref="input"
      />
      <span class="arrow" :class="{ open: isOpen }">▼</span>
    </div>
    
    <div v-if="isOpen" class="options-menu">
      <div 
        v-for="option in filteredOptions" 
        :key="option.value" 
        class="option-item"
        @click="selectOption(option)"
      >
        {{ option.label }}
      </div>
      <div v-if="filteredOptions.length === 0" class="no-options">
        No matches found
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SearchableSelect',
  props: {
    options: {
      type: Array,
      required: true,
      // Expects array of { label: string, value: any }
    },
    modelValue: {
      required: true
    },
    placeholder: {
      type: String,
      default: 'Select...'
    }
  },
  data() {
    return {
      isOpen: false,
      search: ''
    }
  },
  computed: {
    filteredOptions() {
      if (!this.search) return this.options;
      const term = this.search.toLowerCase();
      return this.options.filter(opt => 
        opt.label.toLowerCase().includes(term)
      );
    },
    selectedLabel() {
      const selected = this.options.find(opt => opt.value === this.modelValue);
      return selected ? selected.label : '';
    }
  },
  watch: {
    modelValue(val) {
        // If value changes externally, clear search to show proper placeholder/value
        // this.search = '';
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    toggleDropdown() {
      if (this.isOpen) {
        this.isOpen = false;
      } else {
        this.isOpen = true;
        this.$nextTick(() => {
          if (this.$refs.input) {
            this.$refs.input.focus();
          }
        });
      }
    },
    selectOption(option) {
      this.$emit('update:modelValue', option.value);
      this.search = ''; // Clear search on select so the placeholder (selectedLabel) shows
      this.isOpen = false;
    },
    onSearch() {
        this.isOpen = true;
    },
    handleClickOutside(e) {
      if (this.$refs.container && !this.$refs.container.contains(e.target)) {
        this.isOpen = false;
        // Reset search if closed without selecting to avoid confusion
        this.search = ''; 
      }
    }
  }
}
</script>

<style scoped>
.searchable-select {
  position: relative;
  width: 100%; /* Fill parent container */
  font-family: inherit;
  z-index: 1;
}

.searchable-select.is-open {
  z-index: 1000;
}

.select-input {
  position: relative;
  cursor: text;
}

.display-value {
  width: 100%;
  height: 48px;
  padding: 0 30px 0 12px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #1e1e1e;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.selected-text {
  color: hsl(143, 100%, 65%); /* Neon yellow for selected values */
  font-weight: 600;
  font-size: 1rem;
}

.placeholder-text {
  color: #888; /* Gray for placeholder */
  font-size: 1rem;
  font-style: italic;
}

.select-input input {
  width: 100%;
  height: 48px;
  padding: 0 30px 0 12px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #1e1e1e;
  color: #eee;
  font-size: 1rem;
  box-sizing: border-box;
}

.select-input input:focus {
  outline: none;
  border-color: #666;
}

.arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8em;
  color: #888;
  pointer-events: none;
  transition: transform 0.2s;
}

.arrow.open {
  transform: translateY(-50%) rotate(180deg);
}

.options-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 250px;
  overflow-y: auto;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  margin-top: 4px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.option-item {
  padding: 8px 12px;
  cursor: pointer;
  color: #ddd;
  transition: background 0.1s;
}

.option-item:hover {
  background: #444;
  color: #fff;
}

.no-options {
  padding: 8px 12px;
  color: #888;
  font-style: italic;
}

/* Scrollbar styling */
.options-menu::-webkit-scrollbar {
  width: 8px;
}
.options-menu::-webkit-scrollbar-track {
  background: #2a2a2a;
}
.options-menu::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}
.options-menu::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>
