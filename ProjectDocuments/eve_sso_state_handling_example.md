# EVE SSO State Parameter Handling Example

This example demonstrates how to securely handle the OAuth2 `state` parameter for EVE SSO, as required by the official documentation.

---

## 1. Login Initiation

```typescript
// Import the ssoState utility and auth URL generator
import { generateState, storeState } from '../src/services/ssoState';
import { generateAuthUrl } from '../src/services/eve';

// When the user clicks "Log in with EVE Online":
function handleEveLogin() {
  const state = generateState();
  storeState(state);
  const authUrl = generateAuthUrl(state);
  window.location.href = authUrl;
}
```

---

## 2. Callback Handler

```typescript
import { getStoredState, clearStoredState } from '../src/services/ssoState';

// In your callback route/component:
function handleEveCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const returnedState = params.get('state');
  const storedState = getStoredState();

  if (!returnedState || !storedState || returnedState !== storedState) {
    clearStoredState();
    // Show error: "Invalid state parameter. Authentication failed."
    return;
  }

  clearStoredState();
  // Proceed to exchange the code for tokens
  // exchangeAuthCode(code)
}
```

---

## 3. Notes

- Always clear the stored state after validation, regardless of success or failure.
- This approach is fully compliant with EVE SSO and OAuth2 best practices.
- For PKCE support, you would also store and validate the code verifier in a similar way.