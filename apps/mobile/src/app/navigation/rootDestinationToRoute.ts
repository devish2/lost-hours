import type { AppBootstrapDestination } from '../../application/bootstrap/AppBootstrapDestination';
import { RootRoutes } from './routeNames';

export function rootDestinationToRoute(
  destination: AppBootstrapDestination,
): (typeof RootRoutes)[keyof typeof RootRoutes] {
  switch (destination) {
    case 'welcome_required':
      return RootRoutes.Welcome;
    case 'permission_required':
      return RootRoutes.UsagePermission;
    case 'ready':
      return RootRoutes.Main;
  }
}
