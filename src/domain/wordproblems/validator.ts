import type { ValidationResult } from './types';

/**
 * Safely evaluates a mathematical expression string.
 * Only allows numbers, +, -, *, /, and parentheses.
 * Returns the computed result or null if invalid.
 */
export function validateSolution(solution: string, expectedAnswer: number): ValidationResult {
  // Empty solution is invalid
  if (!solution || solution.trim() === '') {
    return {
      isValid: false,
      error: 'Solution is empty',
    };
  }

  // Remove all whitespace
  const cleanSolution = solution.replace(/\s+/g, '');

  // Validate that the expression only contains safe characters
  const safePattern = /^[0-9+\-*/().]+$/;
  if (!safePattern.test(cleanSolution)) {
    return {
      isValid: false,
      error: 'Solution contains invalid characters',
    };
  }

  try {
    // Parse and evaluate the expression
    const computed = evaluateExpression(cleanSolution);

    // Check if the computed answer matches the expected answer
    const isValid = Math.abs(computed - expectedAnswer) < 0.0001; // Handle floating point precision

    return {
      isValid,
      computedAnswer: computed,
      error: isValid ? undefined : `Solution evaluates to ${computed}, but expected ${expectedAnswer}`,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Failed to evaluate solution',
    };
  }
}

/**
 * Safely evaluates a mathematical expression using operator precedence.
 * Only supports +, -, *, /, and parentheses.
 */
function evaluateExpression(expr: string): number {
  // Tokenize the expression
  const tokens = tokenize(expr);
  
  // Parse and evaluate with proper operator precedence
  return parseExpression(tokens);
}

/**
 * Tokenizes a mathematical expression into an array of tokens.
 */
function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let currentNumber = '';

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];

    if (char >= '0' && char <= '9') {
      currentNumber += char;
    } else {
      if (currentNumber) {
        tokens.push(currentNumber);
        currentNumber = '';
      }
      if (char === '+' || char === '-' || char === '*' || char === '/' || char === '(' || char === ')') {
        tokens.push(char);
      }
    }
  }

  if (currentNumber) {
    tokens.push(currentNumber);
  }

  return tokens;
}

/**
 * Parses and evaluates an expression with proper operator precedence.
 * Uses recursive descent parsing.
 */
function parseExpression(tokens: string[]): number {
  let index = 0;

  function peek(): string | undefined {
    return tokens[index];
  }

  function consume(): string {
    return tokens[index++];
  }

  // Parse addition and subtraction (lowest precedence)
  function parseAddSub(): number {
    let left = parseMulDiv();

    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseMulDiv();
      if (op === '+') {
        left = left + right;
      } else {
        left = left - right;
      }
    }

    return left;
  }

  // Parse multiplication and division (higher precedence)
  function parseMulDiv(): number {
    let left = parsePrimary();

    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const right = parsePrimary();
      if (op === '*') {
        left = left * right;
      } else {
        if (right === 0) {
          throw new Error('Division by zero');
        }
        left = left / right;
      }
    }

    return left;
  }

  // Parse primary expressions (numbers and parentheses)
  function parsePrimary(): number {
    const token = peek();

    if (!token) {
      throw new Error('Unexpected end of expression');
    }

    // Handle parentheses
    if (token === '(') {
      consume(); // consume '('
      const result = parseAddSub();
      if (peek() !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      consume(); // consume ')'
      return result;
    }

    // Handle negative numbers
    if (token === '-') {
      consume();
      return -parsePrimary();
    }

    // Handle positive sign (optional)
    if (token === '+') {
      consume();
      return parsePrimary();
    }

    // Handle numbers
    const num = parseFloat(consume());
    if (isNaN(num)) {
      throw new Error(`Invalid number: ${token}`);
    }
    return num;
  }

  const result = parseAddSub();

  // Ensure all tokens were consumed
  if (index < tokens.length) {
    throw new Error(`Unexpected token: ${tokens[index]}`);
  }

  return result;
}

/**
 * Validates all problems in a dataset.
 * Returns an array of problems with validation errors.
 */
export function validateProblemsDataset(
  problems: Array<{ id: string; solution: string; answer: number }>
): Array<{ id: string; error: string; solution: string; answer: number }> {
  const errors: Array<{ id: string; error: string; solution: string; answer: number }> = [];

  for (const problem of problems) {
    const result = validateSolution(problem.solution, problem.answer);
    if (!result.isValid) {
      errors.push({
        id: problem.id,
        error: result.error || 'Unknown error',
        solution: problem.solution,
        answer: problem.answer,
      });
    }
  }

  return errors;
}