/** @type {import('prettier').Config} */
module.exports = {
  // Core formatting options
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  
  // JSX formatting
  jsxSingleQuote: true,
  jsxBracketSameLine: false,
  
  // Trailing commas (helpful for git diffs)
  trailingComma: 'es5',
  
  // Object spacing
  bracketSpacing: true,
  
  // Arrow function parentheses
  arrowParens: 'avoid',
  
  // Prose wrapping (for markdown files)
  proseWrap: 'preserve',
  
  // HTML whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',
  
  // Line endings (auto-detect based on existing files)
  endOfLine: 'auto',
  
  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',
  
  // Plugin configurations
  plugins: [],
  
  // Override settings for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        tabWidth: 2,
        printWidth: 80,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: '*.{css,scss}',
      options: {
        singleQuote: false,
      },
    },
    {
      files: '*.{yml,yaml}',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};