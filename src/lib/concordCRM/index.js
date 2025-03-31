/**
 * Concord CRM Integration
 * 
 * This module exports the main components for integrating with Concord CRM:
 * - API Client for making requests to the CRM
 * - Command Parser for understanding natural language queries
 * - Command Processor for executing commands and formatting responses
 */

export { ConcordCRMClient } from './client';
export { parseCommand, CommandType, ResourceType } from './parser';
export { processCommand } from './processor';

/**
 * Process a natural language query and execute it against the CRM
 * @param {string} query - The natural language query
 * @param {string} baseUrl - The CRM base URL
 * @param {string} apiToken - The API token
 * @returns {Promise<Object>} - The result of processing the query
 */
export async function processCRMQuery(query, baseUrl, apiToken) {
  try {
    console.log('Processing CRM query:', query);
    
    if (!query) {
      return {
        success: false,
        message: "Please provide a query to process."
      };
    }
    
    if (!baseUrl || !apiToken) {
      return {
        success: false,
        message: "CRM configuration is incomplete. Please provide both URL and API token."
      };
    }
    
    const { ConcordCRMClient } = await import('./client');
    const { parseCommand } = await import('./parser');
    const { processCommand } = await import('./processor');
    
    // Initialize the client
    const client = new ConcordCRMClient(baseUrl, apiToken);
    
    // Validate the token
    const isValid = await client.validateToken();
    if (!isValid) {
      return {
        success: false,
        message: "The API token is invalid or the CRM server is not reachable. Please check your CRM settings."
      };
    }
    
    // Parse the query
    const command = parseCommand(query);
    console.log('Parsed command:', command);
    
    if (command.type === 'unknown') {
      return {
        success: false,
        message: "I couldn't understand that command. Try asking about contacts, deals, or activities using phrases like 'list', 'show', 'find', or 'create'."
      };
    }
    
    // Process the command
    const result = await processCommand(command, client);
    console.log('Command result:', result);
    
    return result;
  } catch (error) {
    console.error('Error processing CRM query:', error);
    return {
      success: false,
      message: `Sorry, there was an error processing your request: ${error.message || 'Unknown error'}`
    };
  }
} 