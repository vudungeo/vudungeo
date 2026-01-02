<template>
  <div class="logs-page">
    <h1>Application Logs</h1>
    
    <div class="controls">
      <div class="filter-group">
        <label>From:</label>
        <input type="datetime-local" v-model="filters.from" />
      </div>
      <div class="filter-group">
        <label>To:</label>
        <input type="datetime-local" v-model="filters.to" />
      </div>
      <button @click="fetchLogs" :disabled="loading" class="refresh-btn">
        {{ loading ? 'Loading...' : 'Refresh Logs' }}
      </button>
      <button @click="goHome" class="back-btn">Back Home</button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="table-container">
      <table v-if="logs.length > 0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Message</th>
            <th>Details</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id" :class="getRowClass(log.log_type)">
            <td>{{ log.id }}</td>
            <td>
              <span class="badge" :class="log.log_type.toLowerCase()">{{ log.log_type }}</span>
            </td>
            <td class="message-cell">{{ log.message }}</td>
            <td class="details-cell">
              <pre v-if="log.details">{{ JSON.stringify(log.details, null, 2) }}</pre>
              <span v-else class="text-muted">-</span>
            </td>
            <td>{{ formatDate(log.created_at) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else-if="!loading" class="no-data">
        No logs found for the selected criteria.
      </div>
    </div>
  </div>
</template>

<script>
import { LOCAL_API } from '../constants';

export default {
  name: 'Logs',
  data() {
    return {
      logs: [],
      loading: false,
      error: null,
      filters: {
        from: '',
        to: ''
      }
    };
  },
  mounted() {
    this.fetchLogs();
  },
  methods: {
    async fetchLogs() {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams();
        if (this.filters.from) params.append('from', new Date(this.filters.from).toISOString());
        if (this.filters.to) params.append('to', new Date(this.filters.to).toISOString());

        // Note: Using the local proxy setup in vite.config.js which points /local -> http://localhost:3000
        const response = await fetch(`${LOCAL_API.BASE_URL}/api/v1/logs?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        this.logs = await response.json();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleString();
    },
    getRowClass(type) {
      return `row-${type.toLowerCase()}`;
    },
    goHome() {
      this.$router.push('/');
    }
  }
};
</script>

<style scoped>
.logs-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: #fff;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.controls {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 20px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

input {
  background: #333;
  border: 1px solid #555;
  color: white;
  padding: 8px;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px;
  font-weight: bold;
}

.refresh-btn {
  background-color: #4CAF50;
  border: none;
  color: white;
}

.refresh-btn:hover {
  background-color: #45a049;
}

.refresh-btn:disabled {
  background-color: #666;
  cursor: not-allowed;
}

.back-btn {
  background-color: transparent;
  border: 1px solid #888;
  color: #ccc;
}

.back-btn:hover {
  border-color: #fff;
  color: #fff;
}

.error-message {
  color: #ff5555;
  text-align: center;
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(255, 0, 0, 0.1);
  border-radius: 4px;
}

.table-container {
  overflow-x: auto;
  background: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #333;
}

th {
  background-color: #252525;
  color: #aaa;
  font-weight: 600;
  white-space: nowrap;
}

tr:hover {
  background-color: #2a2a2a;
}

.message-cell {
  max-width: 300px;
  word-wrap: break-word;
}

.details-cell pre {
  margin: 0;
  font-size: 0.8rem;
  color: #aaa;
  max-width: 300px;
  overflow-x: auto;
  background: rgba(0,0,0,0.2);
  padding: 4px;
  border-radius: 2px;
}

.text-muted {
  color: #666;
  font-style: italic;
}

.badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: bold;
}

.badge.error { background-color: #ff4444; color: white; }
.badge.warning { background-color: #ffbb33; color: black; }
.badge.info { background-color: #33b5e5; color: white; }

.row-error { border-left: 3px solid #ff4444; }
.row-warning { border-left: 3px solid #ffbb33; }
.row-info { border-left: 3px solid #33b5e5; }

.no-data {
  text-align: center;
  padding: 30px;
  color: #888;
}
</style>
