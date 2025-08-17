interface DomainRule {
  domain: string;
  selectors: {
    title: string[];
    price: string[];
    image: string[];
    brand?: string[];
  };
  priceRegex?: string;
  imageFilters?: string[];
  lastUpdated: string;
  confidence: number;
}

interface FeedbackData {
  url: string;
  userCorrection: {
    itemName?: string;
    price?: string;
    imageUrl?: string;
    brand?: string;
  };
  originalParsed: any;
  timestamp: string;
}

// Default rules for common sites
const DEFAULT_RULES: DomainRule[] = [
  {
    domain: 'amazon.com',
    selectors: {
      title: ['#productTitle', 'span#productTitle', 'h1.a-size-large'],
      price: ['.a-price .a-offscreen', '.a-price-whole', '#price_inside_buybox .a-price .a-offscreen'],
      image: ['#landingImage', '#imgBlkFront', '.a-dynamic-image']
    },
    priceRegex: '\\$?(\\d+\\.?\\d*)',
    lastUpdated: new Date().toISOString(),
    confidence: 0.9
  },
  {
    domain: 'shopbop.com',
    selectors: {
      title: ['h1[data-testid="product-name"]', 'h1.product-name', '.pdp-name h1'],
      price: ['[data-testid="current-price"]', '.current-price', '.price-current'],
      image: ['img[data-testid="product-image"]', '.pdp-image img', '.product-images img']
    },
    priceRegex: '\\$(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)',
    imageFilters: ['placeholder', 'loading'],
    lastUpdated: new Date().toISOString(),
    confidence: 0.7
  },
  {
    domain: 'target.com',
    selectors: {
      title: ['h1[data-test="product-title"]', 'h1[data-automation-id="product-title"]'],
      price: ['[data-test="product-price"]', '.sr-only:contains("current price")'],
      image: ['img[data-test="hero-image"]']
    },
    priceRegex: '\\$(\\d+\\.?\\d*)',
    lastUpdated: new Date().toISOString(),
    confidence: 0.9
  }
];

class ParsingRulesStore {
  private rules: Map<string, DomainRule> = new Map();
  private feedback: FeedbackData[] = [];
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    // Load default rules
    DEFAULT_RULES.forEach(rule => {
      this.rules.set(rule.domain, rule);
    });

    // Try to load rules from Supabase storage (future enhancement)
    try {
      await this.loadRulesFromStorage();
    } catch (error) {
      console.log('No custom rules found, using defaults');
    }

    this.isInitialized = true;
  }

  async loadRulesFromStorage() {
    // This would load from Supabase storage in the future
    // For now, we'll just use localStorage as a temporary solution
    try {
      const storedRules = localStorage.getItem('parsing-rules');
      if (storedRules) {
        const rules = JSON.parse(storedRules) as DomainRule[];
        rules.forEach(rule => {
          this.rules.set(rule.domain, rule);
        });
      }
    } catch (error) {
      console.warn('Failed to load rules from storage:', error);
    }
  }

  async saveRulesToStorage() {
    // This would save to Supabase storage in the future
    try {
      const rulesArray = Array.from(this.rules.values());
      localStorage.setItem('parsing-rules', JSON.stringify(rulesArray));
    } catch (error) {
      console.warn('Failed to save rules to storage:', error);
    }
  }

  getRulesForDomain(url: string): DomainRule | null {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
      
      // Check for exact match first
      if (this.rules.has(hostname)) {
        return this.rules.get(hostname)!;
      }

      // Check for partial matches
      for (const [domain, rule] of this.rules) {
        if (hostname.includes(domain)) {
          return rule;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  async addFeedback(feedback: FeedbackData) {
    this.feedback.push(feedback);
    
    // Store feedback for future rule improvements
    try {
      const storedFeedback = localStorage.getItem('parsing-feedback');
      const feedbackArray = storedFeedback ? JSON.parse(storedFeedback) : [];
      feedbackArray.push(feedback);
      localStorage.setItem('parsing-feedback', JSON.stringify(feedbackArray));
    } catch (error) {
      console.warn('Failed to save feedback:', error);
    }

    // Try to improve rules based on feedback
    await this.improveDomainRules(feedback);
  }

  private async improveDomainRules(feedback: FeedbackData) {
    try {
      const hostname = new URL(feedback.url).hostname.replace(/^www\./, '').toLowerCase();
      const currentRule = this.getRulesForDomain(feedback.url);
      
      if (currentRule) {
        // Decrease confidence if user corrected the parsing
        const hasCorrections = Object.keys(feedback.userCorrection).length > 0;
        if (hasCorrections) {
          currentRule.confidence = Math.max(0.1, currentRule.confidence - 0.1);
          currentRule.lastUpdated = new Date().toISOString();
          await this.saveRulesToStorage();
        }
      } else {
        // Create a new rule based on user feedback
        const newRule: DomainRule = {
          domain: hostname,
          selectors: {
            title: ['h1', '.product-title', '.product-name'],
            price: ['.price', '.current-price', '[data-testid*="price"]'],
            image: ['.product-image img', '.main-image img', 'img[data-testid*="product"]']
          },
          confidence: 0.5,
          lastUpdated: new Date().toISOString()
        };
        
        this.rules.set(hostname, newRule);
        await this.saveRulesToStorage();
      }
    } catch (error) {
      console.warn('Failed to improve rules:', error);
    }
  }

  getAllRules(): DomainRule[] {
    return Array.from(this.rules.values());
  }

  updateRule(domain: string, rule: DomainRule) {
    rule.lastUpdated = new Date().toISOString();
    this.rules.set(domain, rule);
    this.saveRulesToStorage();
  }

  getFeedback(): FeedbackData[] {
    return this.feedback;
  }
}

// Singleton instance
export const rulesStore = new ParsingRulesStore();