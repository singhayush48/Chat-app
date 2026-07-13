/**
 * Extracts a human-readable message from an Axios error, falling back
 * to sensible defaults per HTTP status. Keeps components free of
 * repeated `err.response?.data?.message` boilerplate.
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    return 'Unable to reach the server. Check your connection and try again.';
  }

  const { status, data } = error.response;

  if (data?.message) return data.message;

  switch (status) {
    case 400:
      return 'That request was invalid. Please check your input.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return "You don't have access to do that.";
    case 404:
      return 'We could not find what you were looking for.';
    case 409:
      return 'That already exists.';
    case 500:
      return 'Something went wrong on our end. Please try again shortly.';
    default:
      return fallback;
  }
}
