// Load map configuration from JSON file
const loadMapConfig = async () => {
  try {
    const response = await fetch('/config/mapConfig.json');
    if (!response.ok) {
      throw new Error(`Failed to load map config: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading map config:', error);
    // Fallback to default values
    return {
      RAIL_CONFIG_PATH: 'railConfig',
      AVAILABLE_MAPS: ['dismantle'],
      AUTO_LOAD_MAP: ''
    };
  }
};

// Export config loader
export const getMapConfig = loadMapConfig;

// For synchronous access (will use default until loaded)
let mapConfig = {
  RAIL_CONFIG_PATH: 'railConfig',
  AVAILABLE_MAPS: ['dismantle'],
  AUTO_LOAD_MAP: ''
};

// Load config immediately
loadMapConfig().then(config => {
  mapConfig = config;
});

// Export rail config base path
export const getRailConfigPath = () => `/${mapConfig.RAIL_CONFIG_PATH}`;

// Export map file paths based on selected map folder
export const getMapFilePaths = (mapFolder: string) => {
  const basePath = getRailConfigPath();
  return {
    nodesPath: `${basePath}/${mapFolder}/nodes.cfg`,
    edgesPath: `${basePath}/${mapFolder}/edges.cfg`,
    stationsPath: `${basePath}/${mapFolder}/stations.cfg`
  };
};

// Get available map folders from config
export const getAvailableMapFolders = async (): Promise<string[]> => {
  const config = await loadMapConfig();
  return config.AVAILABLE_MAPS || ['dismantle'];
};

// Get auto-load map (returns null if empty string or not set)
export const getAutoLoadMap = async (): Promise<string | null> => {
  const config = await loadMapConfig();
  const autoLoadMap = config.AUTO_LOAD_MAP || '';
  return autoLoadMap.trim() === '' ? null : autoLoadMap;
};

