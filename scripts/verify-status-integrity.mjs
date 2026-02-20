#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const MISMATCH_EXIT_CODE = 2;
const ERROR_EXIT_CODE = 3;
const STORY_KEY_PATTERN = /^\d+-/;
const STATUS_LINE_PATTERN = /^Status:\s*([A-Za-z0-9-]+)\s*$/m;

function parseScalar(yamlText, key) {
  const pattern = new RegExp(`^${key}:\\s*['"]?([^'"\\n]+)['"]?\\s*$`, 'm');
  const match = yamlText.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function parseDevelopmentStatus(yamlText) {
  const lines = yamlText.split(/\r?\n/);
  const statusMap = new Map();
  let inSection = false;

  for (const line of lines) {
    if (!inSection) {
      if (/^development_status:\s*$/.test(line)) {
        inSection = true;
      }
      continue;
    }

    if (!line.trim()) {
      continue;
    }

    if (!line.startsWith('  ')) {
      break;
    }

    const match = line.match(/^  ([^:#][^:]*):\s*([^\s#]+)\s*(?:#.*)?$/);
    if (!match) {
      continue;
    }

    statusMap.set(match[1].trim(), match[2].trim());
  }

  return statusMap;
}

function normalizeStatus(status) {
  return status.trim().toLowerCase();
}

function sortByStoryKey(a, b) {
  return a.storyKey.localeCompare(b.storyKey, undefined, { numeric: true });
}

async function readStatusFromStory(filePath) {
  const markdown = await readFile(filePath, 'utf8');
  const statusMatch = markdown.match(STATUS_LINE_PATTERN);
  return statusMatch?.[1]?.trim() ?? null;
}

async function main() {
  const projectRoot = process.cwd();
  const statusFile = path.join(projectRoot, '_bmad-output/implementation-artifacts/sprint-status.yaml');

  let statusYaml;
  try {
    statusYaml = await readFile(statusFile, 'utf8');
  } catch (error) {
    console.error(`STATUS_INTEGRITY_ERROR code=load-status-file-failed path=${statusFile} detail=${error.message}`);
    process.exit(ERROR_EXIT_CODE);
  }

  const storyLocation = parseScalar(statusYaml, 'story_location');
  if (!storyLocation) {
    console.error(`STATUS_INTEGRITY_ERROR code=missing-story-location path=${statusFile}`);
    process.exit(ERROR_EXIT_CODE);
  }

  const storyRoot = path.join(projectRoot, storyLocation);
  const canonicalStatus = parseDevelopmentStatus(statusYaml);
  const canonicalStoryKeys = [...canonicalStatus.keys()].filter((key) => STORY_KEY_PATTERN.test(key)).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );

  const mismatches = [];

  for (const storyKey of canonicalStoryKeys) {
    const expected = canonicalStatus.get(storyKey);
    const storyPath = path.join(storyRoot, `${storyKey}.md`);

    let storyExists = false;
    try {
      storyExists = (await stat(storyPath)).isFile();
    } catch {
      storyExists = false;
    }

    if (!storyExists) {
      if (normalizeStatus(expected) === 'backlog') {
        continue;
      }
      mismatches.push({
        storyKey,
        expected,
        actual: 'missing-file',
        path: storyPath,
        reason: 'missing-file',
      });
      continue;
    }

    const actual = await readStatusFromStory(storyPath);
    if (!actual) {
      mismatches.push({
        storyKey,
        expected,
        actual: 'missing-status',
        path: storyPath,
        reason: 'missing-status',
      });
      continue;
    }

    if (normalizeStatus(expected) !== normalizeStatus(actual)) {
      mismatches.push({
        storyKey,
        expected,
        actual,
        path: storyPath,
        reason: 'status-mismatch',
      });
    }
  }

  let storyFiles = [];
  try {
    const entries = await readdir(storyRoot, { withFileTypes: true });
    storyFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && STORY_KEY_PATTERN.test(entry.name))
      .map((entry) => entry.name.replace(/\.md$/, ''));
  } catch (error) {
    console.error(`STATUS_INTEGRITY_ERROR code=load-story-directory-failed path=${storyRoot} detail=${error.message}`);
    process.exit(ERROR_EXIT_CODE);
  }

  for (const storyKey of storyFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
    if (canonicalStatus.has(storyKey)) {
      continue;
    }

    const storyPath = path.join(storyRoot, `${storyKey}.md`);
    const actual = (await readStatusFromStory(storyPath)) ?? 'missing-status';
    mismatches.push({
      storyKey,
      expected: 'missing-canonical',
      actual,
      path: storyPath,
      reason: 'missing-canonical',
    });
  }

  if (mismatches.length > 0) {
    mismatches.sort(sortByStoryKey);
    console.error(`STATUS_INTEGRITY_FAIL checked=${canonicalStoryKeys.length} mismatches=${mismatches.length}`);
    for (const mismatch of mismatches) {
      console.error(
        `STATUS_INTEGRITY_MISMATCH story_key=${mismatch.storyKey} expected=${mismatch.expected} actual=${mismatch.actual} path=${mismatch.path} reason=${mismatch.reason}`,
      );
    }
    process.exit(MISMATCH_EXIT_CODE);
  }

  console.log(
    `STATUS_INTEGRITY_OK checked=${canonicalStoryKeys.length} mismatches=0 source=${path.relative(projectRoot, statusFile)}`,
  );
}

main().catch((error) => {
  console.error(`STATUS_INTEGRITY_ERROR code=unexpected detail=${error.message}`);
  process.exit(ERROR_EXIT_CODE);
});
