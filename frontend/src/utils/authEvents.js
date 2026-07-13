/**
 * The Axios response interceptor lives outside the React tree and cannot
 * call `useContext` directly. Rather than reaching for a global store, we
 * use a tiny event target so AuthContext can subscribe and react to
 * session-expiry (401) events detected at the network layer.
 */
const AUTH_EVENT_TARGET = new EventTarget();
export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

export function emitUnauthorized() {
  AUTH_EVENT_TARGET.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

export function subscribeUnauthorized(callback) {
  AUTH_EVENT_TARGET.addEventListener(UNAUTHORIZED_EVENT, callback);
  return () => AUTH_EVENT_TARGET.removeEventListener(UNAUTHORIZED_EVENT, callback);
}
