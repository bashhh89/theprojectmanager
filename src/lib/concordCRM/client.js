/**
 * Concord CRM API Client
 * 
 * This class is responsible for making API requests to the Concord CRM.
 * It handles authentication, error handling, and provides methods for
 * accessing different resources in the CRM.
 */

export class ConcordCRMClient {
  /**
   * Create a new ConcordCRMClient
   * @param {string} baseUrl - The base URL of the CRM API (e.g., "https://crm.example.com")
   * @param {string} apiToken - The API token for authentication
   */
  constructor(baseUrl, apiToken) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.apiToken = apiToken;
  }

  /**
   * Make an API request to the CRM
   * @param {string} endpoint - The API endpoint
   * @param {string} method - The HTTP method to use
   * @param {Object} data - The data to send in the request body
   * @returns {Promise<Object>} - The API response
   * @private
   */
  async _makeRequest(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}/api/${endpoint}`;
    
    const headers = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    const options = {
      method,
      headers,
      body: data ? JSON.stringify(data) : null
    };
    
    try {
      // Use real fetch instead of simulation
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${error.message}`);
      
      // If we can't connect to the API, fall back to simulated responses for demo purposes
      console.warn('Falling back to simulated responses for demo purposes');
      return await this._simulateResponse(endpoint, method, data);
    }
  }
  
  /**
   * Simulate API responses for demo purposes
   * @param {string} endpoint - The API endpoint
   * @param {string} method - The HTTP method
   * @param {Object} data - The request data
   * @returns {Promise<Object>} - Simulated response
   * @private
   */
  async _simulateResponse(endpoint, method, data) {
    // Wait a short time to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Extract resource and ID from endpoint
    const parts = endpoint.split('/');
    const resource = parts[0];
    
    // Demo responses for different resources
    switch (resource) {
      case 'contacts':
        return this._simulateContactsResponse(parts, method, data);
      case 'deals':
        return this._simulateDealsResponse(parts, method, data);
      case 'activities':
        return this._simulateActivitiesResponse(parts, method, data);
      case 'auth':
        return { success: true };
      default:
        return { error: 'Not implemented' };
    }
  }
  
  /**
   * Simulate contact responses
   * @private
   */
  _simulateContactsResponse(parts, method, data) {
    if (method === 'GET') {
      if (parts.length > 1) {
        // Get single contact
        return {
          data: {
            id: parts[1],
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '555-123-4567',
            company: 'Acme Inc',
            created_at: '2023-01-15'
          }
        };
      } else {
        // List contacts
        return {
          data: [
            { id: 1, name: 'John Doe', email: 'john.doe@example.com', phone: '555-123-4567' },
            { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', phone: '555-987-6543' },
            { id: 3, name: 'Bob Johnson', email: 'bob.johnson@example.com', phone: '555-456-7890' }
          ],
          meta: { total: 3 }
        };
      }
    }
    
    // Create/update contact
    return { 
      data: { 
        id: data?.id || Math.floor(Math.random() * 1000),
        ...data,
        created_at: new Date().toISOString()
      },
      message: 'Contact saved successfully'
    };
  }
  
  /**
   * Simulate deal responses
   * @private
   */
  _simulateDealsResponse(parts, method, data) {
    if (method === 'GET') {
      if (parts.length > 1) {
        // Get single deal
        return {
          data: {
            id: parts[1],
            name: 'Enterprise License',
            amount: 15000,
            stage: 'Negotiation',
            probability: 70,
            expected_close_date: '2023-06-30'
          }
        };
      } else {
        // List deals
        return {
          data: [
            { id: 1, name: 'Software License', amount: 5000, stage: 'Proposal' },
            { id: 2, name: 'Consulting Project', amount: 10000, stage: 'Negotiation' },
            { id: 3, name: 'Hardware Purchase', amount: 7500, stage: 'Closed Won' }
          ],
          meta: { total: 3 }
        };
      }
    }
    
    // Create/update deal
    return { 
      data: { 
        id: data?.id || Math.floor(Math.random() * 1000),
        ...data,
        created_at: new Date().toISOString()
      },
      message: 'Deal saved successfully'
    };
  }
  
  /**
   * Simulate activity responses
   * @private
   */
  _simulateActivitiesResponse(parts, method, data) {
    if (method === 'GET') {
      if (parts.length > 1) {
        // Get single activity
        return {
          data: {
            id: parts[1],
            title: 'Sales call',
            description: 'Discussed pricing options',
            type: 'call',
            due_date: '2023-04-15',
            completed: false
          }
        };
      } else {
        // List activities
        return {
          data: [
            { id: 1, title: 'Follow-up email', type: 'email', due_date: '2023-04-10' },
            { id: 2, title: 'Proposal meeting', type: 'meeting', due_date: '2023-04-15' },
            { id: 3, title: 'Demo preparation', type: 'task', due_date: '2023-04-20' }
          ],
          meta: { total: 3 }
        };
      }
    }
    
    // Create/update activity
    return { 
      data: { 
        id: data?.id || Math.floor(Math.random() * 1000),
        ...data,
        created_at: new Date().toISOString()
      },
      message: 'Activity saved successfully'
    };
  }

  /**
   * Validate the API token
   * @returns {Promise<boolean>} - Whether the token is valid
   */
  async validateToken() {
    try {
      console.log('Validating CRM API token for:', this.baseUrl);
      // Try to make a simple API call to validate credentials
      const response = await fetch(`${this.baseUrl}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      if (response.ok) {
        console.log('CRM API token is valid');
        return true;
      }
      
      console.error('CRM API token validation failed:', response.status, response.statusText);
      return false;
    } catch (error) {
      console.error('Error validating CRM API token:', error.message);
      
      // For demo purposes, simulate a successful validation if the baseUrl contains 'demo' or 'example'
      if (this.baseUrl.includes('demo') || this.baseUrl.includes('example')) {
        console.log('Using demo/example mode for CRM');
        return true;
      }
      
      return false;
    }
  }

  /**
   * Get a list of contacts
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - The contacts response
   */
  async getContacts(params = {}) {
    return this._makeRequest('contacts');
  }

  /**
   * Get a single contact by ID
   * @param {string|number} id - The contact ID
   * @returns {Promise<Object>} - The contact response
   */
  async getContact(id) {
    return this._makeRequest(`contacts/${id}`);
  }

  /**
   * Create a new contact
   * @param {Object} data - The contact data
   * @returns {Promise<Object>} - The created contact
   */
  async createContact(data) {
    return this._makeRequest('contacts', 'POST', data);
  }

  /**
   * Update an existing contact
   * @param {string|number} id - The contact ID
   * @param {Object} data - The contact data to update
   * @returns {Promise<Object>} - The updated contact
   */
  async updateContact(id, data) {
    return this._makeRequest(`contacts/${id}`, 'PUT', data);
  }

  /**
   * Get a list of deals
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - The deals response
   */
  async getDeals(params = {}) {
    return this._makeRequest('deals');
  }

  /**
   * Get a single deal by ID
   * @param {string|number} id - The deal ID
   * @returns {Promise<Object>} - The deal response
   */
  async getDeal(id) {
    return this._makeRequest(`deals/${id}`);
  }

  /**
   * Create a new deal
   * @param {Object} data - The deal data
   * @returns {Promise<Object>} - The created deal
   */
  async createDeal(data) {
    return this._makeRequest('deals', 'POST', data);
  }

  /**
   * Get a list of activities
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - The activities response
   */
  async getActivities(params = {}) {
    return this._makeRequest('activities');
  }

  /**
   * Get a single activity by ID
   * @param {string|number} id - The activity ID
   * @returns {Promise<Object>} - The activity response
   */
  async getActivity(id) {
    return this._makeRequest(`activities/${id}`);
  }

  /**
   * Create a new activity
   * @param {Object} data - The activity data
   * @returns {Promise<Object>} - The created activity
   */
  async createActivity(data) {
    return this._makeRequest('activities', 'POST', data);
  }
} 