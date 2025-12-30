<template>
  <div class="stats-page">
    <h1>Dungeon Stats</h1>
    
    <div class="controls">
      <div class="filter-group">
        <label for="time-filter">Time Period: </label>
        <select id="time-filter" v-model="selectedDays">
          <option :value="7">Last 7 Days</option>
          <option :value="30">Last 30 Days</option>
          <option :value="60">Last 60 Days</option>
        </select>
      </div>
      <button class="secondary-btn" @click="$router.push('/')">Back to Home</button>
    </div>

    <div class="add-character-form">
      <input v-model="newCharName" placeholder="Character Name" class="name-input" />
      
      <SearchableSelect 
        v-model="newCharRegion" 
        :options="regionOptions" 
        placeholder="Region"
        class="region-select"
      />
      
      <SearchableSelect 
        v-model="newCharRealm" 
        :options="realmOptions" 
        placeholder="Realm"
        class="realm-select"
      />

      <button class="action-btn" @click="addCharacter" :disabled="loading">Add Character</button>
    </div>

    <div class="character-list">
      <div v-for="(char, index) in characters" :key="index" class="character-tag" :style="{ borderColor: char.color }">
        <div class="character-info">
          <span class="character-name" :style="{ color: char.color }">{{ char.name }} ({{ char.realm }})</span>
          <div v-if="char.score" class="score-badge">M+ Score: {{ char.score }}</div>
          <div v-if="char.lastCrawled" class="crawled-time">Crawled: {{ char.lastCrawled }}</div>
        </div>
        <button @click="removeCharacter(index)" class="remove-btn">×</button>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    
    <div v-if="characters.length > 0">
      <DungeonChart :characters="characters" :days="selectedDays" />
      
    </div>
    <div v-else>
      <p>Add a character to see stats.</p>
    </div>
  </div>
</template>

<script>
import DungeonChart from '../components/DungeonChart.vue'
import SearchableSelect from '../components/SearchableSelect.vue'
import realmData from '../assets/realms.json'
import { REGION_OPTIONS, DEFAULT_REGION, DEFAULT_DAYS, API } from '../constants'

export default {
  name: 'Stats',
  components: { DungeonChart, SearchableSelect },
  data() {
    return {
      characters: [], 
      newCharName: '',
      newCharRealm: '',
      newCharRegion: DEFAULT_REGION,
      loading: false,
      error: null,
      selectedDays: DEFAULT_DAYS,
      allRealms: realmData,
    }
  },
  computed: {
    regionOptions() {
      return REGION_OPTIONS;
    },
    realmOptions() {
      const region = this.newCharRegion;
      const list = this.allRealms[region] || [];
      return list.map(r => {
        // Handle localized name object or string
        let name = r.name;
        if (typeof name === 'object') {
          name = name.en_US || name.en_GB || Object.values(name)[0];
        }
        return { label: name, value: r.slug };
      });
    }
  },
  watch: {
    newCharRegion() {
      // Reset realm when region changes to verify validity
    }
  },
  methods: {
    getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    },
    async addCharacter() {
      if (!this.newCharName || !this.newCharRealm) return;
      
      this.loading = true;
      this.error = null;
      
      try {
        const url = `${API.BASE_URL}${API.CHARACTER_PROFILE_PATH}?region=${this.newCharRegion}&realm=${this.newCharRealm}&name=${this.newCharName}&fields=${API.FIELDS}`;
        const response = await fetch(url)
        
        if (!response.ok) {
           // Try to parse error message
           const errData = await response.json().catch(() => ({}));
           throw new Error(errData.message || 'Failed to fetch character data');
        }
        
        const data = await response.json();
        
        // Extract score if available
        let score = 0;
        if (data.mythic_plus_scores_by_season && data.mythic_plus_scores_by_season.length > 0) {
          score = data.mythic_plus_scores_by_season[0].scores.all;
        }

        this.characters.push({
          name: data.name,
          realm: this.newCharRealm,
          region: this.newCharRegion,
          runs: data.mythic_plus_recent_runs || [],
          score: score,
          lastCrawled: data.last_crawled_at ? new Date(data.last_crawled_at).toLocaleString() : null,
          color: this.getRandomColor()
        })
        
        // Reset form
        this.newCharName = '';
        // Keep realm/region as user might want to add alt from same realm
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },
    removeCharacter(index) {
      this.characters.splice(index, 1);
    }
  }
}
</script>

<style scoped>
.stats-page {
  padding: 40px;
  max-width: 1000px;
  margin: 0 auto;
  color: #fff;
  font-family: 'Inter', sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 40px;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #eee 0%, #aaa 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Header Controls Area */
.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 1.1rem;
}

/* Form Area - Horizontal Grid Layout */
.add-character-form {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr auto; /* Explicit horizontal columns */
  column-gap: 15px; /* Spacing between columns */
  align-items: center;
  margin-bottom: 30px;
  background: #252525;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}

/* Items fill their grid cells */
.name-input {
  width: 100%;
  height: 48px;
  padding: 0 12px;
  font-size: 1rem;
  box-sizing: border-box;
  border-radius: 6px;
  border: 1px solid #444;
  background: #1e1e1e;
  color: #eee;
}

.name-input:focus {
  outline: none;
  border-color: #666;
}

.region-select {
  width: 100%;
  position: relative;
  z-index: 10;
}

.realm-select {
  width: 100%;
  position: relative;
  z-index: 10;
}

.action-btn {
  height: 48px;
  /* ... existing styles ... */
  white-space: nowrap;
  /* ... existing styles ... */
  padding: 0 24px;
  background: linear-gradient(135deg, #4a6fa5 0%, #3d5a80 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 111, 165, 0.4);
}

.secondary-btn {
  background: #333;
  color: #ccc;
  border: 1px solid #444;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: #444;
  color: #fff;
}

/* Character List */
.character-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 30px;
}

.character-tag {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 10px 16px;
  background: #2a2a2a;
  border: 1px solid #444; /* Default border */
  border-left-width: 4px; /* Emphasis border */
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  min-width: 200px;
  transition: transform 0.2s;
}

.character-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.character-info {
  display: flex;
  flex-direction: column;
}

.character-name {
  font-weight: 700;
  font-size: 1.05rem;
}

.score-badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  background: rgba(0,0,0,0.3);
  border-radius: 4px;
  font-size: 0.85rem;
  color: #ffd700; /* Gold */
  font-weight: 600;
  letter-spacing: 0.5px;
}

.crawled-time {
  font-size: 0.75rem;
  color: #888;
  margin-top: 4px;
  font-style: italic;
}

.remove-btn {
  background: transparent;
  border: none;
  color: #666;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.2s;
}

.remove-btn:hover {
  color: #ff6b6b;
}

.error {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid #ff6b6b;
  color: #ff6b6b;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

#time-filter {
  padding: 8px 12px;
  background: #1e1e1e;
  border: 1px solid #444;
  color: #eee;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}



/* Responsive adjustments */
@media (max-width: 768px) {
  .add-character-form {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .controls {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
}
</style>
