import type { Temporal } from 'temporal-polyfill'
import type React from 'react'

type NoChildren = Record<string, never>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Slack Blocks
      rich: {}
      hr: {}
      h1: {}
      img: { src: string; alt: string; title?: string } & NoChildren
      video: {
        alt: string
        title: string
        thumbnailUrl: string
        videoUrl: string

        author?: string
        description?: string
        providerIcon?: string
        providerName?: string
        title_url?: string
      } & NoChildren

      // Section Parts
      field: { mrkdwn?: boolean; children?: React.ReactNode }

      // Rich Text Parts
      section: {}
      codeblock: {}
      blockquote: {}
      ul: {}
      ol: {}
      li: {}

      // Rich Text Elements
      b: {}
      i: {}
      s: {}
      code: {}

      a: { href: string; unsafe?: boolean; children?: React.ReactNode }
      user: {}
      usergroup: {}
      channel: {}
      emoji: {}
      color: {}
      ateveryone: NoChildren
      atchannel: NoChildren
      athere: NoChildren
      date: {
        timestamp: number | string | Date | Temporal.Instant
        format: string
        children?: React.ReactNode
      }
    }
  }
}
