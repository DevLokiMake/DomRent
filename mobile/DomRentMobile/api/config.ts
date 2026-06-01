/**
 * API Configuration
 * 
 * Используйте этот файл для управления API endpoint на разных платформах и окружениях.
 * Укажите свой локальный IP адрес для iOS и реальных устройств.
 */

export const API_CONFIG = {
  /**
   * Android эмулятор - использует специальный адрес для доступа к хосту
   */
  ANDROID_EMULATOR: 'http://10.0.2.2:5000/api',

  /**
   * iOS эмулятор и реальные устройства
   * ⚠️  ОБНОВИТЕ ЭТО НА ВАШ ЛОКАЛЬНЫЙ IP АДРЕС
   * 
   * Найти IP адрес:
   * - Windows: ipconfig | findstr IPv4
   * - Mac: ifconfig | grep inet
   * - Linux: ip addr | grep inet
   * 
   * Примеры:
   * - 192.168.1.100
   * - 10.0.0.5
   * - 172.16.0.1
   */
  IOS_EMULATOR_AND_DEVICE: 'http://localhost:5000/api', // ← ИЗМЕНИТЕ НА ВАШ IP

  /**
   * Production API
   */
  PRODUCTION: 'https://api.domrent.com/api',

  /**
   * Timeout для всех запросов (в миллисекундах)
   */
  TIMEOUT: 10000,

  /**
   * Включить логирование запросов
   */
  DEBUG: __DEV__, // true в разработке, false в production
};

/**
 * Полезные коман для получения IP адреса
 * 
 * Windows (PowerShell):
 *   ipconfig | findstr IPv4
 * 
 * Mac (Terminal):
 *   ifconfig | grep "inet " | grep -v 127.0.0.1
 * 
 * Linux (Terminal):
 *   hostname -I
 *   или
 *   ip addr | grep "inet " | grep -v 127.0.0.1
 */
