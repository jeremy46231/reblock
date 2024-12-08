import React from 'react'
import Slack from '@slack/bolt'
import Reblock from './main.ts'

function Counter() {
  const [count, setCount] = React.useState(0)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCount((count) => count + 1)
    }, 2000)
    return () => clearInterval(interval)
  }, [])
  return <>{count}</>
}

function Increment() {
  const [count, setCount] = React.useState(0)
  return (
    <>
      <rich>
        <section>
          Count: <code>{count}</code>
        </section>
      </rich>
      <actions>
        <button
          onEvent={(event) => {
            setCount((count) => count + 1)
          }}
        >
          Increment
        </button>
      </actions>
    </>
  )
}

const app = new Slack.App({
  socketMode: true,
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
})
await app.start()

Reblock.appHome(app, (userID) => (
  <>
    <rich>
      <section>
        Hello <user>{userID}</user>! The timer is at{' '}
        <code>
          <Counter />
        </code>
        .
      </section>
    </rich>
    <Increment />
  </>
))
