import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StrategicMatrixDocument } from './types';

// Order of categories as specified in EveAIInstructions.md
export const STRATEGIC_MATRIX_CATEGORIES = [
  'Corporation Context',
  'Active Context',
  'Asset Information',
  'Diplomatic Relations',
  'Operational Details',
  'Threat Analysis',
  'Opportunity Assessment',
];

interface StrategicMatrixState {
  documents: StrategicMatrixDocument[];
  addDocument: (document: Omit<StrategicMatrixDocument, 'id'>) => void;
  updateDocument: (document: StrategicMatrixDocument) => void;
  deleteDocument: (id: string) => void;
  getDocumentById: (id: string) => StrategicMatrixDocument | undefined;
  getDocumentsByCategory: (category: string) => StrategicMatrixDocument[];
  getLatestDocumentByCategory: (category: string) => StrategicMatrixDocument | undefined;
  getFixedOrderDocuments: () => (StrategicMatrixDocument | undefined)[];
}

// Initial sample documents
const initialDocuments: StrategicMatrixDocument[] = [
  {
    id: '1',
    title: 'Corporation Overview',
    content: 'Our corporation focuses on industrial operations in high-security space, with a growing presence in low-security mining operations. We specialize in mineral extraction and production of T1 ships and modules.\n\nLeadership Structure:\n- CEO: Marcus Jericho\n- Directors: Elena Korbin (Industry), Talos Vex (Security), Jared Nomad (Recruitment)\n\nCore Values:\n- Efficiency in all operations\n- Mutual support between members\n- Continuous growth and expansion\n\nPrimary Income: Mining operations, manufacturing, and market trading.',
    category: 'Corporation Context',
    lastUpdated: new Date('2025-03-15'),
  },
  {
    id: '2',
    title: 'Current Strategic Initiatives',
    content: 'We are currently expanding our mining fleet and establishing a more efficient logistics chain for resource transportation.\n\nRecent Decisions:\n- Approved purchase of 3 additional mining barges\n- Established alliance with neighboring corporation for mutual defense\n- Initiated recruitment drive for new industrial pilots\n\nImmediate Threats:\n- Increasing pirate activity in our low-sec mining area\n- Market competition from larger industrial alliances\n\nNext Steps:\n- Complete logistics chain optimization by end of month\n- Finalize security protocols for low-sec operations\n- Begin T2 production capability research',
    category: 'Active Context',
    lastUpdated: new Date('2025-03-20'),
  },
  {
    id: '3',
    title: 'Fleet and Infrastructure',
    content: 'Territory: Primary operations in Lonetrek region, with mining outposts in 3 systems.\n\nFleet Composition:\n- 5 mining barges\n- 2 exhumers\n- 3 industrial ships\n- 2 combat escorts (cruiser class)\n- 5 frigates for scouting\n\nIndustrial Infrastructure:\n- Medium-sized POS with manufacturing arrays\n- 2 compression arrays\n- Basic research facilities\n\nFinancial Reserves: 2.5 billion ISK liquid, 4 billion in assets',
    category: 'Asset Information',
    lastUpdated: new Date('2025-03-18'),
  },
  {
    id: '4',
    title: 'Alliance and Diplomatic Status',
    content: 'Alliance Membership: Independent, non-aligned\n\nDiplomatic Relationships:\n- Friendly: Caldari State, Minmatar mining cooperatives\n- Neutral: Gallente Federation, most nullsec alliances\n- Strained: Local pirate groups, competing industrial corps\n\nAgreements:\n- Mutual defense pact with Stellar Mining Inc.\n- Non-aggression pact with Black Nova Security\n- Trade agreement with Caldari suppliers\n\nKnown Enemies:\n- Blood Raiders pirate faction\n- "Red Horizon" pirate group operating in our mining areas',
    category: 'Diplomatic Relations',
    lastUpdated: new Date('2025-03-17'),
  },
  {
    id: '5',
    title: 'Current Operations',
    content: 'PvE Operations:\n- Daily mining fleets in high-sec (10:00-22:00 EVE time)\n- Weekly low-sec mining operations with security escort\n- Planetary Interaction on 8 planets\n\nIndustrial Operations:\n- T1 ship manufacturing (frigates, cruisers)\n- Ammunition and module production\n- Mineral refinement and compression\n\nLogistics:\n- High-sec hauling routes established\n- Jump freighter service contracted bi-weekly\n\nRecruitment:\n- Seeking industrial specialists and combat pilots\n- Current training program has 3 new members',
    category: 'Operational Details',
    lastUpdated: new Date('2025-03-19'),
  },
  {
    id: '6',
    title: 'Threat Assessment',
    content: 'Hostile Entities:\n- Blood Raiders increasing activity in our low-sec mining area\n- "Red Horizon" pirate group specifically targeting our haulers\n- Competing industrial corporation attempting to undercut our market prices\n\nEconomic Risks:\n- Mineral price volatility affecting profit margins\n- Increased competition in T1 manufacturing market\n- Potential changes to mining mechanics in upcoming patch\n\nVulnerabilities:\n- Limited combat capability for escort operations\n- Reliance on single jump freighter service\n- Concentration of assets in one station\n\nContingency Plans:\n- Emergency evacuation protocol for low-sec operations\n- Asset diversification plan in development\n- Combat pilot recruitment initiative',
    category: 'Threat Analysis',
    lastUpdated: new Date('2025-03-16'),
  },
  {
    id: '7',
    title: 'Growth Opportunities',
    content: 'Expansion Territories:\n- Identified 2 additional low-sec systems with valuable moon mining potential\n- Potential for wormhole operations in the future\n\nEconomic Opportunities:\n- T2 production capability would increase profit margins by estimated 35%\n- Market gap identified in specialized rig manufacturing\n- Potential for reaction farming with new infrastructure\n\nRecruitment Targets:\n- Experienced FC for combat operations\n- Capital ship pilots for future expansion\n- Industry specialists with T2 production experience\n\nNew Mechanics:\n- Upcoming changes to compression mechanics could benefit our operation\n- New structures announced in dev blog may improve manufacturing efficiency',
    category: 'Opportunity Assessment',
    lastUpdated: new Date('2025-03-14'),
  },
];

export const useStrategicMatrixStore = create<StrategicMatrixState>()(
  persist(
    (set, get) => ({
      documents: initialDocuments,
      
      addDocument: (document) => {
        const newDocument: StrategicMatrixDocument = {
          ...document,
          id: crypto.randomUUID(),
          lastUpdated: new Date(),
        };
        
        set((state) => ({
          documents: [...state.documents, newDocument],
        }));
      },
      
      updateDocument: (document) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === document.id
              ? { ...document, lastUpdated: new Date() }
              : doc
          ),
        }));
      },
      
      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
        }));
      },
      
      getDocumentById: (id) => {
        return get().documents.find((doc) => doc.id === id);
      },
      
      getDocumentsByCategory: (category) => {
        return get().documents.filter((doc) => doc.category === category);
      },
      
      getLatestDocumentByCategory: (category) => {
        const categoryDocuments = get().documents.filter((doc) => doc.category === category);
        if (categoryDocuments.length === 0) return undefined;
        
        return categoryDocuments.reduce((latest, current) => {
          return new Date(latest.lastUpdated) > new Date(current.lastUpdated) ? latest : current;
        });
      },
      
      getFixedOrderDocuments: () => {
        return STRATEGIC_MATRIX_CATEGORIES.map(category => 
          get().getLatestDocumentByCategory(category)
        );
      },
    }),
    {
      name: 'strategic-matrix-storage',
      partialize: (state) => ({ documents: state.documents }),
    }
  )
);
