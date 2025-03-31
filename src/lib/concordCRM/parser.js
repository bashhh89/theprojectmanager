/**
 * Command Parser for Concord CRM
 * 
 * This module parses natural language queries into structured commands
 * that can be executed against the CRM API.
 */

/**
 * Command types that can be performed on CRM resources
 */
export const CommandType = {
  LIST: 'list',
  GET: 'get',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  COUNT: 'count',
  SEARCH: 'search',
  SUMMARIZE: 'summarize',
  UNKNOWN: 'unknown'
};

/**
 * Resource types available in the CRM
 */
export const ResourceType = {
  CONTACT: 'contact',
  DEAL: 'deal',
  ACTIVITY: 'activity',
  TASK: 'task',
  COMPANY: 'company',
  UNKNOWN: 'unknown'
};

/**
 * Command object that represents a parsed CRM command
 * @typedef {Object} Command
 * @property {string} type - The command type (list, get, create, etc.)
 * @property {string} resource - The resource type (contact, deal, activity, etc.)
 * @property {number|string|null} id - The resource ID, if applicable
 * @property {Object|null} filters - Filters to apply to the command
 * @property {Object|null} data - Data for create/update operations
 * @property {string} originalQuery - The original natural language query
 */

/**
 * Parse a natural language query into a structured command
 * @param {string} query - The natural language query
 * @returns {Command} - The parsed command
 */
export function parseCommand(query) {
  // Convert to lowercase for easier matching
  const lowerQuery = query.toLowerCase();
  
  // Default command structure
  const command = {
    type: CommandType.UNKNOWN,
    resource: ResourceType.UNKNOWN,
    id: null,
    filters: {},
    data: null,
    originalQuery: query
  };
  
  // Determine command type
  if (containsAny(lowerQuery, ['list', 'show', 'get all', 'find all', 'display'])) {
    command.type = CommandType.LIST;
  } else if (containsAny(lowerQuery, ['count', 'how many', 'total number'])) {
    command.type = CommandType.COUNT;
  } else if (containsAny(lowerQuery, ['search', 'find', 'lookup'])) {
    command.type = CommandType.SEARCH;
  } else if (containsAny(lowerQuery, ['create', 'add', 'new'])) {
    command.type = CommandType.CREATE;
  } else if (containsAny(lowerQuery, ['update', 'edit', 'change', 'modify'])) {
    command.type = CommandType.UPDATE;
  } else if (containsAny(lowerQuery, ['delete', 'remove'])) {
    command.type = CommandType.DELETE;
  } else if (containsAny(lowerQuery, ['summarize', 'summary'])) {
    command.type = CommandType.SUMMARIZE;
  }
  
  // Determine resource type
  if (containsAny(lowerQuery, ['contact', 'person', 'lead', 'client', 'customer'])) {
    command.resource = ResourceType.CONTACT;
  } else if (containsAny(lowerQuery, ['deal', 'opportunity', 'sale'])) {
    command.resource = ResourceType.DEAL;
  } else if (containsAny(lowerQuery, ['activity', 'event', 'meeting', 'call'])) {
    command.resource = ResourceType.ACTIVITY;
  } else if (containsAny(lowerQuery, ['task', 'todo'])) {
    command.resource = ResourceType.TASK;
  } else if (containsAny(lowerQuery, ['company', 'business', 'organization'])) {
    command.resource = ResourceType.COMPANY;
  }
  
  // Extract ID if present (looking for patterns like "contact with id 123" or "contact #123")
  const idMatch = lowerQuery.match(/(?:with id|id|#)\s*(\d+)/i);
  if (idMatch) {
    command.id = idMatch[1];
  }
  
  // Extract search filters
  command.filters = extractFilters(lowerQuery);
  
  // For create/update commands, extract structured data
  if (command.type === CommandType.CREATE || command.type === CommandType.UPDATE) {
    command.data = extractData(lowerQuery, command.resource);
  }
  
  return command;
}

/**
 * Check if a string contains any of the given keywords
 * @param {string} str - The string to check
 * @param {string[]} keywords - The keywords to look for
 * @returns {boolean} - Whether the string contains any of the keywords
 * @private
 */
function containsAny(str, keywords) {
  return keywords.some(keyword => str.includes(keyword));
}

/**
 * Extract filters from a natural language query
 * @param {string} query - The query to extract filters from
 * @returns {Object} - The extracted filters
 * @private
 */
function extractFilters(query) {
  const filters = {};
  
  // Look for common filter patterns
  const nameMatch = query.match(/name (?:is|=|:)\s*["']?([^"']+)["']?/i);
  if (nameMatch) {
    filters.name = nameMatch[1].trim();
  }
  
  const emailMatch = query.match(/email (?:is|=|:)\s*["']?([^"']+@[^"']+)["']?/i);
  if (emailMatch) {
    filters.email = emailMatch[1].trim();
  }
  
  const phoneMatch = query.match(/phone (?:is|=|:)\s*["']?([^"']+)["']?/i);
  if (phoneMatch) {
    filters.phone = phoneMatch[1].trim();
  }
  
  // Date filters
  const createdAfterMatch = query.match(/created after\s*["']?([^"']+)["']?/i);
  if (createdAfterMatch) {
    filters.created_after = createdAfterMatch[1].trim();
  }
  
  const amountMatch = query.match(/amount (?:greater than|>)\s*(\d+)/i);
  if (amountMatch) {
    filters.amount_min = parseInt(amountMatch[1]);
  }
  
  return filters;
}

/**
 * Extract structured data for create/update operations
 * @param {string} query - The query to extract data from
 * @param {string} resourceType - The resource type
 * @returns {Object|null} - The extracted data
 * @private
 */
function extractData(query, resourceType) {
  // This is a simplified implementation
  // In a real-world scenario, you would use NLP to extract entities and relationships
  
  const data = {};
  
  if (resourceType === ResourceType.CONTACT) {
    const nameMatch = query.match(/name (?:is|=|:|as)\s*["']?([^"']+)["']?/i);
    if (nameMatch) {
      data.name = nameMatch[1].trim();
    }
    
    const emailMatch = query.match(/email (?:is|=|:|as)\s*["']?([^"']+@[^"']+)["']?/i);
    if (emailMatch) {
      data.email = emailMatch[1].trim();
    }
    
    const phoneMatch = query.match(/phone (?:is|=|:|as)\s*["']?([^"']+)["']?/i);
    if (phoneMatch) {
      data.phone = phoneMatch[1].trim();
    }
    
    const companyMatch = query.match(/(?:company|organization) (?:is|=|:|as)\s*["']?([^"']+)["']?/i);
    if (companyMatch) {
      data.company = companyMatch[1].trim();
    }
  } else if (resourceType === ResourceType.DEAL) {
    const nameMatch = query.match(/name (?:is|=|:|as)\s*["']?([^"']+)["']?/i);
    if (nameMatch) {
      data.name = nameMatch[1].trim();
    }
    
    const amountMatch = query.match(/amount (?:is|=|:|as)\s*["']?(\d+)["']?/i);
    if (amountMatch) {
      data.amount = parseInt(amountMatch[1]);
    }
    
    const stageMatch = query.match(/stage (?:is|=|:|as)\s*["']?([^"']+)["']?/i);
    if (stageMatch) {
      data.stage = stageMatch[1].trim();
    }
  }
  
  return Object.keys(data).length > 0 ? data : null;
} 