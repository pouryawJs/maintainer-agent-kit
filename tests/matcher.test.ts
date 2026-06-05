import { describe, expect, it } from 'vitest';
import { findMatchedKeywords, matchLabels, normalizeText } from '../src/core/matcher';
import type { MaintainerAgentConfig } from '../src/core/types';

const baseConfig: MaintainerAgentConfig = {
  labels: {
    bug: {
      include: ['bug', 'crash', 'error']
    },
    docs: {
      include: ['docs', 'readme', 'typo']
    },
    question: {
      include: ['question', 'help']
    }
  }
};

describe('normalizeText', () => {
  it('lowercases and trims text', () => {
    expect(normalizeText('  Bug Report  ')).toBe('bug report');
  });

  it('handles null and undefined', () => {
    expect(normalizeText(null)).toBe('');
    expect(normalizeText(undefined)).toBe('');
  });

  it('collapses repeated whitespace', () => {
    expect(normalizeText('The app is NOT   working\nright now')).toBe(
      'the app is not working right now'
    );
  });
});

describe('findMatchedKeywords', () => {
  it('is case-insensitive', () => {
    expect(findMatchedKeywords('The app has a BUG', ['bug'])).toEqual(['bug']);
  });

  it('matches phrases after normalization', () => {
    expect(findMatchedKeywords('The app is NOT   working', ['not working'])).toEqual([
      'not working'
    ]);
  });

  it('ignores empty keywords', () => {
    expect(findMatchedKeywords('bug report', ['', '   ', 'bug'])).toEqual(['bug']);
  });

  it('deduplicates matched keywords while preserving keyword order', () => {
    expect(findMatchedKeywords('Bug crash error', ['error', 'bug', 'error', 'crash'])).toEqual([
      'error',
      'bug',
      'crash'
    ]);
  });
});

describe('matchLabels', () => {
  it('matches labels from issue title and body', () => {
    expect(
      matchLabels(
        {
          title: 'Bug: app crashes when clicking login',
          body: 'The login button causes an error after submit.'
        },
        baseConfig
      )
    ).toEqual({
      labelsToAdd: ['bug'],
      matchedRules: [
        {
          label: 'bug',
          matchedKeywords: ['bug', 'crash', 'error']
        }
      ]
    });
  });
});
