/**
 * 解析器模块
 * 用于解析NFC标签中的16进制字符串，提取充电宝参数
 */

/**
 * 解析16进制字符串为充电宝参数
 * @param {string} hexString - 16进制字符串
 * @returns {Object} - 解析后的充电宝参数
 */
export function parseBatteryData(hexString) {
  try {
    // 检查字符串长度
    if (!hexString || hexString.length < 68) {
      throw new Error('数据长度不足');
    }

    // 验证协议头
    const protocolHeader = hexString.substring(0, 2);
    const fieldType = hexString.substring(2, 4);
    
    if (protocolHeader !== 'B1' || fieldType !== '10') {
      throw new Error('协议头不正确');
    }

    // 解析数据域
    const dataField = hexString.substring(8); // 跳过协议头、字段类型和数据长度
    
    // 解析各个参数
    const params = {
      // 设备状态
      status: parseStatus(parseByte(dataField, 0)),
      
      // 电压最大值 (mV)
      maxVoltage: (parseByte(dataField, 2) << 8 | parseByte(dataField, 1)) / 1000,
      
      // 电压最小值 (mV)
      minVoltage: (parseByte(dataField, 4) << 8 | parseByte(dataField, 3)) / 1000,
      
      // 电池容量 (mAh)
      capacity: parseByte(dataField, 6) << 8 | parseByte(dataField, 5),
      
      // 充电阈值 (%)
      chargeThreshold: (parseByte(dataField, 8) << 8 | parseByte(dataField, 7)) / 1000,
      
      // 放电阈值 (%)
      dischargeThreshold: (parseByte(dataField, 10) << 8 | parseByte(dataField, 9)) / 1000,
      
      // 温度范围
      minTemperature: parseTemperature(dataField, 13, 12, parseByte(dataField, 11) & 0x01),
      maxTemperature: parseTemperature(dataField, 14, 15, parseByte(dataField, 11) & 0x02),
      
      // 电池电压 (mV)
      cell1Voltage: (parseByte(dataField, 17) << 8 | parseByte(dataField, 16)) / 1000,
      cell2Voltage: (parseByte(dataField, 19) << 8 | parseByte(dataField, 18)) / 1000,
      totalVoltage: (parseByte(dataField, 21) << 8 | parseByte(dataField, 20)) / 1000,
      
      // 当前温度 (°C)
      temperature: parseTemperature(dataField, 23, 22, 0),
      
      // 电流 (A)
      current: (parseByte(dataField, 25) << 8 | parseByte(dataField, 24)),
      
      // 充电循环次数
      cycles: parseByte(dataField, 27) << 8 | parseByte(dataField, 26),
      
      // 电池健康状态 (%)
      health: parseByte(dataField, 29) << 8 | parseByte(dataField, 28),
      
      // 当前电量 (%)
      level: parseByte(dataField, 30)
    };

    return params;
  } catch (error) {
    console.error('解析数据失败:', error);
    throw error;
  }
}

/**
 * 从指定位置解析一个字节
 * @param {string} hexString - 16进制字符串
 * @param {number} index - 字节索引
 * @returns {number} - 解析后的字节值
 */
function parseByte(hexString, index) {
  const start = index * 2;
  const end = start + 2;
  return parseInt(hexString.substring(start, end), 16);
}

/**
 * 解析设备状态
 * @param {number} statusByte - 状态字节
 * @returns {string} - 设备状态
 */
function parseStatus(statusByte) {
  switch (statusByte) {
    case 0x00:
      return '待机';
    case 0x01:
      return '充电';
    case 0x02:
      return '放电';
    case 0x03:
      return '异常';
    default:
      return '未知';
  }
}

/**
 * 解析温度
 * @param {string} hexString - 16进制字符串
 * @param {number} integerIndex - 整数部分索引
 * @param {number} decimalIndex - 小数部分索引
 * @param {number} isNegative - 是否为负数
 * @returns {number} - 解析后的温度
 */
function parseTemperature(hexString, integerIndex, decimalIndex, isNegative) {
  const integerPart = parseByte(hexString, integerIndex);
  const decimalPart = parseByte(hexString, decimalIndex) / 10;
  let temperature = integerPart + decimalPart;
  
  if (isNegative) {
    temperature = -temperature;
  }
  
  return temperature;
}

/**
 * 生成模拟数据
 * @returns {Object} - 模拟的充电宝参数
 */
export function generateMockData() {
  const hexString = 'B1102200016810B80B10270410800C005005202DD80ECE0EA61D3019000019005F0050';
  return parseBatteryData(hexString);
}