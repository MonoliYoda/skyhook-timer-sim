import SkyhookSimulation from './components/SkyhookSimulation';
import './App.css';
import SkyhookTimerDistribution from './components/SkyhookTimerDistribution';

function App() {
  return (
    <div className="App bg-slate-800 h-screen">
        <SkyhookSimulation />

        <SkyhookTimerDistribution />
    </div>
  );
}

export default App;
