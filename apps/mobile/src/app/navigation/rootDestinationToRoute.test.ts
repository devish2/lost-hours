import { rootDestinationToRoute } from './rootDestinationToRoute';
import { RootRoutes } from './routeNames';

describe('rootDestinationToRoute', () => {
  it('maps bootstrap destinations to root routes', () => {
    expect(rootDestinationToRoute('welcome_required')).toBe(RootRoutes.Welcome);
    expect(rootDestinationToRoute('permission_required')).toBe(
      RootRoutes.UsagePermission,
    );
    expect(rootDestinationToRoute('ready')).toBe(RootRoutes.Main);
  });
});
