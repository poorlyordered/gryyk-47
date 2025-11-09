import { apiClient } from '../core/api-client';
// TODO: Move RAG service to server-side - currently causes browser errors due to MongoDB dependency
// import { ragService } from '../../mastra/services/rag-service';

// Enhanced ESI interfaces for comprehensive data structures
export interface CorporationInfo {
  alliance_id?: number;
  ceo_id: number;
  creator_id: number;
  date_founded?: string;
  description?: string;
  faction_id?: number;
  home_station_id?: number;
  member_count: number;
  name: string;
  shares?: number;
  tax_rate: number;
  ticker: string;
  url?: string;
  war_eligible?: boolean;
}

export interface CorporationMember {
  character_id: number;
  name: string;
  corporation_id: number;
  alliance_id?: number;
  start_date: string;
  logoff_date?: string;
  logon_date?: string;
}

export interface MarketOrder {
  duration: number;
  is_buy_order: boolean;
  issued: string;
  location_id: number;
  min_volume: number;
  order_id: number;
  price: number;
  range: string;
  region_id: number;
  type_id: number;
  volume_remain: number;
  volume_total: number;
}

export interface MarketHistory {
  average: number;
  date: string;
  highest: number;
  lowest: number;
  order_count: number;
  volume: number;
}

export interface CorporationWallet {
  balance: number;
  division: number;
}

export interface CharacterInfo {
  alliance_id?: number;
  birthday: string;
  bloodline_id: number;
  corporation_id: number;
  description?: string;
  faction_id?: number;
  gender: string;
  name: string;
  race_id: number;
  security_status?: number;
  title?: string;
}

export interface SystemInfo {
  constellation_id: number;
  name: string;
  planets?: any[];
  position: {
    x: number;
    y: number;
    z: number;
  };
  security_class?: string;
  security_status: number;
  star_id?: number;
  stargates?: number[];
  stations?: number[];
  system_id: number;
}

// Enhanced ESI service with RAG integration
export class EnhancedESIService {
  private static instance: EnhancedESIService;

  static getInstance(): EnhancedESIService {
    if (!EnhancedESIService.instance) {
      EnhancedESIService.instance = new EnhancedESIService();
    }
    return EnhancedESIService.instance;
  }

  /**
   * Generic ESI proxy function with automatic RAG ingestion
   */
  private async fetchFromESI<T>(
    endpoint: string, 
    params: Record<string, any> = {},
    ingestToRAG: boolean = true
  ): Promise<T> {
    try {
      const response = await apiClient.post('/eve-api-proxy', {
        endpoint,
        ...params
      });

      // Automatically ingest into RAG system if enabled
      // RAG service temporarily disabled - requires server-side implementation
      // if (ingestToRAG && ragService.isInitialized()) {
      //   await ragService.ingestESIData(endpoint, response.data);
      // }

      return response.data;
    } catch (error) {
      console.error(`ESI request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get corporation information
   */
  async getCorporationInfo(corporationId: string): Promise<CorporationInfo> {
    return this.fetchFromESI<CorporationInfo>('corporation_info', { corporationId });
  }

  /**
   * Get corporation members list
   */
  async getCorporationMembers(corporationId: string): Promise<CorporationMember[]> {
    return this.fetchFromESI<CorporationMember[]>('corporation_members', { corporationId });
  }

  /**
   * Get corporation wallet information
   */
  async getCorporationWallets(corporationId: string): Promise<CorporationWallet[]> {
    return this.fetchFromESI<CorporationWallet[]>('corporation_wallets', { corporationId });
  }

  /**
   * Get market orders for a region and type
   */
  async getMarketOrders(regionId: number, typeId?: number): Promise<MarketOrder[]> {
    return this.fetchFromESI<MarketOrder[]>('market_orders', { regionId, typeId });
  }

  /**
   * Get market history for a region and type
   */
  async getMarketHistory(regionId: number, typeId: number): Promise<MarketHistory[]> {
    return this.fetchFromESI<MarketHistory[]>('market_history', { regionId, typeId });
  }

  /**
   * Get character information
   */
  async getCharacterInfo(characterId: number): Promise<CharacterInfo> {
    return this.fetchFromESI<CharacterInfo>('character_info', { characterId });
  }

  /**
   * Get system information
   */
  async getSystemInfo(systemId: number): Promise<SystemInfo> {
    return this.fetchFromESI<SystemInfo>('system_info', { systemId });
  }

  /**
   * Bulk fetch corporation data for comprehensive analysis
   */
  async getCorporationDataBundle(corporationId: string): Promise<{
    corporation: CorporationInfo;
    members: CorporationMember[];
    wallets: CorporationWallet[];
    timestamp: string;
  }> {
    try {
      const [corporation, members, wallets] = await Promise.all([
        this.getCorporationInfo(corporationId),
        this.getCorporationMembers(corporationId),
        this.getCorporationWallets(corporationId)
      ]);

      const bundle = {
        corporation,
        members,
        wallets,
        timestamp: new Date().toISOString()
      };

      // Store comprehensive corporation analysis in RAG
      // RAG service temporarily disabled
      // if (ragService.isInitialized()) {
      //   await ragService.ingestESIData('corporation_bundle', bundle);
      // }

      return bundle;
    } catch (error) {
      console.error('Failed to fetch corporation data bundle:', error);
      throw error;
    }
  }

  /**
   * Fetch market data for key Highsec items
   */
  async getHighsecMarketData(): Promise<void> {
    const theForgeRegionId = 10000002; // The Forge (Jita)
    const keyItems = [
      34,   // Tritanium
      35,   // Pyerite
      36,   // Mexallon
      37,   // Isogen
      38,   // Nocxium
      39,   // Zydrine
      40,   // Megacyte
      11399, // Morphite
    ];

    try {
      const marketData = await Promise.all(
        keyItems.map(async (typeId) => {
          const [orders, history] = await Promise.all([
            this.getMarketOrders(theForgeRegionId, typeId),
            this.getMarketHistory(theForgeRegionId, typeId)
          ]);

          return {
            typeId,
            orders,
            history: history.slice(-30), // Last 30 days
            timestamp: new Date().toISOString()
          };
        })
      );

      // RAG service temporarily disabled
      // if (ragService.isInitialized()) {
      //   for (const item of marketData) {
      //     await ragService.ingestMarketData([{
      //       typeId: item.typeId,
      //       name: `Item ${item.typeId}`,
      //       orders: item.orders,
      //       history: item.history,
      //       region: 'The Forge',
      //       timestamp: item.timestamp
      //     }]);
      //   }
      // }

      console.log(`✅ Fetched market data for ${keyItems.length} key items`);
    } catch (error) {
      console.error('Failed to fetch Highsec market data:', error);
      throw error;
    }
  }

  /**
   * Monitor corporation activity and update RAG system
   */
  async monitorCorporationActivity(corporationId: string): Promise<void> {
    try {
      const bundle = await this.getCorporationDataBundle(corporationId);
      
      // Analyze changes since last check (would be enhanced with historical comparison)
      const activityAnalysis = {
        corporationId,
        memberCount: bundle.corporation.member_count,
        totalWalletBalance: bundle.wallets.reduce((sum, wallet) => sum + wallet.balance, 0),
        activeMembers: bundle.members.filter(member => 
          member.logon_date && new Date(member.logon_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        timestamp: bundle.timestamp
      };

      console.log(`📊 Corporation activity monitored:`, activityAnalysis);
      return activityAnalysis;
    } catch (error) {
      console.error('Failed to monitor corporation activity:', error);
      throw error;
    }
  }

  /**
   * Get strategic intelligence for a corporation
   */
  async getStrategicIntelligence(corporationId: string): Promise<{
    memberActivity: any;
    economicStatus: any;
    marketPosition: any;
    recommendations: string[];
  }> {
    try {
      const bundle = await this.getCorporationDataBundle(corporationId);
      
      // Calculate member activity metrics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const memberActivity = {
        total: bundle.members.length,
        activeLastWeek: bundle.members.filter(m => 
          m.logon_date && new Date(m.logon_date) > weekAgo
        ).length,
        activeLastMonth: bundle.members.filter(m => 
          m.logon_date && new Date(m.logon_date) > monthAgo
        ).length,
        newMembers: bundle.members.filter(m => 
          new Date(m.start_date) > monthAgo
        ).length
      };

      // Economic status analysis
      const economicStatus = {
        totalBalance: bundle.wallets.reduce((sum, w) => sum + w.balance, 0),
        taxRate: bundle.corporation.tax_rate,
        avgBalancePerMember: bundle.wallets.reduce((sum, w) => sum + w.balance, 0) / bundle.members.length
      };

      // Generate recommendations
      const recommendations = [];
      
      if (memberActivity.activeLastWeek < memberActivity.total * 0.5) {
        recommendations.push('Consider member retention initiatives - low weekly activity detected');
      }
      
      if (economicStatus.totalBalance < 1000000000) { // < 1B ISK
        recommendations.push('Corporation wallet balance is low - consider fundraising activities');
      }
      
      if (bundle.corporation.tax_rate > 0.1) {
        recommendations.push('High tax rate may discourage new members');
      }

      const intelligence = {
        memberActivity,
        economicStatus,
        marketPosition: {
          region: 'Highsec',
          primaryActivities: ['Mining', 'Missions', 'Trading'] // Would be enhanced with actual activity detection
        },
        recommendations
      };

      // RAG service temporarily disabled
      // if (ragService.isInitialized()) {
      //   await ragService.ingestESIData('strategic_intelligence', intelligence);
      // }

      return intelligence;
    } catch (error) {
      console.error('Failed to generate strategic intelligence:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const esiService = EnhancedESIService.getInstance();