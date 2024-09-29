import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from "recharts";
import { create, all } from 'mathjs'

import { loadSystems, loadConnections, simulate, calculateProbability } from './helper/universe';
import systemsData from './data/systems.json';
import connectionsData from './data/connections.json';

const math = create(all)

const SkyhookTimerDistribution = () => {
  const stdDev = 3;  // 3 hours standard deviation
  const vulnerabilityDuration = 1;  // 1 hour
  const cycleDuration = 72;  // 3 days in hours

  const [numSkyhooks, setNumSkyhooks] = useState(4000);
  const [centerTime, setCenterTime] = useState(12);
  const [cycleRandomness, setCycleRandomness] = useState(0);
  const [centerSpread, setCenterSpread] = useState(0);
  const [simulationData, setSimulationData] = useState([]);

  const [systems, setSystems] = useState(new Set());
  const [connections, setConnections] = useState(new Map());

  const maxJumps = 5;
  const numSimulations = 10000;

  const [avgJumps, setAvgJumps] = useState(-1);
  const [probability, setProbability] = useState(-1);

  const generateTime = (center, stdDev) => {
    let time = center + stdDev * Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
    return (time + 24); // Ensure time is within 0-24 range
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // Set up the simulation
  const getSimulationOffsets = (baseCenterTime, maxCenterSpread) => {
    const allOffsets = [-12, -10, -9, -6, -5, -3, -2, 0, 2, 3, 5, 6, 9, 10, 12];
    const numOffsets = Math.max(1, Math.floor(allOffsets.length * maxCenterSpread));

    // Shuffle the offsets and select the required number
    const shuffledOffsets = shuffleArray([...allOffsets]);
    let selectedOffsets = shuffledOffsets.slice(0, numOffsets);

    // Ensure 0 is always included
    if (!selectedOffsets.includes(0)) {
      selectedOffsets[selectedOffsets.length - 1] = 0;
    }

    const simulationOffsets = selectedOffsets.map(offset => (baseCenterTime + offset + 24) % 24);
    return simulationOffsets.sort((a, b) => a - b);
  };

  const getSkyhookCenter = (centerTime, centerSpread, simulationOffsets) => {
    if (centerSpread === 0) {
      return centerTime;
    }

    const options = [centerTime, ...simulationOffsets.filter(time => time !== centerTime)];
    const weights = options.map((_, index) =>
      index === 0 ? 1 - centerSpread : centerSpread / (options.length - 1)
    );

    let random = Math.random();
    for (let i = 0; i < options.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return options[i];
      }
    }

    // Fallback in case of floating-point errors
    return options[options.length - 1];
  };

  const formatTime = (hour) => {
    const date = new Date(2024, 0, 1, hour);

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const runSimulation = (days = 9, cycleRandomness = 0, centerTime = 12, centerSpread = 0) => {
    const totalHours = days * 24;
    const vulnerabilityCount = Array(totalHours).fill(0);

    const simulationOffsets = getSimulationOffsets(centerTime, centerSpread);

    for (let i = 0; i < numSkyhooks; i++) {
      const skyhookCenter = getSkyhookCenter(centerTime, centerSpread, simulationOffsets);

      let startHour;
      if (cycleRandomness === 0) {
        startHour = 24;
      } else {
        const probabilities = [
          cycleRandomness / 3,  // Probability for -24
          1 - (2 * cycleRandomness / 3),  // Probability for 0
          cycleRandomness / 3   // Probability for 24
        ];
        const values = [0, 24, 48];
        startHour = values[math.pickRandom([0, 1, 2], probabilities)];
      }

      for (let hour = startHour; hour < totalHours; hour += cycleDuration) {
        const vulnTime = generateTime(skyhookCenter, stdDev);
        const start = (hour + vulnTime) % totalHours;
        const end = (start + vulnerabilityDuration) % totalHours;

        if (end > start) {
          for (let h = start; h < end; h++) {
            vulnerabilityCount[Math.floor(h)]++;
          }
        } else {
          for (let h = start; h < totalHours; h++) {
            vulnerabilityCount[Math.floor(h)]++;
          }
          for (let h = 0; h < end; h++) {
            vulnerabilityCount[Math.floor(h)]++;
          }
        }
      }
    }
    const chartData = vulnerabilityCount.map((count, hour) => ({
      hour: formatTime(hour),
      count: count
    }));
    setSimulationData(chartData);
    return vulnerabilityCount;
  };

  const handleRunSimulation = () => {
    runSimulation(9, cycleRandomness / 100, centerTime, centerSpread / 100);
    // runSimulation(9, 0.5, 12, 0);
  };

  const handleChartClicked = (e) => {
    if (e.activePayload === null || e.activePayload.length === 0) {
      return;
    }
    if (e.activePayload[0].payload.count === 0) {
      // No vulnerable skyhooks, no need to run simulation
      setAvgJumps(-1);
      setProbability(0);
      return;
    }
    if (systems.size === 0 || connections.size === 0) {
      console.error("Systems and connections not loaded");
      return;
    }
    const numVulnSkyhooks = e.activePayload[0].payload.count;
    const vulnerableSystems = new Set(Array.from(systems).sort(() => 0.5 - Math.random()).slice(0, numVulnSkyhooks));

    const simResults = simulate(systems, connections, vulnerableSystems, numSimulations);
    const avg = simResults.reduce((a, b) => a + b, 0) / simResults.length;
    setAvgJumps(avg);
    const prob = calculateProbability(simResults, maxJumps);
    setProbability(prob);
  };

  useEffect(() => {
    runSimulation();
    setSystems(loadSystems(systemsData));
    setConnections(loadConnections(connectionsData));

  }, []);

  return (
    <div className="p-4 bg-slate-800 text-slate-200">
      <h1 className="text-3xl font-bold mb-4">Timer Distribution</h1>
      <div className='mt-8'>

        <p className="mb-3">We can simulate what this spread means over time.</p>
        <p className="text-xl font-semibold mb-4">Randomizing Days:</p>
        <p className="mb-3">Skyhooks will be anchored on different days over time, as some get moved, destroyed and others are anchored.</p>
        <p className="mb-3">This is controlled by cycle randomness. 0 means they all start on the same day, 1 means they're evenly distributed.</p>
        <p className="text-xl font-semibold mb-4">Randomizing Hours:</p>
        <p className="mb-3">The owners of skyhooks will choose different vulnerability times.</p>
        <p className="mb-3">While it's impossible to predict what times will be selected, we can simulate its effects on the chart.</p>
        <p className="mb-3">This is controlled by center spread. 0 means they're all set to the same hour, 1 means they're evenly distributed over 24h.</p>
      </div>
      <div className="flex w-full my-8">
        <div className="flex space-x-4 mx-auto border rounded-lg border-gray-400 p-3 ">
          <div>
            <label htmlFor="numSkyhooks">Number of Skyhooks:</label>
            <input
              id="numSkyhooks"
              type="number"
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm bg-slate-700 px-2"
              value={numSkyhooks}
              onChange={e => setNumSkyhooks(Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="centerTime">Center Time (UTC):</label>
            <input
              id="centerTime"
              type="number"
              value={centerTime}
              onChange={(e) => setCenterTime(Number(e.target.value))}
              min="0"
              max="23"
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm bg-slate-700 px-2"
            />
          </div>
          <div>
            <label htmlFor="cycleRandomness">Cycle Randomness</label>
            <input
              id="cycleRandomness"
              type="range"
              className="block rounded-lg border-gray-400 p-1"
              value={cycleRandomness}
              min={0}
              step={1}
              max={100}
              onChange={e => setCycleRandomness(Number(e.target.value))}
              onMouseUp={handleRunSimulation}
            />
            <span className="block">{cycleRandomness / 100}</span>
          </div>
          <div>
            <label htmlFor="centerSpread">Center Spread</label>
            <input
              id="centerSpread"
              type="range"
              className="block rounded-lg border-gray-400 p-1"
              value={centerSpread}
              min={0}
              step={10}
              max={100}
              onChange={e => setCenterSpread(Number(e.target.value))}
              onMouseUp={handleRunSimulation}
            />
            <span className="block">{centerSpread / 100}</span>
          </div>
        </div>
      </div>
      <button
        onClick={handleRunSimulation}
        className=" px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Run Simulation
      </button>
      <div className="flex w-full my-8">
        <div className='mx-auto'>
          <p className="text-xl font-semibold mb-4">Click on the chart to calculate:</p>
          <p>For a randomly selected Nullsec system</p>
          <div>
            <p>Average number of jumps to reach a vulnerable Skyhook: {avgJumps.toFixed(2)}</p>
          </div>
          <div>
            <p>Probability of reaching a vulnerable Skyhook within {maxJumps} jumps: {(probability * 100).toFixed(2)}%</p>
          </div>
        </div>
      </div>
      <div className="mb-4" style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart data={simulationData} onClick={handleChartClicked}>
            <CartesianGrid strokeDasharray="1" />
            <XAxis dataKey="hour" />
            <YAxis domain={[0, Math.floor(numSkyhooks / 6)]} />
            <Tooltip contentStyle={{ backgroundColor: "rgb(30 41 59)" }} labelStyle={{ color: "rgb(226 232 240)", }} />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#b4b1e7" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

  );
}

export default SkyhookTimerDistribution;