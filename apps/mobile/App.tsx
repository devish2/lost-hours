/**
 * @format
 */

import { AppBootstrapGate } from './src/app/bootstrap/AppBootstrapGate';
import { AppProviders } from './src/app/providers/AppProviders';

function App() {
  return (
    <AppProviders>
      <AppBootstrapGate />
    </AppProviders>
  );
}

export default App;
