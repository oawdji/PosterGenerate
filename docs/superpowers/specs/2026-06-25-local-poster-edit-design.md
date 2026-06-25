# Local Poster Edit Design

## Goal

Add a lightweight local edit flow for generated posters: the user clicks a point on the poster, enters a change instruction, and receives an updated poster image.

## Approach

Use the current generated poster as the user-facing selection surface. The client converts the click into normalized image coordinates from 0 to 1, stores the selected point, and sends the copy, template, point, and instruction to a new backend endpoint.

The backend validates that an instruction and point exist. It calls a new `editPoster` service method that builds an image generation prompt emphasizing the clicked location and preserving the rest of the poster. This is intentionally still a guided regeneration request, not a layer-based editor or provider-specific multipart image edit.

## UI

When a poster exists, clicking the image sets a marker. A compact local edit panel appears below the image with the selected coordinate, a textarea for the instruction, and a "局部修改" button. The existing download button remains available for the current image.

## API

Add `POST /api/poster/edit`.

Request body:

```json
{
  "copy": {},
  "template": "commercial",
  "selection": { "x": 0.42, "y": 0.58 },
  "instruction": "把这里的按钮改成红色"
}
```

Response body:

```json
{
  "image": "data:image/png;base64,..."
}
```

## Testing

Add client tests for selecting a poster point and submitting local edit payloads. Add server tests for validation and service delegation. Add prompt tests to ensure the local edit prompt includes the selected coordinates and preservation instruction.
