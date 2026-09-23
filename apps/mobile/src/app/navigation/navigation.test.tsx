import { MainTabRoutes, RootRoutes } from './routeNames';

describe('navigation route names', () => {
  it('defines root and tab routes for typed navigation', () => {
    expect(RootRoutes.Welcome).toBe('Welcome');
    expect(RootRoutes.UsagePermission).toBe('UsagePermission');
    expect(RootRoutes.Main).toBe('Main');
    expect(MainTabRoutes.Today).toBe('Today');
    expect(MainTabRoutes.History).toBe('History');
    expect(MainTabRoutes.Settings).toBe('Settings');
  });
});
