import { Temporal } from 'temporal-polyfill'
import { type Instance, type TextInstance } from './renderer.ts'
import type {
  Middleware,
  types as Slack,
  SlackEventMiddlewareArgs,
  StringIndexed,
} from '@slack/bolt'

export type Block = Slack.AnyBlock
export type middlewareArguments<type extends string> = Parameters<
  Middleware<SlackEventMiddlewareArgs<type>, StringIndexed>
>[0]

export function assertNoChildren(element: Instance) {
  if (element.children.length > 0) {
    throw new Error(
      `Element ${element.element} should not have children: ${element.children}`
    )
  }
}
export function getTextChild(element: Instance): string {
  const children = element.children
  if (children.find((child) => child.type !== 'text')) {
    throw new Error('Only text children allowed')
  }
  const string = children.map((child) => child.text).join('')
  return string
}
export function getTextProperty(value: unknown, assert: true): string
export function getTextProperty(
  value: unknown,
  assert?: false
): string | undefined
export function getTextProperty(
  value: unknown,
  assert = false
): string | undefined {
  if (typeof value === 'string') {
    return value
  }
  if (assert) {
    throw new Error('Expected string')
  }
  if (value === undefined || value === null) {
    return undefined
  }
  throw new Error('Expected string or undefined')
}
export function dateToSlackTimestamp(
  input: number | string | Temporal.Instant | Date
): number
export function dateToSlackTimestamp(input: unknown): number | undefined
export function dateToSlackTimestamp(input: unknown): number | undefined {
  if (typeof input === 'number') {
    return input
  }
  if (typeof input === 'string') {
    return Temporal.Instant.from(input).epochSeconds
  }
  if (input instanceof Date) {
    return input.getTime() / 1000
  }
  if (input instanceof Temporal.Instant) {
    return input.epochSeconds
  }
  return undefined
}
export function plainDateToString(
  input: string | Temporal.PlainDate | Date
): string
export function plainDateToString(input: unknown): string | undefined
export function plainDateToString(input: unknown): string | undefined {
  if (typeof input === 'string') {
    return input
  }
  if (input instanceof Date) {
    return Temporal.Instant.fromEpochMilliseconds(input.getTime())
      .toZonedDateTimeISO('UTC')
      .toPlainDate()
      .toString()
  }
  if (input instanceof Temporal.PlainDate) {
    return input.toString()
  }
  return undefined
}

export function jsxToImageObject(jsx: Instance) {
  const sourceString = String(jsx.props.src)
  if (!sourceString) {
    throw new Error('Image must have a source')
  }
  const source = !sourceString.startsWith('http')
    ? { slack_file: { id: sourceString } }
    : sourceString.startsWith('https://files.slack.com')
    ? { slack_file: { url: sourceString } }
    : { image_url: sourceString }
  return {
    type: 'image' as const,
    ...source,
    alt_text: String(jsx.props.alt),
    title:
      typeof jsx.props.title === 'string'
        ? { type: 'plain_text', text: jsx.props.title }
        : undefined,
  }
}
