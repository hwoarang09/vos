// Load MQTT configuration from JSON file
const loadMqttConfig = async () => {
  try {
    const response = await fetch('/config/mqttConfig.json');
    if (!response.ok) {
      throw new Error(`Failed to load MQTT config: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading MQTT config:', error);
    // Fallback to default values
    return {
      MQTT_BROKER_URL: 'ws://localhost:8083',
      SUBSCRIBE_TOPICS: ['#']
    };
  }
};

// Export config loader
export const getMqttConfig = loadMqttConfig;

// For backward compatibility - synchronous access (will use default until loaded)
let mqttConfig = {
  MQTT_BROKER_URL: 'ws://localhost:8083',
  SUBSCRIBE_TOPICS: ['#'] as string[]
};

// Load config immediately
loadMqttConfig().then(config => {
  mqttConfig = config;
});

export const mqttUrl = mqttConfig.MQTT_BROKER_URL;
export const subscribeTopics = mqttConfig.SUBSCRIBE_TOPICS;
