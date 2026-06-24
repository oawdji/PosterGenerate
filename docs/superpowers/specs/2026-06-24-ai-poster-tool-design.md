# AI Poster Tool Design

## Goal

Build a simple AI poster creation tool where a user describes a poster need in natural language, reviews AI-generated copy, and generates a complete poster image with one click.

## Scope

The first version uses React + Vite for the frontend and Node.js + Express for the backend. It does not include a database, authentication, deployment, user accounts, saved history, or a visual editor.

The app generates the final poster directly through the image model. The frontend does not render text onto a background image or compose layers locally.

## User Flow

1. The user opens the single-page app.
2. The user enters a short poster requirement, such as "make a weekend new-product promo poster for a coffee shop".
3. The user selects a lightweight visual intent template:
   - Commercial promotion
   - Event invitation
   - Brand campaign
   - Holiday marketing
4. The user clicks "Generate Copy".
5. The backend calls the text AI API and returns structured poster copy plus an image prompt.
6. The user can review and edit the generated copy fields.
7. The user clicks "Generate Poster".
8. The backend calls the image AI API and returns a complete base64 poster image.
9. The frontend displays the final image and provides a download action.

## Architecture

The frontend is a Vite-powered React app. It manages form state, loading states, validation messages, copy preview/editing, poster preview, and download.

The backend is an Express server. It loads API configuration from `.env`, normalizes environment values, validates request bodies, calls the configured text and image APIs, and returns small JSON responses to the frontend.

The APIs in `.env` have been smoke-tested:

- Text: `POST /v1/chat/completions`, OpenAI-compatible `choices[0].message`
- Image: `POST /v1/images/generations`, OpenAI-compatible `data[0].b64_json`

The implementation will normalize straight quotes and smart quotes around environment values because the current `.env` URL values include smart quotes.

## Frontend Components

`App` owns the main workflow and API calls.

`PromptPanel` collects the user's natural-language poster requirement and template choice.

`CopyPanel` shows editable AI copy fields after copy generation:

- title
- subtitle
- sellingPoints
- callToAction
- visualStyle
- imagePrompt

`PosterPreview` shows empty, loading, error, and generated-image states. It also exposes a download button after a poster image exists.

## Backend Endpoints

### `POST /api/copy`

Request:

```json
{
  "requirement": "Coffee shop weekend product launch poster",
  "template": "commercial"
}
```

Response:

```json
{
  "copy": {
    "title": "Weekend New Taste",
    "subtitle": "Fresh coffee and dessert specials",
    "sellingPoints": ["Limited weekend offer", "Freshly roasted beans", "Pair with handmade dessert"],
    "callToAction": "Visit today",
    "visualStyle": "warm, modern coffee shop promotion",
    "imagePrompt": "A complete polished poster..."
  }
}
```

Validation:

- `requirement` is required and must contain non-whitespace text.
- `template` defaults to `commercial` if omitted or unknown.

### `POST /api/poster`

Request:

```json
{
  "copy": {
    "title": "Weekend New Taste",
    "subtitle": "Fresh coffee and dessert specials",
    "sellingPoints": ["Limited weekend offer", "Freshly roasted beans", "Pair with handmade dessert"],
    "callToAction": "Visit today",
    "visualStyle": "warm, modern coffee shop promotion",
    "imagePrompt": "A complete polished poster..."
  },
  "template": "commercial"
}
```

Response:

```json
{
  "image": "data:image/png;base64,..."
}
```

Validation:

- At least one meaningful copy field or `imagePrompt` is required.
- The backend builds the final image prompt from the edited copy fields, template guidance, and `imagePrompt`.

## Prompting Strategy

The copy endpoint asks the text model to return strict JSON. The response is parsed into a stable shape. If the model wraps JSON in extra text, the backend extracts the first JSON object before parsing.

The poster endpoint asks the image model to generate a complete poster image that includes the generated copy as visible poster text. The prompt includes the selected template, visual style, title, subtitle, selling points, call to action, and the AI-generated image prompt.

## Error Handling

Backend validation errors return `400` with a short message.

AI failures return `502` with a user-safe message:

- Copy generation failed. Please try again.
- Poster generation failed. Please adjust the description and try again.

The frontend keeps the user's current input and generated copy when an error happens. Buttons show loading states and are disabled while a request is running.

## Testing

Backend tests cover:

- Environment value normalization, including smart quotes
- Copy response JSON extraction and parsing
- `/api/copy` validation
- `/api/poster` validation
- Image response base64 formatting

Frontend verification covers:

- Production build succeeds
- The main workflow renders without runtime build errors

## Out Of Scope

- Database persistence
- User login
- Deployment
- Payment or quotas
- Uploading reference images
- Layer-based editing
- Frontend text composition over generated backgrounds
- Poster history
- Multi-page project management
