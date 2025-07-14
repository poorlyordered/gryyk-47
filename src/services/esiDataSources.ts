import { ESIDataSource } from './esiPipeline';

// Predefined ESI data sources for EVE Online corporation management
export const defaultESIDataSources: ESIDataSource[] = [
  // Corporation Data Sources
  {
    id: 'corp-basic-info',
    name: 'Corporation Basic Information',
    endpoint: '/corporations/{corporation_id}/',
    type: 'corporation',
    updateFrequency: 60, // 1 hour
    priority: 'high',
    parameters: {
      corporation_id: '98388312' // Gryyk-47 corporation ID
    },
    transformer: (data) => ({
      ...data,
      formatted_name: `${data.name} [${data.ticker}]`,
      member_density: data.member_count / Math.max(1, (new Date().getTime() - new Date(data.date_founded || 0).getTime()) / (1000 * 60 * 60 * 24 * 365)),
      tax_rate_percentage: (data.tax_rate * 100).toFixed(1) + '%'
    }),
    validator: (data) => data && data.name && data.ticker,
    isEnabled: true
  },
  
  {
    id: 'corp-members',
    name: 'Corporation Members',
    endpoint: '/corporations/{corporation_id}/members/',
    type: 'corporation',
    updateFrequency: 30, // 30 minutes
    priority: 'high',
    parameters: {
      corporation_id: '98388312'
    },
    transformer: (data) => {
      if (!Array.isArray(data)) return data;
      return {
        member_count: data.length,
        members: data,
        activity_analysis: {
          total_members: data.length,
          estimated_active: Math.floor(data.length * 0.7), // Rough estimate
          recruitment_trending: data.length > 50 ? 'stable' : 'recruiting'
        }
      };
    },
    validator: (data) => Array.isArray(data),
    isEnabled: true
  },

  {
    id: 'corp-roles',
    name: 'Corporation Member Roles',
    endpoint: '/corporations/{corporation_id}/roles/',
    type: 'corporation',
    updateFrequency: 120, // 2 hours
    priority: 'medium',
    parameters: {
      corporation_id: '98388312'
    },
    transformer: (data) => {
      if (!Array.isArray(data)) return data;
      const roleStats = data.reduce((acc, member) => {
        member.roles?.forEach((role: string) => {
          acc[role] = (acc[role] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);
      
      return {
        members_with_roles: data,
        role_distribution: roleStats,
        leadership_count: data.filter(m => m.roles?.includes('Director') || m.roles?.includes('CEO')).length,
        total_members_with_roles: data.length
      };
    },
    validator: (data) => Array.isArray(data),
    isEnabled: true
  },

  // Market Data Sources
  {
    id: 'jita-market-orders',
    name: 'Jita Market Orders (Top Items)',
    endpoint: '/markets/{region_id}/orders/',
    type: 'market',
    updateFrequency: 15, // 15 minutes
    priority: 'high',
    parameters: {
      region_id: 10000002, // The Forge (Jita)
      type_id: 34 // Tritanium - most traded item
    },
    transformer: (data) => {
      if (!Array.isArray(data)) return data;
      
      const buyOrders = data.filter(order => order.is_buy_order);
      const sellOrders = data.filter(order => !order.is_buy_order);
      
      const highestBuy = Math.max(...buyOrders.map(o => o.price), 0);
      const lowestSell = Math.min(...sellOrders.map(o => o.price), Infinity);
      
      return {
        raw_orders: data,
        market_summary: {
          total_orders: data.length,
          buy_orders: buyOrders.length,
          sell_orders: sellOrders.length,
          highest_buy: highestBuy,
          lowest_sell: lowestSell === Infinity ? 0 : lowestSell,
          spread: lowestSell !== Infinity && highestBuy > 0 
            ? ((lowestSell - highestBuy) / lowestSell * 100).toFixed(2) + '%' 
            : 'N/A',
          total_volume: data.reduce((sum, order) => sum + order.volume_remain, 0)
        }
      };
    },
    validator: (data) => Array.isArray(data),
    isEnabled: true
  },

  {
    id: 'market-prices',
    name: 'Market Prices (Common Items)',
    endpoint: '/markets/prices/',
    type: 'market',
    updateFrequency: 30, // 30 minutes
    priority: 'medium',
    parameters: {},
    transformer: (data) => {
      if (!Array.isArray(data)) return data;
      
      // Focus on common mining and trading items
      const commonItemIds = [34, 35, 36, 37, 38, 39, 40]; // Basic minerals
      const relevantPrices = data.filter(item => commonItemIds.includes(item.type_id));
      
      return {
        all_prices: data,
        mining_materials: relevantPrices,
        market_snapshot: {
          total_items: data.length,
          mining_items_tracked: relevantPrices.length,
          timestamp: new Date().toISOString()
        }
      };
    },
    validator: (data) => Array.isArray(data) && data.length > 0,
    isEnabled: true
  },

  // Universe Data Sources
  {
    id: 'system-info-jita',
    name: 'Jita System Information',
    endpoint: '/universe/systems/{system_id}/',
    type: 'universe',
    updateFrequency: 1440, // 24 hours (static data)
    priority: 'low',
    parameters: {
      system_id: 30000142 // Jita
    },
    transformer: (data) => ({
      ...data,
      security_class: data.security_status >= 0.5 ? 'Highsec' : 
                     data.security_status > 0.0 ? 'Lowsec' : 'Nullsec',
      formatted_security: data.security_status.toFixed(1),
      trade_hub_status: 'Primary Trade Hub',
      strategic_importance: 'Critical - Main Market Hub'
    }),
    validator: (data) => data && data.system_id && data.name,
    isEnabled: true
  },

  {
    id: 'constellation-info',
    name: 'Constellation Information',
    endpoint: '/universe/constellations/{constellation_id}/',
    type: 'universe',
    updateFrequency: 1440, // 24 hours
    priority: 'low',
    parameters: {
      constellation_id: 20000020 // Kimotoro (Jita's constellation)
    },
    transformer: (data) => ({
      ...data,
      system_count: data.systems ? data.systems.length : 0,
      strategic_value: data.systems?.includes(30000142) ? 'High - Contains Jita' : 'Standard'
    }),
    validator: (data) => data && data.constellation_id && data.name,
    isEnabled: true
  },

  // Sovereignty Data (for nullsec corporations)
  {
    id: 'sovereignty-map',
    name: 'Sovereignty Map',
    endpoint: '/sovereignty/map/',
    type: 'sovereignty',
    updateFrequency: 60, // 1 hour
    priority: 'low',
    parameters: {},
    transformer: (data) => {
      if (!Array.isArray(data)) return data;
      
      return {
        sovereignty_data: data,
        total_systems: data.length,
        unique_alliances: [...new Set(data.map(s => s.alliance_id).filter(Boolean))].length,
        unique_corporations: [...new Set(data.map(s => s.corporation_id).filter(Boolean))].length,
        null_sec_systems: data.filter(s => s.system_id).length
      };
    },
    validator: (data) => Array.isArray(data),
    isEnabled: false // Disabled by default for highsec corps
  },

  // Character Data (for CEO/leadership)
  {
    id: 'character-info-ceo',
    name: 'CEO Character Information',
    endpoint: '/characters/{character_id}/',
    type: 'character',
    updateFrequency: 120, // 2 hours
    priority: 'medium',
    parameters: {
      character_id: '2118481062' // Example CEO character ID - would be configured per corp
    },
    transformer: (data) => ({
      ...data,
      leadership_role: 'CEO',
      formatted_name: data.name,
      security_standing: data.security_status ? 
        (data.security_status >= 0 ? 'Positive' : 'Negative') : 'Unknown',
      formatted_security: data.security_status ? data.security_status.toFixed(1) : 'N/A'
    }),
    validator: (data) => data && data.character_id && data.name,
    isEnabled: false // Disabled by default - requires character ID configuration
  },

  // Industry Data Sources
  {
    id: 'industry-facilities',
    name: 'Public Industry Facilities',
    endpoint: '/industry/facilities/',
    type: 'universe',
    updateFrequency: 360, // 6 hours
    priority: 'low',
    parameters: {},
    transformer: (data) => {
      if (!Array.isArray(data)) return data;
      
      const highsecFacilities = data.filter(facility => {
        // This would need actual security status lookup, simplified here
        return true; // In reality, filter by system security
      });
      
      return {
        all_facilities: data,
        highsec_facilities: highsecFacilities,
        facility_stats: {
          total: data.length,
          manufacturing: data.filter(f => f.type_id === 1 || f.type_id === 21).length,
          research: data.filter(f => f.type_id === 2 || f.type_id === 3).length,
          invention: data.filter(f => f.type_id === 8).length
        }
      };
    },
    validator: (data) => Array.isArray(data),
    isEnabled: false // Disabled by default - large dataset
  },

  // Economic Indicators
  {
    id: 'economic-indices',
    name: 'Economic Indices',
    endpoint: '/markets/prices/',
    type: 'market',
    updateFrequency: 60, // 1 hour
    priority: 'medium',
    parameters: {},
    transformer: (data) => {
      if (!Array.isArray(data)) return data;
      
      // Calculate economic health indicators
      const mineralIds = [34, 35, 36, 37, 38, 39, 40]; // Basic minerals
      const minerals = data.filter(item => mineralIds.includes(item.type_id));
      
      const plex_id = 44992; // PLEX
      const plexPrice = data.find(item => item.type_id === plex_id);
      
      return {
        economic_snapshot: {
          timestamp: new Date().toISOString(),
          plex_price: plexPrice ? plexPrice.average_price : null,
          mineral_basket_value: minerals.reduce((sum, mineral) => 
            sum + (mineral.average_price || 0), 0),
          market_items_tracked: data.length,
          economic_health: 'Calculating...' // Would be calculated based on trends
        },
        raw_price_data: data,
        key_commodities: {
          minerals,
          plex: plexPrice
        }
      };
    },
    validator: (data) => Array.isArray(data) && data.length > 1000, // Expect substantial price data
    isEnabled: true
  }
];

// Configuration for different corporation types
export const corporationTypeConfigs = {
  highsec_industrial: {
    name: 'Highsec Industrial Corporation',
    recommendedSources: [
      'corp-basic-info',
      'corp-members', 
      'corp-roles',
      'jita-market-orders',
      'market-prices',
      'system-info-jita',
      'economic-indices'
    ],
    updateFrequencies: {
      'corp-basic-info': 60,
      'corp-members': 30,
      'jita-market-orders': 15,
      'market-prices': 30
    }
  },
  
  highsec_mining: {
    name: 'Highsec Mining Corporation',
    recommendedSources: [
      'corp-basic-info',
      'corp-members',
      'market-prices', // Focus on mineral prices
      'system-info-jita',
      'economic-indices'
    ],
    updateFrequencies: {
      'market-prices': 15, // More frequent for mining corps
      'economic-indices': 30
    }
  },
  
  nullsec_sov: {
    name: 'Nullsec Sovereignty Corporation',
    recommendedSources: [
      'corp-basic-info',
      'corp-members',
      'corp-roles',
      'sovereignty-map',
      'market-prices',
      'economic-indices'
    ],
    updateFrequencies: {
      'sovereignty-map': 30, // More frequent sovereignty updates
      'corp-members': 15     // More frequent member tracking
    }
  },
  
  lowsec_faction_warfare: {
    name: 'Lowsec Faction Warfare Corporation',
    recommendedSources: [
      'corp-basic-info',
      'corp-members',
      'corp-roles',
      'market-prices',
      'character-info-ceo'
    ],
    updateFrequencies: {
      'corp-members': 15,    // Frequent member updates for PvP corps
      'corp-roles': 60       // Monitor role changes for security
    }
  }
};

// Helper function to get configured data sources for a corporation type
export function getDataSourcesForCorporationType(corpType: keyof typeof corporationTypeConfigs): ESIDataSource[] {
  const config = corporationTypeConfigs[corpType];
  const sources = defaultESIDataSources.filter(source => 
    config.recommendedSources.includes(source.id)
  );
  
  // Apply custom update frequencies
  sources.forEach(source => {
    if (config.updateFrequencies[source.id]) {
      source.updateFrequency = config.updateFrequencies[source.id];
    }
  });
  
  return sources;
}

// Helper function to customize data sources for a specific corporation
export function customizeDataSourcesForCorporation(
  sources: ESIDataSource[], 
  corporationId: string, 
  ceoCharacterId?: string
): ESIDataSource[] {
  return sources.map(source => {
    const customizedSource = { ...source };
    
    // Replace corporation ID placeholders
    if (customizedSource.parameters?.corporation_id) {
      customizedSource.parameters.corporation_id = corporationId;
    }
    
    // Replace CEO character ID if provided
    if (customizedSource.id === 'character-info-ceo' && ceoCharacterId) {
      customizedSource.parameters = {
        ...customizedSource.parameters,
        character_id: ceoCharacterId
      };
      customizedSource.isEnabled = true;
    }
    
    // Update endpoint with actual IDs
    customizedSource.endpoint = customizedSource.endpoint
      .replace('{corporation_id}', corporationId)
      .replace('{character_id}', ceoCharacterId || 'PLACEHOLDER');
    
    return customizedSource;
  });
}