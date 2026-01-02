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
      type: [Number, String],
      default: 7
    }
  },
  methods: {
    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  },
  computed: {
    chartData() {
      const today = new Date()
      let labels = []
      let cutoffTime = 0

      if (this.days === 'all') {
        const allRunDates = this.characters.flatMap(char => 
          (char.runs || []).map(run => new Date(run.completed_at).getTime())
        )

        if (allRunDates.length > 0) {
          const minTime = Math.min(...allRunDates)
          const maxTime = Math.max(...allRunDates)
          
          const startDate = new Date(minTime)
          startDate.setHours(0, 0, 0, 0)
          const endDate = new Date(maxTime)
          endDate.setHours(23, 59, 59, 999)

          const current = new Date(startDate)
          while (current <= endDate) {
            labels.push(this.formatDate(current))
            current.setDate(current.getDate() + 1)
          }
        }
      } else {
        const daysNum = parseInt(this.days)
        const cutoff = new Date()
        cutoff.setDate(today.getDate() - daysNum)
        cutoffTime = cutoff.getTime()

        for (let i = daysNum - 1; i >= 0; i--) {
          const d = new Date()
          d.setDate(today.getDate() - i)
          labels.push(this.formatDate(d))
        }
      }

      const datasets = this.characters.map(char => {
        // Filter runs for this character within time range
        const runs = char.runs || []
        const recentRuns = this.days === 'all' ? runs : runs.filter(run => new Date(run.completed_at).getTime() >= cutoffTime)
        
        // Count runs per date and store details
        const counts = {}
        const details = {}
        labels.forEach(date => {
          counts[date] = 0
          details[date] = []
        })
        
        recentRuns.forEach(run => {
          const dateStr = this.formatDate(run.completed_at)
          if (counts[dateStr] !== undefined) {
            counts[dateStr]++
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
