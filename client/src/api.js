// fetch wrapper that turns every failure into a readable error.

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
  });

  const data = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    const message =
      data?.message ??
      data?.error?.message ??
      'An unexpected error occurred.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

export { apiFetch };
