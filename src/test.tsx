import React from 'react'
import Slack from '@slack/bolt'
import { appHome, message } from './main.ts'

let increment: () => void = () => {}

function TestComponent() {
  const [count, setCount] = React.useState(5)
  increment = () => setCount(count + 1)
  return (
    <>
      <ol>
        {Array.from({ length: count }).map((_, i) => (
          <li>{i}</li>
        ))}
      </ol>
    </>
  )
}

function AutoIncrement() {
  const [count, setCount] = React.useState(0)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCount((count) => count + 1)
    }, 2000)
    return () => clearInterval(interval)
  }, [])
  return <>{count}</>
}

const app = new Slack.App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
})

// appHome(
//   app.client,
//   'U06UYA5GMB5',
//   <>
//     <h1>Hello, world!</h1>
//     <AutoIncrement />
//   </>
// )

await message(
  app.client,
  { channel: 'C07A0RA9QSG' },
  <>
    <h1>This is a test message</h1>
    <section>
      hello world!
      <field mrkdwn>
        This is a _field_
      </field>
      <field>This is another field (not mrkdwn)</field>
      <img
        src="https://via.placeholder.com/150"
        alt="Placeholder"
      />
    </section>
    <hr />
    <rich>
      <section>
        Hello from <b>Reblock</b>!
      </section>
      <section>
        The counter is at{' '}
        <code>
          <AutoIncrement />
        </code>
        .
      </section>
    </rich>
    <actions>
      <button
        primary
        alt="Increment the counter"
      >
        Increment
      </button>
    </actions>
  </>
)

