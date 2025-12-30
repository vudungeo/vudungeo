<template>
  <div class="chart-container">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script>
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default {
  name: 'DungeonChart',
  components: { Bar },
  props: {
    characters: {
      type: Array,
      required: true
    },
    days: {
      type: Number,
      default: 7
    }
  },
  computed: {
    chartData() {
      // Get all unique dates from all characters' runs
      const allDates = new Set()
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - this.days)
      const cutoffTime = cutoff.getTime()

      // Generate date labels for the selected range (last N days)
      const labels = []
      const today = new Date()
      for (let i = this.days - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(today.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        labels.push(dateStr)
      }

      const datasets = this.characters.map(char => {
        // Filter runs for this character within time range
        const recentRuns = (char.runs || []).filter(run => new Date(run.completed_at).getTime() >= cutoffTime)
        
        // Count runs per date and store details
        const counts = {}
        const details = {}
        labels.forEach(date => {
          counts[date] = 0
          details[date] = []
        })
        
        recentRuns.forEach(run => {
          const dateStr = new Date(run.completed_at).toISOString().split('T')[0]
          if (counts[dateStr] !== undefined) {
            counts[dateStr]++
            // Access nested dungeon properties correctly: run.dungeon is the name, run.mythic_level is the level
            // Based on Raider.IO API structure: run.dungeon (string), run.mythic_level (number)
            details[dateStr].push(`${run.short_name || run.dungeon} +${run.mythic_level}`)
          }
        })

        return {
          label: `${char.name} - ${char.realm}`,
          backgroundColor: char.color,
          data: labels.map(date => counts[date]),
          // Attach details to the dataset for the tooltip to access
          runDetails: labels.map(date => details[date])
        }
      })

      return {
        labels,
        datasets
      }
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Completed Dungeon Count',
              color: '#888',
              font: {
                size: 14,
                weight: '600'
              }
            },
            ticks: {
              precision: 0,
              color: '#888'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#888'
            },
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: '#ccc'
            }
          },
          tooltip: {
            callbacks: {
              afterBody: (context) => {
                const dataIndex = context[0].dataIndex;
                const dataset = context[0].dataset;
                const details = dataset.runDetails[dataIndex];
                
                if (details && details.length > 0) {
                  return details;
                }
                return [];
              }
            }
          }
        }
      }
    }
  }
}
</script>

<style scoped>
.chart-container {
  height: 400px;
  width: 100%;
}
</style>
