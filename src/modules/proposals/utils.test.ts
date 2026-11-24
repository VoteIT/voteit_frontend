import { describe, expect, test } from 'vitest'

import { getParagraphs, isApproveDenyProposal } from './utils'

describe('getParagraphs', () => {
  test('empty body has no paragraphs', () => {
    expect(getParagraphs('')).toEqual([])
    expect(getParagraphs('<p><br></p>')).toEqual([])
  })

  test('single paragraph', () => {
    expect(getParagraphs('<p>One <strong>thing</strong></p>')).toEqual([
      '<p>One <strong>thing</strong></p>'
    ])
  })

  test('skips empty paragraphs between proposals', () => {
    expect(
      getParagraphs('<p>First</p><p><br></p><p> </p><p>Second</p>')
    ).toEqual(['<p>First</p>', '<p>Second</p>'])
  })

  test('plain text is one paragraph', () => {
    expect(getParagraphs('Just text')).toEqual(['Just text'])
  })
})

describe('isApproveDenyProposal', () => {
  test.each([
    '<p>Bifall till förslag #1</p>',
    '<p>avslag</p>',
    '<p>Avslår förslaget</p>',
    '<p>  Afslag på #3</p>',
    '<p>Bifald</p>',
    '<p>Approve #proposal-2</p>',
    '<p>REJECT</p>',
    '<p>Support for #4</p>',
    '<p>- Deny</p>'
  ])('%s is approve/deny', (html) => {
    expect(isApproveDenyProposal(html)).toBe(true)
  })

  test.each([
    '<p>Supporten ska utökas</p>',
    '<p>Approved budget should be published</p>',
    '<p>Vi yrkar bifall till motionen</p>',
    '<p>Att styrelsen får i uppdrag att utreda frågan</p>',
    ''
  ])('%s is not approve/deny', (html) => {
    expect(isApproveDenyProposal(html)).toBe(false)
  })
})
