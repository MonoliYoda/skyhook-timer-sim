import SkyhookSimulation from './components/SkyhookSimulation';
import './App.css';
import { Theme } from '@radix-ui/themes';

function App() {
  return (
    <div className="App">
      <Theme>
        <SkyhookSimulation />
      </Theme>
    </div>
  );
}

export default App;
