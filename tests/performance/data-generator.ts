/**
 * Test data generator for performance testing
 * 
 * This module provides functions for generating test data for performance testing
 * of the BatchLoader implementation.
 */

import { GraphData } from '../../src/loader/batch-loader';
import { SchemaDefinition } from '../../src/schema/types';

/**
 * Performance test schema with various vertex and edge types
 */
export const performanceTestSchema: SchemaDefinition = {
  vertices: {
    Person: {
      label: 'Person',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number' },
        email: { type: 'string' },
        active: { type: 'boolean' }
      }
    },
    Company: {
      label: 'Company',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        founded: { type: 'number' },
        industry: { type: 'string' },
        public: { type: 'boolean' }
      }
    },
    Product: {
      label: 'Product',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        price: { type: 'number', required: true },
        category: { type: 'string' },
        inStock: { type: 'boolean' }
      }
    },
    Location: {
      label: 'Location',
      properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        country: { type: 'string' }
      }
    }
  },
  edges: {
    WORKS_AT: {
      label: 'WORKS_AT',
      from: 'Person',
      to: 'Company',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        position: { type: 'string' },
        salary: { type: 'number' }
      }
    },
    KNOWS: {
      label: 'KNOWS',
      from: 'Person',
      to: 'Person',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        relationship: { type: 'string' }
      }
    },
    SELLS: {
      label: 'SELLS',
      from: 'Company',
      to: 'Product',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        price: { type: 'number' }
      }
    },
    LOCATED_AT: {
      label: 'LOCATED_AT',
      from: 'Company',
      to: 'Location',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        headquarters: { type: 'boolean' }
      }
    },
    BUYS: {
      label: 'BUYS',
      from: 'Person',
      to: 'Product',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        date: { type: 'number' },
        quantity: { type: 'number' },
        price: { type: 'number' }
      }
    },
    LIVES_AT: {
      label: 'LIVES_AT',
      from: 'Person',
      to: 'Location',
      properties: {
        from: { type: 'string', required: true },
        to: { type: 'string', required: true },
        since: { type: 'number' },
        primary: { type: 'boolean' }
      }
    }
  }
};

/**
 * Generate a random string of the specified length
 * 
 * @param length - Length of the string to generate
 * @returns Random string
 */
function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random name
 * 
 * @returns Random name
 */
function randomName(): string {
  const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Helen'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
  
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

/**
 * Generate a random email
 * 
 * @param name - Name to use as the basis for the email
 * @returns Random email
 */
function randomEmail(name: string): string {
  const domains = ['example.com', 'test.com', 'mail.com', 'domain.com', 'company.com'];
  const namePart = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
  return `${namePart}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

/**
 * Generate a random company name
 * 
 * @returns Random company name
 */
function randomCompanyName(): string {
  const prefixes = ['Tech', 'Global', 'Advanced', 'Modern', 'Future', 'Smart', 'Innovative', 'Digital', 'Cyber', 'Meta'];
  const suffixes = ['Corp', 'Inc', 'Systems', 'Solutions', 'Technologies', 'Group', 'Labs', 'Enterprises', 'Networks', 'Dynamics'];
  
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
}

/**
 * Generate a random product name
 * 
 * @returns Random product name
 */
function randomProductName(): string {
  const adjectives = ['Smart', 'Ultra', 'Pro', 'Advanced', 'Premium', 'Elite', 'Deluxe', 'Super', 'Mega', 'Hyper'];
  const nouns = ['Phone', 'Tablet', 'Laptop', 'Watch', 'TV', 'Camera', 'Speaker', 'Headphones', 'Router', 'Drone'];
  
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
}

/**
 * Generate a random location name
 * 
 * @returns Random location name
 */
function randomLocationName(): string {
  const cities = ['New York', 'London', 'Tokyo', 'Paris', 'Berlin', 'Sydney', 'Toronto', 'Singapore', 'Dubai', 'Mumbai'];
  const areas = ['Downtown', 'Uptown', 'Midtown', 'West End', 'East Side', 'North', 'South', 'Central', 'Harbor', 'Heights'];
  
  return `${cities[Math.floor(Math.random() * cities.length)]}, ${areas[Math.floor(Math.random() * areas.length)]}`;
}

/**
 * Generate test data for performance testing
 * 
 * @param options - Options for generating test data
 * @returns Generated graph data
 */
export function generatePerformanceTestData(options: {
  personCount?: number;
  companyCount?: number;
  productCount?: number;
  locationCount?: number;
  knowsEdgeDensity?: number;
  worksAtEdgesPerPerson?: number;
  sellsEdgesPerCompany?: number;
  buysEdgesPerPerson?: number;
  locatedAtEdgesPerCompany?: number;
  livesAtEdgesPerPerson?: number;
} = {}): GraphData {
  // Set default values
  const personCount = options.personCount || 1000;
  const companyCount = options.companyCount || 100;
  const productCount = options.productCount || 500;
  const locationCount = options.locationCount || 200;
  const knowsEdgeDensity = options.knowsEdgeDensity || 0.01; // 1% of possible person-to-person connections
  const worksAtEdgesPerPerson = options.worksAtEdgesPerPerson || 1;
  const sellsEdgesPerCompany = options.sellsEdgesPerCompany || 5;
  const buysEdgesPerPerson = options.buysEdgesPerPerson || 3;
  const locatedAtEdgesPerCompany = options.locatedAtEdgesPerCompany || 2;
  const livesAtEdgesPerPerson = options.livesAtEdgesPerPerson || 1;
  
  // Initialize graph data
  const graphData: GraphData = {
    vertices: {
      Person: [],
      Company: [],
      Product: [],
      Location: []
    },
    edges: {
      WORKS_AT: [],
      KNOWS: [],
      SELLS: [],
      LOCATED_AT: [],
      BUYS: [],
      LIVES_AT: []
    }
  };
  
  // Generate Person vertices
  for (let i = 0; i < personCount; i++) {
    const name = randomName();
    graphData.vertices.Person.push({
      id: `person-${i}`,
      name,
      age: 20 + Math.floor(Math.random() * 50),
      email: randomEmail(name),
      active: Math.random() > 0.2 // 80% active
    });
  }
  
  // Generate Company vertices
  for (let i = 0; i < companyCount; i++) {
    graphData.vertices.Company.push({
      id: `company-${i}`,
      name: randomCompanyName(),
      founded: 1950 + Math.floor(Math.random() * 70),
      industry: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'][Math.floor(Math.random() * 5)],
      public: Math.random() > 0.5 // 50% public
    });
  }
  
  // Generate Product vertices
  for (let i = 0; i < productCount; i++) {
    graphData.vertices.Product.push({
      id: `product-${i}`,
      name: randomProductName(),
      price: 10 + Math.floor(Math.random() * 990),
      category: ['Electronics', 'Clothing', 'Food', 'Home', 'Sports'][Math.floor(Math.random() * 5)],
      inStock: Math.random() > 0.3 // 70% in stock
    });
  }
  
  // Generate Location vertices
  for (let i = 0; i < locationCount; i++) {
    graphData.vertices.Location.push({
      id: `location-${i}`,
      name: randomLocationName(),
      latitude: (Math.random() * 180) - 90,
      longitude: (Math.random() * 360) - 180,
      country: ['USA', 'UK', 'Japan', 'Germany', 'France', 'Australia', 'Canada', 'China', 'India', 'Brazil'][Math.floor(Math.random() * 10)]
    });
  }
  
  // Generate WORKS_AT edges
  for (let i = 0; i < personCount; i++) {
    for (let j = 0; j < worksAtEdgesPerPerson; j++) {
      if (j >= companyCount) break; // Can't have more edges than companies
      
      const companyIndex = (i + j) % companyCount;
      graphData.edges.WORKS_AT.push({
        from: `person-${i}`,
        to: `company-${companyIndex}`,
        since: 2000 + Math.floor(Math.random() * 20),
        position: ['Manager', 'Developer', 'Designer', 'Analyst', 'Director'][Math.floor(Math.random() * 5)],
        salary: 30000 + Math.floor(Math.random() * 120000)
      });
    }
  }
  
  // Generate KNOWS edges
  for (let i = 0; i < personCount; i++) {
    for (let j = 0; j < personCount; j++) {
      if (i !== j && Math.random() < knowsEdgeDensity) {
        graphData.edges.KNOWS.push({
          from: `person-${i}`,
          to: `person-${j}`,
          since: 2000 + Math.floor(Math.random() * 20),
          relationship: ['Friend', 'Colleague', 'Family', 'Acquaintance'][Math.floor(Math.random() * 4)]
        });
      }
    }
  }
  
  // Generate SELLS edges
  for (let i = 0; i < companyCount; i++) {
    for (let j = 0; j < sellsEdgesPerCompany; j++) {
      if (j >= productCount) break; // Can't have more edges than products
      
      const productIndex = (i * sellsEdgesPerCompany + j) % productCount;
      graphData.edges.SELLS.push({
        from: `company-${i}`,
        to: `product-${productIndex}`,
        since: 2000 + Math.floor(Math.random() * 20),
        price: 10 + Math.floor(Math.random() * 990)
      });
    }
  }
  
  // Generate LOCATED_AT edges
  for (let i = 0; i < companyCount; i++) {
    for (let j = 0; j < locatedAtEdgesPerCompany; j++) {
      if (j >= locationCount) break; // Can't have more edges than locations
      
      const locationIndex = (i * locatedAtEdgesPerCompany + j) % locationCount;
      graphData.edges.LOCATED_AT.push({
        from: `company-${i}`,
        to: `location-${locationIndex}`,
        since: 1980 + Math.floor(Math.random() * 40),
        headquarters: j === 0 // First location is headquarters
      });
    }
  }
  
  // Generate BUYS edges
  for (let i = 0; i < personCount; i++) {
    for (let j = 0; j < buysEdgesPerPerson; j++) {
      if (j >= productCount) break; // Can't have more edges than products
      
      const productIndex = (i * buysEdgesPerPerson + j) % productCount;
      graphData.edges.BUYS.push({
        from: `person-${i}`,
        to: `product-${productIndex}`,
        date: Date.now() - Math.floor(Math.random() * 31536000000), // Random date in the last year
        quantity: 1 + Math.floor(Math.random() * 5),
        price: 10 + Math.floor(Math.random() * 990)
      });
    }
  }
  
  // Generate LIVES_AT edges
  for (let i = 0; i < personCount; i++) {
    for (let j = 0; j < livesAtEdgesPerPerson; j++) {
      if (j >= locationCount) break; // Can't have more edges than locations
      
      const locationIndex = (i * livesAtEdgesPerPerson + j) % locationCount;
      graphData.edges.LIVES_AT.push({
        from: `person-${i}`,
        to: `location-${locationIndex}`,
        since: 2000 + Math.floor(Math.random() * 20),
        primary: j === 0 // First location is primary
      });
    }
  }
  
  return graphData;
}
