import { describe, expect, test } from 'bun:test';

import { getTrustedRequestHandlerUrl } from './RequestSecurity';

const currentLocation =
  'https://wpide.dev.test/wp-admin/admin.php?page=wpide-pricing';
const trustedEndpoint =
  'https://wpide.dev.test/wp-admin/admin-ajax.php?module_id=10410&action=wpide_pricing&security=nonce';

describe('getTrustedRequestHandlerUrl', () => {
  test('accepts the same-origin WordPress AJAX endpoint', () => {
    expect(getTrustedRequestHandlerUrl(trustedEndpoint, currentLocation)).toBe(
      trustedEndpoint
    );
  });

  test.each([
    'data:application/json,{}',
    ['java', 'script:alert(1)'].join(''),
    'https://attacker.example/wp-admin/admin-ajax.php?action=x&security=y',
    'https://wpide.dev.test/wp-admin/admin.php?action=x&security=y',
    'https://wpide.dev.test/wp-admin/admin-ajax.php?action=x',
  ])('rejects an untrusted endpoint: %s', endpoint => {
    expect(getTrustedRequestHandlerUrl(endpoint, currentLocation)).toBeNull();
  });
});
