import { Document, DocumentProcessor } from '@mastra/core';
import { EVE_RAG_CONFIG, EveDocumentMetadata, EVE_DOCUMENT_TEMPLATES } from './config';

export class EveDocumentProcessor extends DocumentProcessor {
  constructor() {
    super({
      chunkSize: 1000,
      chunkOverlap: 100,
      separators: ['\n\n', '\n', '. ', ' ']
    });
  }

  /**
   * Process ship data from EVE databases
   */
  async processShipData(shipData: any[]): Promise<Document<EveDocumentMetadata>[]> {
    const documents: Document<EveDocumentMetadata>[] = [];

    for (const ship of shipData) {
      const content = this.formatShipContent(ship);
      const metadata: EveDocumentMetadata = {
        source: 'gameData',
        category: 'ships',
        timestamp: new Date().toISOString(),
        tags: [ship.faction, ship.shipClass, 'ships'],
        relevance: this.determineRelevance(ship),
        lastUpdated: new Date().toISOString()
      };

      const document = new Document({
        content,
        metadata,
        id: `ship_${ship.typeID}`
      });

      documents.push(document);
    }

    return this.chunkDocuments(documents);
  }

  /**
   * Process market data from EVE APIs
   */
  async processMarketData(marketData: any[]): Promise<Document<EveDocumentMetadata>[]> {
    const documents: Document<EveDocumentMetadata>[] = [];

    for (const item of marketData) {
      const content = this.formatMarketContent(item);
      const metadata: EveDocumentMetadata = {
        source: 'marketData',
        category: 'market',
        timestamp: new Date().toISOString(),
        tags: ['trading', 'prices', item.region || 'the-forge'],
        relevance: 'high',
        lastUpdated: new Date().toISOString()
      };

      const document = new Document({
        content,
        metadata,
        id: `market_${item.typeID}_${Date.now()}`
      });

      documents.push(document);
    }

    return this.chunkDocuments(documents);
  }

  /**
   * Process EVE ESI API responses
   */
  async processESIData(endpoint: string, data: any): Promise<Document<EveDocumentMetadata>[]> {
    const content = this.formatESIContent(endpoint, data);
    const metadata: EveDocumentMetadata = {
      source: 'apiData',
      category: 'api',
      timestamp: new Date().toISOString(),
      url: `https://esi.evetech.net${endpoint}`,
      tags: ['esi', 'api', this.extractAPICategory(endpoint)],
      relevance: 'high',
      lastUpdated: new Date().toISOString()
    };

    const document = new Document({
      content,
      metadata,
      id: `esi_${this.sanitizeEndpoint(endpoint)}_${Date.now()}`
    });

    return this.chunkDocuments([document]);
  }

  /**
   * Process corporation strategy documents
   */
  async processCorporationData(
    title: string, 
    content: string, 
    category: string
  ): Promise<Document<EveDocumentMetadata>[]> {
    const metadata: EveDocumentMetadata = {
      source: 'corporationData',
      category: 'corporation',
      timestamp: new Date().toISOString(),
      tags: [category, 'corporation', 'strategy'],
      relevance: 'medium',
      lastUpdated: new Date().toISOString()
    };

    const document = new Document({
      content: `${title}\n\n${content}`,
      metadata,
      id: `corp_${this.generateId(title)}`
    });

    return this.chunkDocuments([document]);
  }

  /**
   * Process strategy guides and best practices
   */
  async processStrategyGuide(guide: {
    title: string;
    category: string;
    securityLevel?: string;
    content: string;
    author?: string;
    url?: string;
  }): Promise<Document<EveDocumentMetadata>[]> {
    const content = this.formatStrategyContent(guide);
    const metadata: EveDocumentMetadata = {
      source: 'strategyGuides',
      category: 'strategy',
      securityLevel: guide.securityLevel as any,
      timestamp: new Date().toISOString(),
      url: guide.url,
      author: guide.author,
      tags: [guide.category, 'strategy', guide.securityLevel || 'general'].filter(Boolean),
      relevance: 'medium',
      lastUpdated: new Date().toISOString()
    };

    const document = new Document({
      content,
      metadata,
      id: `strategy_${this.generateId(guide.title)}`
    });

    return this.chunkDocuments([document]);
  }

  // Private helper methods

  private formatShipContent(ship: any): string {
    const template = EVE_DOCUMENT_TEMPLATES.shipData.template;
    return template
      .replace('{name}', ship.name || 'Unknown')
      .replace('{shipClass}', ship.shipClass || 'Unknown')
      .replace('{faction}', ship.faction || 'Generic')
      .replace('{description}', ship.description || '')
      .replace('{bonuses}', this.formatBonuses(ship.bonuses))
      .replace('{fittingInfo}', this.formatFittingInfo(ship.fitting))
      .replace('{recommendedUsage}', ship.recommendedUsage || 'General purpose');
  }

  private formatMarketContent(item: any): string {
    const template = EVE_DOCUMENT_TEMPLATES.marketData.template;
    return template
      .replace('{itemName}', item.name || 'Unknown Item')
      .replace('{currentPrice}', this.formatPrice(item.averagePrice))
      .replace('{volume}', this.formatNumber(item.volume))
      .replace('{priceTrend}', this.analyzePriceTrend(item.priceHistory))
      .replace('{analysis}', this.generateMarketAnalysis(item))
      .replace('{opportunities}', this.identifyTradingOpportunities(item));
  }

  private formatESIContent(endpoint: string, data: any): string {
    return `EVE ESI API Response
Endpoint: ${endpoint}
Timestamp: ${new Date().toISOString()}
Data: ${JSON.stringify(data, null, 2)}
Analysis: ${this.analyzeESIData(endpoint, data)}`;
  }

  private formatStrategyContent(guide: any): string {
    const template = EVE_DOCUMENT_TEMPLATES.strategyGuide.template;
    return template
      .replace('{title}', guide.title)
      .replace('{category}', guide.category)
      .replace('{securityLevel}', guide.securityLevel || 'All')
      .replace('{overview}', guide.overview || guide.content.substring(0, 200))
      .replace('{steps}', this.extractSteps(guide.content))
      .replace('{tips}', this.extractTips(guide.content))
      .replace('{risks}', this.extractRisks(guide.content))
      .replace('{expectedOutcome}', this.extractOutcome(guide.content));
  }

  private formatBonuses(bonuses: any[]): string {
    if (!bonuses || !Array.isArray(bonuses)) return 'No bonuses listed';
    return bonuses.map(bonus => `• ${bonus.description || bonus}`).join('\n');
  }

  private formatFittingInfo(fitting: any): string {
    if (!fitting) return 'No fitting information available';
    return `CPU: ${fitting.cpu || 'Unknown'}, Powergrid: ${fitting.powergrid || 'Unknown'}`;
  }

  private formatPrice(price: number): string {
    if (!price) return 'Price not available';
    return `${(price / 1000000).toFixed(2)}M ISK`;
  }

  private formatNumber(num: number): string {
    if (!num) return 'N/A';
    if (num > 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num > 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  private analyzePriceTrend(priceHistory: any[]): string {
    if (!priceHistory || priceHistory.length < 2) return 'Insufficient data';
    
    const recent = priceHistory.slice(-7);
    const trend = recent[recent.length - 1].average - recent[0].average;
    
    if (trend > 0.05) return 'Rising';
    if (trend < -0.05) return 'Falling';
    return 'Stable';
  }

  private generateMarketAnalysis(item: any): string {
    const volume = item.volume || 0;
    const price = item.averagePrice || 0;
    
    let analysis = '';
    if (volume > 1000000) analysis += 'High liquidity market. ';
    if (price > 100000000) analysis += 'High-value item. ';
    if (item.priceVolatility > 0.2) analysis += 'Volatile pricing. ';
    
    return analysis || 'Standard market conditions.';
  }

  private identifyTradingOpportunities(item: any): string {
    const opportunities = [];
    
    if (item.spread && item.spread > 0.1) {
      opportunities.push('High spread - station trading opportunity');
    }
    if (item.regionVariance && item.regionVariance > 0.15) {
      opportunities.push('Regional price differences - hauling opportunity');
    }
    if (item.volume > 1000000 && item.spread < 0.05) {
      opportunities.push('High volume, low spread - good for large trades');
    }
    
    return opportunities.join('. ') || 'Standard trading conditions.';
  }

  private analyzeESIData(endpoint: string, data: any): string {
    if (endpoint.includes('/characters/')) {
      return 'Character data - useful for recruitment and member analysis';
    }
    if (endpoint.includes('/corporations/')) {
      return 'Corporation data - relevant for competitive analysis';
    }
    if (endpoint.includes('/markets/')) {
      return 'Market data - valuable for trading and economic planning';
    }
    return 'ESI data response - context depends on specific endpoint';
  }

  private extractSteps(content: string): string {
    // Simple extraction - could be enhanced with NLP
    const lines = content.split('\n');
    const steps = lines.filter(line => 
      line.match(/^\d+\./) || 
      line.toLowerCase().includes('step') ||
      line.toLowerCase().includes('first') ||
      line.toLowerCase().includes('then')
    );
    return steps.slice(0, 5).join('\n') || 'Steps not clearly identified';
  }

  private extractTips(content: string): string {
    const lines = content.split('\n');
    const tips = lines.filter(line => 
      line.toLowerCase().includes('tip') ||
      line.toLowerCase().includes('remember') ||
      line.toLowerCase().includes('important')
    );
    return tips.slice(0, 3).join('\n') || 'No specific tips identified';
  }

  private extractRisks(content: string): string {
    const lines = content.split('\n');
    const risks = lines.filter(line => 
      line.toLowerCase().includes('risk') ||
      line.toLowerCase().includes('danger') ||
      line.toLowerCase().includes('avoid') ||
      line.toLowerCase().includes('warning')
    );
    return risks.slice(0, 3).join('\n') || 'No specific risks identified';
  }

  private extractOutcome(content: string): string {
    const lines = content.split('\n');
    const outcomes = lines.filter(line => 
      line.toLowerCase().includes('result') ||
      line.toLowerCase().includes('outcome') ||
      line.toLowerCase().includes('expect') ||
      line.toLowerCase().includes('profit')
    );
    return outcomes.slice(0, 2).join('\n') || 'Expected outcomes not specified';
  }

  private determineRelevance(ship: any): 'high' | 'medium' | 'low' {
    if (ship.metaLevel === 0 || ship.popular) return 'high';
    if (ship.metaLevel <= 5) return 'medium';
    return 'low';
  }

  private extractAPICategory(endpoint: string): string {
    if (endpoint.includes('/characters/')) return 'characters';
    if (endpoint.includes('/corporations/')) return 'corporations';
    if (endpoint.includes('/markets/')) return 'markets';
    if (endpoint.includes('/universe/')) return 'universe';
    return 'general';
  }

  private sanitizeEndpoint(endpoint: string): string {
    return endpoint.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private generateId(text: string): string {
    return text.toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
  }

  /**
   * Chunk documents according to source-specific settings
   */
  private async chunkDocuments(documents: Document<EveDocumentMetadata>[]): Promise<Document<EveDocumentMetadata>[]> {
    const chunkedDocs: Document<EveDocumentMetadata>[] = [];

    for (const doc of documents) {
      const sourceConfig = EVE_RAG_CONFIG.sources[doc.metadata.source];
      
      // Update chunking settings based on source
      this.chunkSize = sourceConfig.chunkSize;
      this.chunkOverlap = sourceConfig.chunkOverlap;

      const chunks = await this.splitDocument(doc);
      chunkedDocs.push(...chunks);
    }

    return chunkedDocs;
  }
}