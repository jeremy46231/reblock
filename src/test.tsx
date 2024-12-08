import React from 'react'
import Slack from '@slack/bolt'
import * as Reblock from './main.ts'
import { registerEvents } from './events.ts'

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

function Increment() {
  const [count, setCount] = React.useState(0)
  const [users, setUsers] = React.useState([] as string[])
  return (
    <>
      <rich>
        <section>
          Count: <code>{count}</code>
        </section>
        <section>Users: {...users.map((user) => <user>{user}</user>)}</section>
      </rich>
      <actions>
        <button
          onEvent={(event) => {
            setCount((count) => count + 1)
            setUsers((users) => {
              return [...new Set([...users, event.user.id])].sort()
            })
          }}
        >
          Increment
        </button>
      </actions>
    </>
  )
}

function ModalButton() {
  const [log, setLog] = React.useState([] as React.ReactNode[])
  return (
    <>
      <actions>
        <button
          onEvent={async (event, client) => {
            setLog((log) => [
              ...log,
              <>
                Modal opened by <user>{event.user.id}</user>
              </>,
            ])
            await Reblock.modal(
              client,
              event.trigger_id,
              'Hello, world!',
              <>
                <h1>Hello, world!</h1>
                <AutoIncrement />
              </>,
              (event) =>
                setLog((log) => [
                  ...log,
                  <>
                    Modal closed by <user>{event.user.id}</user>
                  </>,
                ])
            )
          }}
        >
          Open modal
        </button>
      </actions>
      <rich>
        <section>Log:</section>
        <ol>
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </rich>
    </>
  )
}

const app = new Slack.App({
  socketMode: true,
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
})
registerEvents(app)
await app.start()

// appHome(
//   app.client,
//   'U06UYA5GMB5',
//   <>
//     <h1>Hello, world!</h1>
//     <AutoIncrement />
//   </>
// )

// const channel = 'U06UYA5GMB5' // me
// const channel = 'C07FFUNMXUG' // jeremy-rambles
const channel = 'C07A0RA9QSG' // jeremy-test

const messageHandle = await Reblock.message(
  app.client,
  channel,
  <>
    <messagetext>Hello from Reblock!</messagetext>
    <rich>
      <section>
        Hello from <b>Reblock</b>!
      </section>
    </rich>
    <rich>
      <section>
        Automatic counter:{' '}
        <code>
          <AutoIncrement />
        </code>
      </section>
    </rich>
    <Increment />
    <ModalButton />
  </>
)
console.log('Message sent')

await app.client.reactions.add({
  name: 'eyes',
  channel: messageHandle.channel,
  timestamp: messageHandle.ts,
})
console.log('Reaction added')

process.on('SIGINT', async () => {
  await messageHandle.stop('delete')
  console.log('Message deleted')
  process.exit()
})
process.on('beforeExit', async () => {
  await messageHandle.stop('delete')
  console.log('Message deleted')
  process.exit()
})
