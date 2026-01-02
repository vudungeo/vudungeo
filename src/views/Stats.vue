<template>
  <div class="stats-page">
    <h1>Dungeon Stats- Last 10 Runs</h1>
    
    <div class="controls">
      <div class="filter-group">
        <label for="source-filter">Data Source: </label>
        <select id="source-filter" v-model="dataSource" @change="handleSourceChange">
          <option value="live">Live (Raider.io)</option>
          <option value="archive">Local Archive (SQLite)</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="time-filter">Time Period: </label>
        <select id="time-filter" v-model="selectedDays">
          <option :value="7">Last 7 Days</option>
          <option :value="30">Last 30 Days</option>
          <option :value="60">Last 60 Days</option>
          <option value="all">All Time</option>
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

      <button class="action-btn" @click="handleAction" :disabled="loading || characters.length >= 3">
        {{ characters.length >= 3 ? '⚠️ Limit Reached' : (dataSource === 'archive' ? 'Browse Archive' : 'Add Character') }}
      </button>
    </div>
    <div class="character-list">
      <div v-for="(char, index) in characters" :key="index" class="character-tag" :style="{ borderColor: char.color }">
        <div class="character-info">
          <span class="character-name" :style="{ color: char.color }">{{ char.name }} ({{ char.realm }})</span>
          <div v-if="char.score" class="score-badge">M+ Score: {{ char.score }}</div>
          <div v-if="char.lastCrawled" class="crawled-time">Crawled: {{ char.lastCrawled }}</div>
          
          <!-- Tooltip Trigger -->
          <div class="char-details-tooltip">
            <div class="tooltip-content">
              <div class="tooltip-row"><strong>Class:</strong> {{ char.class }}</div>
              <div class="tooltip-row"><strong>Race:</strong> {{ char.race }}</div>
              <div class="tooltip-row"><strong>Gender:</strong> {{ char.gender }}</div>
              <div class="tooltip-row"><strong>Faction:</strong> {{ char.faction }}</div>
            </div>
            <span class="info-circle">i</span>
          </div>

          <button v-if="dataSource === 'live'" class="archive-btn" @click="archiveCharacter(char)" :disabled="char.archived">
            {{ char.archived ? 'Archived' : 'Save to Archive' }}
          </button>
        </div>
        <button @click="removeCharacter(index)" class="remove-btn">×</button>
      </div>
    </div>

    <transition name="toast">
      <div v-if="error" class="toast-notification">
        <span class="toast-icon">⚠️</span>
        <span class="toast-message">{{ error }}</span>
        <button class="toast-close" @click="error = null">×</button>
      </div>
    </transition>
    
    <div v-if="characters.length > 0" class="stats-layout">
      <div class="chart-wrapper">
        <DungeonChart :characters="characters" :days="selectedDays" />
      </div>
      
      <transition name="badge">
        <div v-if="dataSource === 'archive'" class="archive-badge">
          <span class="badge-icon">📂</span>
          <div class="badge-content">
            <span class="badge-title">Archive Mode</span>
            <span class="badge-subtitle">Sourced from Local DB</span>
          </div>
        </div>
      </transition>
    </div>
    <div v-else>
      <p>Add a character to see stats.</p>
    </div>

    <!-- Archive Selection Modal -->
    <transition name="modal">
      <div v-if="showArchivePopup" class="modal-overlay" @click.self="showArchivePopup = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Select from Archive</h3>
            <button class="close-btn" @click="showArchivePopup = false">×</button>
          </div>
          
          <div v-if="loadingArchive" class="modal-loader">Loading saved characters...</div>
          <div v-else-if="archiveList.length === 0" class="modal-empty"> No characters found in local archive. </div>
          <div v-else class="archive-list-container">
            <table class="archive-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Realm</th>
                  <th>Region</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="char in archiveList" :key="`${char.region}-${char.realm}-${char.name}`">
                  <td>{{ char.name }}</td>
                  <td>{{ char.realm }}</td>
                  <td><span class="region-pill">{{ char.region }}</span></td>
                  <td>
                    <div class="archive-actions">
                      <button class="select-btn" @click="selectFromArchive(char)">Select</button>
                      <button class="delete-btn" @click="deleteFromArchive(char)" title="Delete from archive">🗑️</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import DungeonChart from '../components/DungeonChart.vue'
import SearchableSelect from '../components/SearchableSelect.vue'
import realmData from '../assets/realms.json'
import { REGION_OPTIONS, DEFAULT_REGION, DEFAULT_DAYS, API, LOCAL_API } from '../constants'

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
      dataSource: 'live', // 'live' or 'archive'
      errorTimeout: null,
      showArchivePopup: false,
      archiveList: [],
      loadingArchive: false
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
    showError(msg) {
      if (this.errorTimeout) clearTimeout(this.errorTimeout);
      this.error = msg;
      this.errorTimeout = setTimeout(() => {
        this.error = null;
      }, 4000);
    },
    handleAction() {
      if (this.dataSource === 'archive') {
        this.openArchivePopup();
      } else {
        this.addCharacter();
      }
    },
    async openArchivePopup() {
      if (this.characters.length >= 3) {
        this.showError('Maximum of 3 characters allowed for comparison.');
        return;
      }
      this.showArchivePopup = true;
      this.loadingArchive = true;
      try {
        const response = await fetch(`${LOCAL_API.BASE_URL}${LOCAL_API.CHARACTERS_PATH}`);
        if (!response.ok) throw new Error('Failed to fetch archive list');
        const data = await response.json();
        // Since the backend already handles uniqueness via onConflict, we just use it
        this.archiveList = data;
      } catch (e) {
        this.showError(e.message);
      } finally {
        this.loadingArchive = false;
      }
    },
    selectFromArchive(char) {
      this.newCharName = char.name;
      this.newCharRealm = char.realm;
      this.newCharRegion = char.region;
      this.showArchivePopup = false;
      this.addFromArchive();
    },
    async deleteFromArchive(char) {
      if (!confirm(`Are you sure you want to delete ${char.name} from the archive?`)) return;
      
      try {
        const url = `${LOCAL_API.BASE_URL}${LOCAL_API.CHARACTERS_PATH}/${char.region}/${char.realm}/${char.name}`;
        const response = await fetch(url, { method: 'DELETE' });
        
        if (!response.ok) throw new Error('Failed to delete character');
        
        this.showError(`Successfully deleted ${char.name} from archive.`);
        // Refresh the archive list
        const listResponse = await fetch(`${LOCAL_API.BASE_URL}${LOCAL_API.CHARACTERS_PATH}`);
        if (listResponse.ok) {
          this.archiveList = await listResponse.json();
        }
      } catch (e) {
        this.showError(e.message);
      }
    },
    getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    },
    async addCharacter() {
      if (!this.newCharName || !this.newCharRealm) {
        this.showError('Please enter both a character name and a realm.');
        return;
      }

      if (this.characters.length >= 3) {
        this.showError('Maximum of 3 characters allowed for comparison.');
        return;
      }
      
      this.error = null;
      if (this.dataSource === 'archive') {
        return this.addFromArchive();
      }

      this.loading = true;
      this.error = null;
      
      try {
        const url = `${API.BASE_URL}${API.CHARACTER_PROFILE_PATH}?region=${this.newCharRegion}&realm=${this.newCharRealm}&name=${this.newCharName}&fields=${API.FIELDS}`;
        const response = await fetch(url)
        
        if (!response.ok) {
           // Try to parse error message
           const errData = await response.json().catch(() => ({}));
           this.showError(errData.message || 'Failed to fetch character data');
           return;
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
          class: data.class,
          race: data.race,
          gender: data.gender,
          faction: data.faction,
          lastCrawled: data.last_crawled_at ? new Date(data.last_crawled_at).toLocaleString() : null,
          color: this.getRandomColor(),
          raw: data, // Keep raw data for archiving
          archived: false
        })
        
        // Reset form
        this.newCharName = '';
      } catch (e) {
        this.showError(e.message);
      } finally {
        this.loading = false
      }
    },
    async addFromArchive() {
      if (this.characters.length >= 3) {
        this.showError('Maximum of 3 characters allowed for comparison.');
        return;
      }

      this.loading = true;
      this.error = null;
      
      try {
        const url = `${LOCAL_API.BASE_URL}${LOCAL_API.CHARACTERS_PATH}/${this.newCharRegion}/${this.newCharRealm}/${this.newCharName}`;
        const response = await fetch(url);
        
        if (!response.ok) {
           const errData = await response.json().catch(() => ({}));
           this.showError(errData.message || 'Character not found in local archive');
           return;
        }
        
        const data = await response.json();
        
        // Avoid duplicates in the list
        const exists = this.characters.some(c => c.name.toLowerCase() === data.name.toLowerCase() && c.realm === data.realm);
        if (exists) {
          this.showError('Character already on display.');
          return;
        }

        this.characters.push({
          name: data.name,
          realm: data.realm,
          region: data.region,
          runs: data.raw_data.mythic_plus_recent_runs || [],
          score: data.score,
          class: data.raw_data.class,
          race: data.raw_data.race,
          gender: data.raw_data.gender,
          faction: data.raw_data.faction,
          lastCrawled: data.last_crawled_at ? new Date(data.last_crawled_at).toLocaleString() : null,
          color: this.getRandomColor(),
          archived: true
        });

        this.newCharName = '';
      } catch (e) {
        this.showError(e.message);
      } finally {
        this.loading = false;
      }
    },
    async archiveCharacter(char) {
      try {
        // Ensure we send the slug version of the realm
        const dataToSave = {
          ...char.raw,
          realm: char.realm 
        };

        const response = await fetch(`${LOCAL_API.BASE_URL}${LOCAL_API.CHARACTERS_PATH}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave)
        });
        
        if (!response.ok) throw new Error('Failed to archive character');
        
        char.archived = true;
        alert(`${char.name} saved to local archive!`);
      } catch (e) {
        this.showError(e.message);
      }
    },
    async loadArchive() {
     
      this.loading = true;
      this.error = null;
      this.characters = [];
      
      try {
        const response = await fetch(`${LOCAL_API.BASE_URL}${LOCAL_API.CHARACTERS_PATH}`);
        if (!response.ok) throw new Error('Failed to load archive');        
        const data = await response.json();
        this.characters = data.map(item => ({
          name: item.name,
          realm: item.realm,
          region: item.region,
          runs: item.raw_data.mythic_plus_recent_runs || [],
          score: item.score,
          class: item.raw_data.class,
          race: item.raw_data.race,
          gender: item.raw_data.gender,
          faction: item.raw_data.faction,
          lastCrawled: item.last_crawled_at ? new Date(item.last_crawled_at).toLocaleString() : null,
          color: this.getRandomColor(),
          archived: true
        }));
      } catch (e) {
        this.showError(e.message);
      } finally {
        this.loading = false;
      }
    },
    handleSourceChange() {
      this.characters = [];
      this.error = null;
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

.add-character-form {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr auto;
  column-gap: 15px;
  align-items: center;
  margin-bottom: 30px;
  background: #252525;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}

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
  border: 1px solid #444;
  border-left-width: 4px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  min-width: 200px;
  transition: transform 0.2s;
  position: relative; /* Needed for tooltip positioning */
}

.character-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.char-details-tooltip {
  position: absolute;
  top: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  cursor: help;
}

.info-circle {
  width: 16px;
  height: 16px;
  border: 1px solid #666;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #888;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.05);
}

.tooltip-content {
  visibility: hidden;
  position: absolute;
  bottom: 140%;
  right: 0; /* Align to the right edge of the trigger */
  background: #111;
  border: 1px solid #444;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.8);
  white-space: nowrap;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s, visibility 0.3s, transform 0.3s;
  transform: translateY(10px);
  pointer-events: none;
}

.char-details-tooltip:hover .tooltip-content {
  visibility: visible;
  opacity: 1;
  transform: translateY(0);
}

.tooltip-content::after {
  content: "";
  position: absolute;
  top: 100%;
  right: 5px; /* Align arrow with trigger on the right */
  border-width: 6px;
  border-style: solid;
  border-color: #444 transparent transparent transparent;
}

.tooltip-row {
  font-size: 0.85rem;
  margin-bottom: 6px;
  color: #ccc;
  display: flex;
  gap: 8px;
}

.tooltip-row:last-child {
  margin-bottom: 0;
}

.tooltip-row strong {
  color: #ffbd0a;
  min-width: 65px;
}

.character-info {
  display: flex;
  flex-direction: column;
  position: relative; /* Base for absolute tooltip trigger */
  padding-right: 25px; /* Make room for the trigger icon */
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
  color: #ffd700;
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

.stats-layout {
  position: relative;
  width: 100%;
  margin-top: 50px; /* Add space for the badge above the chart */
}

.chart-wrapper {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.archive-badge {
  position: absolute;
  top: -40px; /* Move it above the chart area */
  left: 50%;
  transform: translateX(-50%); /* Center horizontally */
  background: rgba(241, 196, 15, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(241, 196, 15, 0.3);
  padding: 7px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 9px;
  z-index: 10;
  pointer-events: none;
  animation: slideInDown 0.5s ease-out;
  width: fit-content;
  white-space: nowrap;
}

.badge-icon {
  font-size: 1.08rem;
}

.badge-content {
  display: flex;
  flex-direction: column;
}

.badge-title {
  color: #f1c40f;
  font-weight: 700;
  font-size: 0.67rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.58rem;
}

@keyframes slideInDown {
  from {
    transform: translate(-50%, -10px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

/* Badge Transition */
.badge-enter-active,
.badge-leave-active {
  transition: all 0.3s ease;
}

.badge-enter-from,
.badge-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.toast-notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: #1a1a1a;
  border-left: 4px solid #ff6b6b;
  color: #eee;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
  min-width: 300px;
  max-width: 450px;
}

.toast-icon {
  font-size: 1.2rem;
}

.toast-message {
  flex-grow: 1;
  font-size: 0.95rem;
  line-height: 1.4;
}

.toast-close {
  background: transparent;
  border: none;
  color: #666;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.toast-close:hover {
  color: #fff;
}

/* Toast Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-enter-from {
  transform: translateX(100px);
  opacity: 0;
}

.toast-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  background: #1a1a1a;
  border: 1px solid #333;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #ffbd0a;
}

.close-btn {
  background: transparent;
  border: none;
  color: #666;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: #fff;
}

.archive-list-container {
  overflow-y: auto;
  padding: 0 20px 20px;
}

.archive-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.archive-table th {
  text-align: left;
  padding: 12px;
  color: #888;
  font-size: 0.8rem;
  text-transform: uppercase;
  border-bottom: 1px solid #333;
}

.archive-table td {
  padding: 12px;
  border-bottom: 1px solid #222;
}

.region-pill {
  background: #333;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #aaa;
}

.select-btn {
  background: #ffbd0a;
  color: #000;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.85rem;
}

.select-btn:hover {
  background: #e5a900;
}

.archive-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.delete-btn {
  background: transparent;
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.delete-btn:hover {
  background: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
  transform: scale(1.05);
}

.modal-loader, .modal-empty {
  padding: 60px;
  text-align: center;
  color: #666;
}

/* Modal Animations */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content, .modal-leave-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-enter-from .modal-content {
  transform: scale(0.9);
}

.modal-leave-to .modal-content {
  transform: scale(0.95);
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

.archive-btn {
  margin-top: 8px;
  background: #2e7d32;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}

.archive-btn:hover:not(:disabled) {
  background: #388e3c;
}

.archive-btn:disabled {
  background: #444;
  color: #888;
  cursor: default;
}

#source-filter {
  padding: 8px 12px;
  background: #2c3e50;
  border: 1px solid #34495e;
  color: #ecf0f1;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
}

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
