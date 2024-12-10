# Reblock

Reblock is a library for building interactive Slack surfaces with React and Slack Bolt. You can use all of the familiar features of React, like hooks and context, to build Slack modals, messages, and home tabs, without dealing with the complicated, cumbersome JSON or implementing your own interactivity and state management.

```tsx
import Reblock from 'reblock-js'
import { useState } from 'react'

function Increment() {
  const [count, setCount] = useState(0)
  return (
    <>
      <rich>
        Count: <code>{count}</code>
      </rich>
      <button onEvent={() => setCount(count + 1)}>Increment</button>
    </>
  )
}

Reblock.appHome(app, (userID) => (
  <>
    <rich>
      Hello <user>{userID}</user>!
    </rich>
    <Increment />
  </>
))
```

## Setup

First, install Reblock from NPM.

```bash
$ bun i reblock-js
$ npm i reblock-js
$ yarn add reblock-js
```

Then, import the library. You can use the default export or import individual functions and types.

```tsx
/** @jsxImportSource reblock-js */
import Reblock from 'reblock-js'
import { appHome } from 'reblock-js'
```

The comment is needed for the correct JSX types to load, but it isn't needed for the code to run. You can also add jsxImportSource to your tsconfig.json.

```json
{
  "compilerOptions": {
    // other options...
    // if using bun, see https://bun.sh/docs/typescript#suggested-compileroptions

    "jsx": "react-jsx",
    "jsxImportSource": "reblock-js"
  }
}
```

## Documentation

Coming soon, hopefully! The functions are typed, and all the elements are typed, but TypeScript doesn't allow you to restrict what elements can go in what other elements. For now, message me for help!

## Contributing

Contributions and bug reports are welcome! If you are in the [Hack Club Slack](https://hackclub.com/slack), you can also DM me ([@Jeremy](https://hackclub.slack.com/team/U06UYA5GMB5)) with any feedback or questions. If you make something cool with Reblock, please let me know!

### Codebase Structure

- `main.ts`: Main library code, exports all functions
- `helpers.ts`: Helper functions used across the library
- `events.ts`: Sets up event listeners for Slack events
- `renderer.ts`: Takes React components and, with [`react-reconciler`](https://www.npmjs.com/package/react-reconciler), converts it to a JSX object tree
- `jsx/`: Contains all the functions for converting the JSX object tree to Slack Block Kit JSON
  - `blocks.ts`: Converts JSX objects to blocks
  - `richText.ts`: Converts JSX objects to rich text
  - `elements.ts`: Converts JSX objects to elements
- `surfaces/`: Contains the Root classes which connect React to different Slack surfaces
  - `home.ts`: Renders to the App Home
  - `message.ts`: Renders to a message
  - `modal.ts`: Renders to a modal
  - `blocks.ts`: Renders to Block Kit JSON (non-interactive)
- `jsx-runtime/`: Re-exports React's JSX runtime with Reblock types
  - `jsx-types.ts`: Types for the JSX namespace
  - `jsx-runtime.ts`: Re-exports `react/jsx-runtime` with Reblock types
  - `jsx-dev-runtime.ts`: Re-exports `react/jsx-dev-runtime` with Reblock types
