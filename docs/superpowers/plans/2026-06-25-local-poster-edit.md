# Local Poster Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users click a generated poster, describe a local change, and receive an updated poster.

**Architecture:** Extend the existing React component with normalized click selection state and a local edit form. Add a backend edit endpoint that validates the request and delegates to a new AI service method using the existing image generation endpoint with a prompt that includes the selected point.

**Tech Stack:** React, Vite, Testing Library, Express, Node test runner.

---

### Task 1: Client Local Edit Flow

**Files:**
- Modify: `src/App.test.jsx`
- Modify: `src/App.jsx`
- Modify: `src/api.js`
- Modify: `src/styles.css`

- [ ] Write a failing test that generates a poster, clicks the poster image, enters a local edit instruction, and verifies `apiClient.editPoster` receives the image, copy, template, normalized selection, and instruction.
- [ ] Run `npm run test:client -- src/App.test.jsx` and confirm the new test fails because the edit UI/API does not exist.
- [ ] Add `apiClient.editPoster`.
- [ ] Add selection, instruction, and edit loading state to `PosterTool`.
- [ ] Wrap the poster image in a clickable surface that calculates normalized coordinates.
- [ ] Add the local edit form and marker styles.
- [ ] Run `npm run test:client -- src/App.test.jsx` and confirm it passes.

### Task 2: Server Local Edit Endpoint

**Files:**
- Modify: `server/app.test.js`
- Modify: `server/app.js`
- Modify: `server/ai.test.js`
- Modify: `server/prompts.js`
- Modify: `server/ai.js`
- Modify: `server/index.js`

- [ ] Write failing server tests for rejecting invalid local edit requests and returning the service-generated edited image.
- [ ] Write a failing prompt test for `buildPosterEditPrompt`.
- [ ] Run `npm run test:server` and confirm failures are for missing local edit support.
- [ ] Add `buildPosterEditPrompt`.
- [ ] Add `generateEditedPoster`.
- [ ] Add `/api/poster/edit`.
- [ ] Wire `editPoster` in `server/index.js`.
- [ ] Run `npm run test:server` and confirm it passes.

### Task 3: Full Verification

**Files:**
- No new files.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Review `git diff` for unrelated changes.
