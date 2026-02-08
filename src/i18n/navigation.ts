import { createNavigation } from 'next-intl/navigation';
import { navigationRouting } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(navigationRouting);
