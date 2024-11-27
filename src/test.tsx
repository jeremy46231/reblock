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

const app = new Slack.App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
})

await app.client.views.publish({
  user_id: 'U06UYA5GMB5',
  view: appHome(
    <>
      <h1>Hello *World*</h1>
      <rich>
        <ol>
          <li>one</li>
          <ol>
            <li>sub</li>
          </ol>
          <li>two</li>
        </ol>
      </rich>
      <section expand>
        hi
      </section>
      <actions>
        <button>hi</button>
      </actions>
    </>
  ),
})

await app.client.chat.postMessage({
  channel: 'C07FFUNMXUG',
  blocks: message(
    <>
      <h1>Hello *World*</h1>
      <rich>
        <ol>
          <li>one</li>
          <ol>
            <li>sub</li>
          </ol>
          <li>two</li>
        </ol>
      </rich>
      <section expand>
        hi
      </section>
      <actions>
        <button>hi</button>
      </actions>
    </>
  ),
})