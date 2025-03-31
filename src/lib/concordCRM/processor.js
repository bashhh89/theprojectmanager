/**
 * Command Processor for Concord CRM
 * 
 * This module processes structured commands and executes them using the CRM client.
 * It handles the translation between command objects and API calls, and formats
 * the response data into user-friendly messages.
 */

import { CommandType, ResourceType } from './parser';

/**
 * Process a command and execute it using the CRM client
 * @param {Object} command - The command to process
 * @param {Object} client - The CRM client instance
 * @returns {Promise<Object>} - The result of processing the command
 */
export async function processCommand(command, client) {
  try {
    console.log('Processing command:', command);
    
    // Execute the command based on type and resource
    let result;
    
    switch (command.type) {
      case CommandType.LIST:
        result = await processList(command, client);
        break;
      case CommandType.GET:
        result = await processGet(command, client);
        break;
      case CommandType.COUNT:
        result = await processCount(command, client);
        break;
      case CommandType.SEARCH:
        result = await processSearch(command, client);
        break;
      case CommandType.CREATE:
        result = await processCreate(command, client);
        break;
      case CommandType.UPDATE:
        result = await processUpdate(command, client);
        break;
      case CommandType.DELETE:
        result = await processDelete(command, client);
        break;
      case CommandType.SUMMARIZE:
        result = await processSummarize(command, client);
        break;
      default:
        return {
          success: false,
          message: "I don't understand that command. Try asking about contacts, deals, or activities."
        };
    }
    
    return result;
  } catch (error) {
    console.error('Error processing command:', error);
    return {
      success: false,
      message: `Error processing your request: ${error.message}`
    };
  }
}

/**
 * Process a LIST command
 * @param {Object} command - The command to process
 * @param {Object} client - The CRM client
 * @returns {Promise<Object>} - The result
 * @private
 */
async function processList(command, client) {
  const { resource, filters } = command;
  
  let data;
  let message;
  
  switch (resource) {
    case ResourceType.CONTACT:
      data = await client.getContacts(filters);
      message = formatContactsList(data.data);
      break;
    case ResourceType.DEAL:
      data = await client.getDeals(filters);
      message = formatDealsList(data.data);
      break;
    case ResourceType.ACTIVITY:
      data = await client.getActivities(filters);
      message = formatActivitiesList(data.data);
      break;
    default:
      return {
        success: false,
        message: "Please specify what you want to list (contacts, deals, or activities)."
      };
  }
  
  return {
    success: true,
    message,
    data: data.data
  };
}

/**
 * Process a GET command
 * @param {Object} command - The command to process
 * @param {Object} client - The CRM client
 * @returns {Promise<Object>} - The result
 * @private
 */
async function processGet(command, client) {
  const { resource, id } = command;
  
  if (!id) {
    return {
      success: false,
      message: "Please specify the ID of the resource you want to retrieve."
    };
  }
  
  let data;
  let message;
  
  switch (resource) {
    case ResourceType.CONTACT:
      data = await client.getContact(id);
      message = formatContact(data.data);
      break;
    case ResourceType.DEAL:
      data = await client.getDeal(id);
      message = formatDeal(data.data);
      break;
    case ResourceType.ACTIVITY:
      data = await client.getActivity(id);
      message = formatActivity(data.data);
      break;
    default:
      return {
        success: false,
        message: "Please specify what you want to get (contact, deal, or activity)."
      };
  }
  
  return {
    success: true,
    message,
    data: data.data
  };
}

/**
 * Process a COUNT command
 * @param {Object} command - The command to process
 * @param {Object} client - The CRM client
 * @returns {Promise<Object>} - The result
 * @private
 */
async function processCount(command, client) {
  const { resource, filters } = command;
  
  let data;
  let message;
  
  switch (resource) {
    case ResourceType.CONTACT:
      data = await client.getContacts(filters);
      message = `You have ${data.meta.total} contacts in your CRM.`;
      break;
    case ResourceType.DEAL:
      data = await client.getDeals(filters);
      message = `You have ${data.meta.total} deals in your CRM.`;
      break;
    case ResourceType.ACTIVITY:
      data = await client.getActivities(filters);
      message = `You have ${data.meta.total} activities in your CRM.`;
      break;
    default:
      return {
        success: false,
        message: "Please specify what you want to count (contacts, deals, or activities)."
      };
  }
  
  return {
    success: true,
    message,
    count: data.meta.total
  };
}

/**
 * Process a SEARCH command
 * @param {Object} command - The command to process
 * @param {Object} client - The CRM client
 * @returns {Promise<Object>} - The result
 * @private
 */
async function processSearch(command, client) {
  const { resource, filters } = command;
  
  if (Object.keys(filters).length === 0) {
    return {
      success: false,
      message: "Please specify what you're searching for. For example: 'find contacts with name John' or 'search for deals with amount greater than 1000'"
    };
  }
  
  // For now, search uses the same endpoints as list but with filters
  return processList(command, client);
}

/**
 * Process a CREATE command
 * @param {Object} command - The command to process
 * @param {Object} client - The CRM client
 * @returns {Promise<Object>} - The result
 * @private
 */
async function processCreate(command, client) {
  const { resource, data } = command;
  
  if (!data || Object.keys(data).length === 0) {
    return {
      success: false,
      message: "Please specify the details for what you want to create."
    };
  }
  
  let result;
  let message;
  
  switch (resource) {
    case ResourceType.CONTACT:
      result = await client.createContact(data);
      message = `Contact created successfully: ${data.name || 'New contact'}`;
      break;
    case ResourceType.DEAL:
      result = await client.createDeal(data);
      message = `Deal created successfully: ${data.name || 'New deal'}`;
      break;
    case ResourceType.ACTIVITY:
      result = await client.createActivity(data);
      message = `Activity created successfully: ${data.title || 'New activity'}`;
      break;
    default:
      return {
        success: false,
        message: "Please specify what you want to create (contact, deal, or activity)."
      };
  }
  
  return {
    success: true,
    message,
    data: result.data
  };
}

/**
 * Process an UPDATE command
 * @param {Object} command - The command to process
 * @param {Object} client - The CRM client
 * @returns {Promise<Object>} - The result
 * @private
 */
async function processUpdate(command, client) {
  const { resource, id, data } = command;
  
  if (!id) {
    return {
      success: false,
      message: "Please specify the ID of the item you want to update."
    };
  }
  
  if (!data || Object.keys(data).length === 0) {
    return {
      success: false,
      message: "Please specify what you want to update."
    };
  }
  
  let result;
  let message;
  
  switch (resource) {
    case ResourceType.CONTACT:
      result = await client.updateContact(id, data);
      message = `Contact updated successfully.`;
      break;
    case ResourceType.DEAL:
      result = await client.updateDeal(id, data);
      message = `Deal updated successfully.`;
      break;
    case ResourceType.ACTIVITY:
      result = await client.updateActivity(id, data);
      message = `Activity updated successfully.`;
      break;
    default:
      return {
        success: false,
        message: "Please specify what you want to update (contact, deal, or activity)."
      };
  }
  
  return {
    success: true,
    message,
    data: result.data
  };
}

/**
 * Process a DELETE command
 * @param {Object} command - The command to process
 * @param {Object} client - The CRM client
 * @returns {Promise<Object>} - The result
 * @private
 */
async function processDelete(command, client) {
  // For demonstration purposes, we'll just simulate success
  // In a real implementation, you would call the appropriate delete method
  return {
    success: true,
    message: `Deletion functionality is limited in this demo version.`
  };
}

/**
 * Process a SUMMARIZE command
 * @param {Object} command - The command to process
 * @param {Object} client - The CRM client
 * @returns {Promise<Object>} - The result
 * @private
 */
async function processSummarize(command, client) {
  const { resource } = command;
  
  let contactsData, dealsData, activitiesData;
  let message = "CRM Summary:\n\n";
  
  // Get contacts count
  contactsData = await client.getContacts();
  message += `Contacts: ${contactsData.meta.total}\n`;
  
  // Get deals count 
  dealsData = await client.getDeals();
  message += `Deals: ${dealsData.meta.total}\n`;
  
  // Get activities count
  activitiesData = await client.getActivities();
  message += `Activities: ${activitiesData.meta.total}\n`;
  
  return {
    success: true,
    message
  };
}

/**
 * Format a list of contacts for display
 * @param {Array} contacts - The contacts to format
 * @returns {string} - Formatted message
 * @private
 */
function formatContactsList(contacts) {
  if (!contacts || contacts.length === 0) {
    return "No contacts found.";
  }
  
  let message = `Found ${contacts.length} contacts:\n\n`;
  
  contacts.forEach(contact => {
    message += `- ${contact.name} | ${contact.email || 'No email'} | ${contact.phone || 'No phone'}\n`;
  });
  
  return message;
}

/**
 * Format a list of deals for display
 * @param {Array} deals - The deals to format
 * @returns {string} - Formatted message
 * @private
 */
function formatDealsList(deals) {
  if (!deals || deals.length === 0) {
    return "No deals found.";
  }
  
  let message = `Found ${deals.length} deals:\n\n`;
  
  deals.forEach(deal => {
    message += `- ${deal.name} | $${deal.amount || 0} | Stage: ${deal.stage || 'Not set'}\n`;
  });
  
  return message;
}

/**
 * Format a list of activities for display
 * @param {Array} activities - The activities to format
 * @returns {string} - Formatted message
 * @private
 */
function formatActivitiesList(activities) {
  if (!activities || activities.length === 0) {
    return "No activities found.";
  }
  
  let message = `Found ${activities.length} activities:\n\n`;
  
  activities.forEach(activity => {
    message += `- ${activity.title} | Type: ${activity.type || 'Task'} | Due: ${activity.due_date || 'Not set'}\n`;
  });
  
  return message;
}

/**
 * Format a single contact for display
 * @param {Object} contact - The contact to format
 * @returns {string} - Formatted message
 * @private
 */
function formatContact(contact) {
  if (!contact) {
    return "Contact not found.";
  }
  
  return `
Contact Details:
ID: ${contact.id}
Name: ${contact.name}
Email: ${contact.email || 'Not provided'}
Phone: ${contact.phone || 'Not provided'}
Company: ${contact.company || 'Not provided'}
Created: ${contact.created_at || 'Unknown'}
  `.trim();
}

/**
 * Format a single deal for display
 * @param {Object} deal - The deal to format
 * @returns {string} - Formatted message
 * @private
 */
function formatDeal(deal) {
  if (!deal) {
    return "Deal not found.";
  }
  
  return `
Deal Details:
ID: ${deal.id}
Name: ${deal.name}
Amount: $${deal.amount || 0}
Stage: ${deal.stage || 'Not set'}
Probability: ${deal.probability || 0}%
Expected Close: ${deal.expected_close_date || 'Not set'}
  `.trim();
}

/**
 * Format a single activity for display
 * @param {Object} activity - The activity to format
 * @returns {string} - Formatted message
 * @private
 */
function formatActivity(activity) {
  if (!activity) {
    return "Activity not found.";
  }
  
  return `
Activity Details:
ID: ${activity.id}
Title: ${activity.title}
Description: ${activity.description || 'None'}
Type: ${activity.type || 'Task'}
Due Date: ${activity.due_date || 'Not set'}
Completed: ${activity.completed ? 'Yes' : 'No'}
  `.trim();
} 