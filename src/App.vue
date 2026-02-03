<template>
  <div class="power-bank-container">
    <!-- NFC Reader Section -->

    <!-- Battery Level Indicator -->
    <div class="battery-level-container">
      <svg class="battery-circle" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
        <circle
          class="battery-circle-bg"
          cx="100"
          cy="100"
          r="80"
        />
        <circle
          class="battery-circle-progress"
          cx="100"
          cy="100"
          r="80"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashoffset"
        />
      </svg>
      <div class="battery-level-text">
        <div class="battery-percentage">{{ batteryInfo.level }}%</div>
        <div class="battery-status">
          <span 
            class="status-indicator" 
            :class="{
              'status-active': batteryInfo.status === 'charging',
              'status-idle': batteryInfo.status === 'idle',
              'status-error': batteryInfo.status === 'error'
            }"
          ></span>
          {{ batteryStatusText }}
        </div>
      </div>
    </div>

    <!-- Basic Info Card -->
    <div class="info-card">
      <h2>基本信息</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">充电宝状态</div>
          <div class="info-value">{{ batteryStatusText }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">电池容量</div>
          <div class="info-value">{{ batteryInfo.capacity }}<span class="info-unit">mAh</span></div>
        </div>
        <div class="info-item">
          <div class="info-label">循环次数</div>
          <div class="info-value">{{ batteryInfo.cycles }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">健康状态</div>
          <div class="info-value" :class="{
            'health-good': batteryInfo.health >= 80,
            'health-fair': batteryInfo.health >= 60 && batteryInfo.health < 80,
            'health-poor': batteryInfo.health < 60
          }">
            {{ batteryInfo.health }}%
          </div>
        </div>
      </div>
    </div>

    <!-- Battery Parameters Card -->
    <div class="info-card">
      <h2>电池参数</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">当前电压</div>
          <div class="info-value">{{ batteryInfo.voltage }}<span class="info-unit">V</span></div>
        </div>
        <div class="info-item">
          <div class="info-label">当前电流</div>
          <div class="info-value">{{ batteryInfo.current }}<span class="info-unit">A</span></div>
        </div>
        <div class="info-item">
          <div class="info-label">温度</div>
          <div class="info-value">{{ batteryInfo.temperature }}<span class="info-unit">°C</span></div>
        </div>
      </div>
    </div>

    <!-- More Info Card -->
    <div class="info-card">
      <h2>更多信息</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">充电阈值</div>
          <div class="info-value">{{ batteryInfo.chargeThreshold }}<span class="info-unit">%</span></div>
        </div>
        <div class="info-item">
          <div class="info-label">放电阈值</div>
          <div class="info-value">{{ batteryInfo.dischargeThreshold }}<span class="info-unit">%</span></div>
        </div>
        <div class="info-item">
          <div class="info-label">最大电压</div>
          <div class="info-value">{{ batteryInfo.maxVoltage }}<span class="info-unit">V</span></div>
        </div>
        <div class="info-item">
          <div class="info-label">最小电压</div>
          <div class="info-value">{{ batteryInfo.minVoltage }}<span class="info-unit">V</span></div>
        </div>
        <div class="info-item">
          <div class="info-label">最大温度</div>
          <div class="info-value">{{ batteryInfo.maxTemperature }}<span class="info-unit">°C</span></div>
        </div>
        <div class="info-item">
          <div class="info-label">最小温度</div>
          <div class="info-value">{{ batteryInfo.minTemperature }}<span class="info-unit">°C</span></div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      Giantec Demo
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { readNFCContinuous } from './components/nfc.js'
import { generateMockData, parseBatteryData } from './utils/praser.js'

export default {
  name: 'App',
  setup() {
    const status = ref('idle')
    const statusText = ref('点击按钮开始读取NFC标签')
    const isReading = ref(false)
    const ndefMessage = ref(null)
    const cardPresent = ref(false)
    let nfcWatcher = null

    // Battery information
    const batteryInfo = ref({
      level: 0,
      status: 'idle', // charging, idle, error
      capacity: 0,
      cycles: 0,
      health: 0,
      voltage: 0.0,
      current: 0.0,
      temperature:0,
      chargeThreshold: 0,
      dischargeThreshold: 0,
      maxVoltage: 0.0,
      minVoltage: 0.0,
      maxTemperature: 0,
      minTemperature: 0
    })

    // Calculate battery circle
    const circumference = computed(() => 2 * Math.PI * 65)
    const dashoffset = computed(() => {
      const percentage = batteryInfo.value.level
      return circumference.value * (1 - percentage / 100)
    })

    const batteryStatusText = computed(() => {
      const status = batteryInfo.value.status
      switch (status) {
        case 'charging':
        case '充电':
          return '充电中'
        case 'idle':
        case '待机':
          return '空闲'
        case 'discharging':
        case '放电':
          return '放电中'
        case 'error':
        case '异常':
          return '异常'
        default:
          return '未知'
      }
    })

    // 更新电池信息
    const updateBatteryInfo = (data) => {
      batteryInfo.value = {
        level: data.level || batteryInfo.value.level,
        status: data.status || batteryInfo.value.status,
        capacity: data.capacity || batteryInfo.value.capacity,
        cycles: data.cycles || batteryInfo.value.cycles,
        health: data.health || batteryInfo.value.health,
        voltage: data.totalVoltage || data.voltage || batteryInfo.value.voltage,
        current: data.current || batteryInfo.value.current,
        temperature: data.temperature || batteryInfo.value.temperature,
        chargeThreshold: data.chargeThreshold || batteryInfo.value.chargeThreshold,
        dischargeThreshold: data.dischargeThreshold || batteryInfo.value.dischargeThreshold,
        maxVoltage: data.maxVoltage || batteryInfo.value.maxVoltage,
        minVoltage: data.minVoltage || batteryInfo.value.minVoltage,
        maxTemperature: data.maxTemperature || batteryInfo.value.maxTemperature,
        minTemperature: data.minTemperature || batteryInfo.value.minTemperature
      }
    }

    const startNFC = async () => {
      try {
        status.value = 'loading'
        statusText.value = '正在初始化NFC...'
        isReading.value = true

        const result = readNFCContinuous((message) => {
          ndefMessage.value = message
          status.value = 'ready'
          statusText.value = '成功读取NDEF消息'
        }, updateBatteryInfo, () => {
          // 卡片丢失回调
          console.log('NFC卡片已移除')
          status.value = 'idle'
          statusText.value = 'NFC标签已移除，请重新靠近'
          cardPresent.value = false
        })

        nfcWatcher = result
        status.value = 'ready'
        statusText.value = 'NFC已就绪，请将标签靠近设备'
      } catch (error) {
        console.error('NFC初始化失败:', error)
        status.value = 'error'
        statusText.value = `错误: ${error.message}`
        isReading.value = false
      }
    }

    const stopNFC = () => {
      if (nfcWatcher) {
        nfcWatcher.stop()
        nfcWatcher = null
      }
      status.value = 'idle'
      statusText.value = '点击按钮开始读取NFC标签'
      isReading.value = false
      ndefMessage.value = null
      cardPresent.value = false
    }

    // 检查浏览器是否支持NFC
    const checkNFCSupport = () => {
      if (!('NDEFReader' in window)) {
        alert('您的浏览器不支持Web NFC API，请使用Chrome浏览器访问')
        return false
      }
      return true
    }

    // 从URL参数中获取充电宝数据
    const loadFromURL = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const pwrbkdata = urlParams.get('pwrbkdata')
      
      if (pwrbkdata) {
        try {
          const batteryData = parseBatteryData(pwrbkdata)
          updateBatteryInfo(batteryData)
          console.log('从URL加载充电宝数据:', batteryData)
          statusText.value = '已从URL加载充电宝数据'
          return true
        } catch (error) {
          console.error('解析URL数据失败:', error)
          statusText.value = '解析URL数据失败'
        }
      }
      return false
    }

    // 初始化
    onMounted(() => {
      // 首先尝试从URL加载数据
      if (!loadFromURL()) {
        // 如果URL中没有数据，检查NFC支持并自动启动
        if (checkNFCSupport()) {
          startNFC()
        }
      }
    })

    onUnmounted(() => {
      if (nfcWatcher) {
        nfcWatcher.remove()
      }
    })

    return {
      status,
      statusText,
      isReading,
      ndefMessage,
      cardPresent,
      startNFC,
      stopNFC,
      batteryInfo,
      circumference,
      dashoffset,
      batteryStatusText
    }
  }
}
</script>

<style scoped>
/* 组件特定样式已在全局style.css中定义 */
</style>