// Test setting configuration interface
export interface TestSetting {
  id: string;
  name: string;
  description: string;
  mapName: string;
  numVehicles: number;
  camera?: {
    position: [number, number, number];
    target: [number, number, number];
  };
}

interface TestSettingConfig {
  TEST_SETTINGS: TestSetting[];
  DEFAULT_SETTING: string;
}

// Load test setting configuration from JSON file
const loadTestSettingConfig = async (): Promise<TestSettingConfig> => {
  try {
    const response = await fetch('/config/testSettingConfig.json');
    if (!response.ok) {
      throw new Error(`Failed to load test setting config: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading test setting config:', error);
    // Fallback to default values
    return {
      TEST_SETTINGS: [
        {
          id: "SMALL_LOOP",
          name: "Small Loop Test",
          description: "Small loop with few vehicles for quick testing",
          mapName: "straight_short_test",
          numVehicles: 5,
          camera: {
            position: [5, -2, 100],
            target: [5, 5, 0]
          }
        }
      ],
      DEFAULT_SETTING: "SMALL_LOOP"
    };
  }
};

// Export config loader
export const getTestSettingConfig = loadTestSettingConfig;

// For synchronous access (will use default until loaded)
let testSettingConfig: TestSettingConfig = {
  TEST_SETTINGS: [
    {
      id: "SMALL_LOOP",
      name: "Small Loop Test",
      description: "Small loop with few vehicles for quick testing",
      mapName: "straight_short_test",
      numVehicles: 5,
      camera: {
        position: [5, -2, 10],
        target: [5, 5, 0]
      }
    }
  ],
  DEFAULT_SETTING: "SMALL_LOOP"
};

// Load config immediately
loadTestSettingConfig().then(config => {
  testSettingConfig = config;
  console.log('[TestSettingConfig] Loaded:', config);
});

// Export synchronous getters
export const getTestSettings = () => testSettingConfig.TEST_SETTINGS;
export const getDefaultSetting = () => testSettingConfig.DEFAULT_SETTING;

// Get test setting by ID
export const getTestSettingById = (id: string): TestSetting | undefined => {
  return testSettingConfig.TEST_SETTINGS.find(setting => setting.id === id);
};

// Get default test setting
export const getDefaultTestSetting = (): TestSetting => {
  const defaultId = testSettingConfig.DEFAULT_SETTING;
  const setting = getTestSettingById(defaultId);
  return setting || testSettingConfig.TEST_SETTINGS[0];
};

