import {
  ProcessedPrompt,
  PromptExecutionContext,
  PromptVariable,
  PromptCommand,
  SavedPrompt
} from '@/types/prompts';

/**
 * Extracts variables from a prompt template
 */
export const extractVariables = (template: string): string[] => {
  const matches = template.match(/\[(.*?)\]/g) || [];
  return matches.map(match => match.slice(1, -1));
};

/**
 * Processes a prompt template by replacing variables with their values
 */
export const processPrompt = (template: string, variables: PromptVariable[]): { content: string; variables: string[] } => {
  const extractedVars = extractVariables(template);
  const missingVars = extractedVars.filter(
    varName => !variables.find(v => v.name === varName)
  );

  if (missingVars.length > 0) {
    throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
  }

  let processedContent = template;
  variables.forEach(variable => {
    const regex = new RegExp(`\\[${variable.name}\\]`, 'g');
    processedContent = processedContent.replace(regex, variable.value);
  });

  return {
    content: processedContent,
    variables: extractedVars
  };
};

/**
 * Validates a prompt template
 */
export const validatePromptTemplate = (template: string): boolean => {
  if (!template || typeof template !== 'string') return false;
  if (template.length > 10000) return false; // Arbitrary limit
  return true;
};

/**
 * Creates a context for prompt execution
 */
export const createExecutionContext = (
  variables: PromptVariable[],
  options: Partial<PromptExecutionContext> = {}
): PromptExecutionContext => {
  return {
    variables,
    systemMessage: options.systemMessage,
    temperature: options.temperature ?? 0.7,
    maxTokens: options.maxTokens ?? 1000
  };
};

/**
 * Formats a prompt command (ensures it starts with /)
 */
export const formatCommand = (command: string): string => {
  if (!command) return '';
  return command.startsWith('/') ? command : `/${command}`;
};

/**
 * Parses a command string into a command object
 */
export const parseCommand = (commandStr: string, prompts: SavedPrompt[]): PromptCommand | null => {
  if (!commandStr.startsWith('/')) return null;

  const parts = commandStr.slice(1).split(' ');
  const command = parts[0];
  const args = parts.slice(1).join(' ');

  const prompt = prompts.find((p) => p.command === command);
  if (!prompt) return null;

  return {
    command,
    args,
    prompt
  };
};

/**
 * Formats tags for display and storage
 */
export const formatTags = (tags: string | string[]): string[] => {
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }
  return tags.filter(Boolean);
};

/**
 * Validates a prompt name
 */
export const validatePromptName = (name: string): boolean => {
  return name.length >= 3 && name.length <= 50;
};

/**
 * Validates a prompt command
 */
export const validatePromptCommand = (command: string): boolean => {
  if (!command) return true; // Command is optional
  const formatted = formatCommand(command);
  return /^\/[a-zA-Z][a-zA-Z0-9_-]*$/.test(formatted);
}; 