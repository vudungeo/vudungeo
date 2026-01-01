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
