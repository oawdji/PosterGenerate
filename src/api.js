async function postJson(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed. Please try again.');
  }

  return data;
}

export const apiClient = {
  generateCopy(payload) {
    return postJson('/api/copy', payload);
  },
  generatePoster(payload) {
    return postJson('/api/poster', payload);
  },
  editPoster(payload) {
    return postJson('/api/poster/edit', payload);
  },
};
