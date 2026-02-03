/**
 * NFC 处理模块
 * 用于读取和解析NDEF消息
 */
import { parseBatteryData } from '../utils/praser.js'

export async function readNFC(callback, batteryCallback) {
  // 检查浏览器是否支持Web NFC API
  if (!('NDEFReader' in window)) {
    throw new Error('您的浏览器不支持Web NFC API，请使用Chrome浏览器')
  }

  try {
    const reader = new NDEFReader()
    
    // 开始扫描NFC标签
    await reader.scan()
    
    console.log('NFC扫描已启动，请将标签靠近设备')
    
    // 监听NFC标签读取事件
    reader.addEventListener('reading', (event) => {
      console.log('读取到NFC标签:', event)
      
      try {
        const message = event.message
        const decodedMessage = decodeNDEFMessage(message)
        callback(decodedMessage)
        // 尝试解析充电宝数据（第二条消息）
        try {
          const batteryData = parseNDEFMessageForBattery(message)
          if (batteryData && batteryCallback) {
            batteryCallback(batteryData)
          }
        } catch (error) {
          console.error('解析充电宝数据失败:', error)
        }
      } catch (error) {
        console.error('解析NDEF消息失败:', error)
        callback(`解析错误: ${error.message}`)
      }
    })
    
    // 监听错误事件
    reader.addEventListener('error', (event) => {
      console.error('NFC读取错误:', event)
      throw new Error('NFC读取过程中发生错误')
    })
    
    return {
      watcher: reader
    }
  } catch (error) {
    console.error('启动NFC扫描失败:', error)
    throw error
  }
}

/**
 * 持续读取NFC消息
 * @param {Function} callback - 消息回调函数
 * @param {Function} batteryCallback - 电池数据回调函数
 * @param {Function} onLost - 卡片丢失回调函数
 * @returns {Object} - 包含停止函数的对象
 */
export async function readNFCContinuous(callback, batteryCallback, onLost) {
  // 检查浏览器是否支持Web NFC API
  if (!('NDEFReader' in window)) {
    throw new Error('您的浏览器不支持Web NFC API，请使用Chrome浏览器')
  }

  let isReading = true
  let lastReadTime = 0
  let cardPresent = false
  let reader = null

  const stopReading = () => {
    isReading = false
    if (reader) {
      try {
        reader.stop()
      } catch (error) {
        console.error('停止NFC读取失败:', error)
      }
    }
  }

  const readLoop = async () => {
    while (isReading) {
      try {
        if (!reader) {
          reader = new NDEFReader()
          await reader.scan()
          console.log('NFC扫描已启动，请将标签靠近设备')
        }

        // 设置读取超时
        const readPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('读取超时'))
          }, 1500)

          reader.once('reading', (event) => {
            clearTimeout(timeout)
            resolve(event)
          })

          reader.once('error', (error) => {
            clearTimeout(timeout)
            reject(error)
          })
        })

        try {
          const event = await readPromise
          const currentTime = Date.now()
          
          // 检查是否是新数据（至少间隔1秒）
          if (currentTime - lastReadTime >= 1000) {
            lastReadTime = currentTime
            
            if (!cardPresent) {
              cardPresent = true
              console.log('检测到NFC标签')
            }

            try {
              const record = event.message.records[1]
              const decodedMessage = decodeNDEFMessage(record)
              callback(decodedMessage)
              
              // 尝试解析充电宝数据（第二条消息）
              try {
                const batteryData = parseNDEFMessageForBattery(record)
                if (batteryData && batteryCallback) {
                  batteryCallback(batteryData)
                }
              } catch (error) {
                console.error('解析充电宝数据失败:', error)
              }
            } catch (error) {
              console.error('解析NDEF消息失败:', error)
              callback(`解析错误: ${error.message}`)
            }
          }
        } catch (error) {
          // 读取超时或错误，可能是卡片丢失
          if (cardPresent) {
            cardPresent = false
            console.log('NFC标签丢失')
            if (onLost) {
              onLost()
            }
          }
          // 重新启动扫描
          reader = null
        }
      } catch (error) {
        console.error('读取循环错误:', error)
        if (cardPresent) {
          cardPresent = false
          console.log('NFC标签丢失')
          if (onLost) {
            onLost()
          }
        }
        // 重新启动扫描
        reader = null
      }

      // 等待1秒后继续下一次读取
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // 启动读取循环
  readLoop()

  return {
    stop: stopReading
  }
}

/**
 * 解码NDEF消息
 * @param {NDEFMessage} message - NDEF消息对象
 * @returns {string} - 解码后的消息内容
 */
function decodeNDEFMessage(message) {
  let result = ''
  
  message.records.forEach((record, index) => {
    result += `记录 ${index + 1}:\n`
    result += `  类型: ${record.recordType}\n`
    result += `  MIME类型: ${record.mediaType || '无'}\n`
    result += `  编码: ${record.encoding || '无'}\n`
    result += `  语言: ${record.lang || '无'}\n`
    
    try {
      // 尝试解码不同类型的记录
      if (record.recordType === 'text') {
        const textDecoder = new TextDecoder(record.encoding || 'utf-8')
        const text = textDecoder.decode(record.data)
        result += `  内容: ${text}\n`
      } else if (record.recordType === 'url') {
        const textDecoder = new TextDecoder('utf-8')
        const url = textDecoder.decode(record.data)
        result += `  内容: ${url}\n`
      } else if (record.mediaType) {
        // 尝试解码MIME类型的内容
        const textDecoder = new TextDecoder('utf-8')
        const content = textDecoder.decode(record.data)
        result += `  内容: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}\n`
      } else {
        // 对于其他类型，显示原始数据
        result += `  原始数据: ${Array.from(record.data).map(b => b.toString(16).padStart(2, '0')).join(' ')}\n`
      }
    } catch (error) {
      result += `  解码失败: ${error.message}\n`
    }
    
    result += '\n'
  })
  
  return result
}

/**
 * 从NDEF消息中解析充电宝数据
 * @param {NDEFMessage} message - NDEF消息对象
 * @returns {Object} - 解析后的充电宝数据
 */
function parseNDEFMessageForBattery(message) {
  // 检查消息记录数量
  if (!message.records || message.records.length < 2) {
    throw new Error('消息记录数量不足，需要至少2条消息')
  }

  // 第二条消息为充电宝参数
  const batteryRecord = message.records[1]
  
  try {
    // 尝试解码记录数据
    let hexString = ''
    
    if (batteryRecord.recordType === 'text') {
      const textDecoder = new TextDecoder(batteryRecord.encoding || 'utf-8')
      hexString = textDecoder.decode(batteryRecord.data)
    } else {
      // 对于二进制数据，转换为16进制字符串
      hexString = Array.from(batteryRecord.data)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    }
    
    // 尝试解析为充电宝数据
    if (hexString && hexString.length >= 68) {
      console.log('解析充电宝数据（第二条消息）:', hexString)
      return parseBatteryData(hexString)
    }
    
    throw new Error('数据长度不足')
  } catch (error) {
    console.error('解析充电宝数据失败:', error)
    throw error
  }
}

/**
 * 检查设备是否支持NFC
 * @returns {boolean} - 是否支持NFC
 */
export function isNFCSupported() {
  return 'NDEFReader' in window
}

/**
 * 格式化NDEF消息为更易读的形式
 * @param {string} message - 原始NDEF消息
 * @returns {string} - 格式化后的消息
 */
export function formatNDEFMessage(message) {
  // 这里可以添加更多的格式化逻辑
  return message
}