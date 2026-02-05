import createMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { shouldShowBetting } from './lib/geo/compliance';

const handleI18nRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // Geo detection (dev override > Vercel header > unknown)
  const country =
    process.env.OVERRIDE_COUNTRY ??
    request.headers.get('x-vercel-ip-country') ??
    'XX';
  const showBetting = shouldShowBetting(country);

  // i18n routing
  const response = handleI18nRouting(request);

  // Pass geo context downstream via headers
  response.headers.set('x-user-country', country);
  response.headers.set('x-show-betting', showBetting ? '1' : '0');

  return response;
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
