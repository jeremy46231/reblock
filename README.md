# reblock

React for Slack Block Kit

## Codebase Structure

- `main.ts`: Main library code, exports all functions
  - `blocks.ts`: Takes JSX JSON and converts it to blocks
    - `richText.ts`: Takes JSX JSON and converts it to rich text
    - `elements.ts`: Takes JSX JSON and converts it to elements
- `helpers.ts`: Helper functions used across the library
- `types.d.ts`: Global declarations that, in tandem with the @types/react patch, type JSX correctly
