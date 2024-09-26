import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar } from 'recharts';

const SkyhookSimulation = () => {
  const [numSkyhooks, setNumSkyhooks] = useState(20);
  const [centerTime, setCenterTime] = useState(18);
  const [simulationData, setSimulationData] = useState([]);
  // const [vulnerabilityWindows, setVulnerabilityWindows] = useState([]);

  const generateTimes = (num, center, std) => {
    return Array.from({ length: num }, () => {
      let time = center + std * Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
      return (time + 24) % 24; // Ensure time is within 0-24 range
    });
  };

  const formatTime = (hour) => {
    const date = new Date(2024, 0, 1, hour);

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const runSimulation = () => {
    const times = generateTimes(numSkyhooks, centerTime, 3);
    // const sortedTimes = [...times].sort((a, b) => a - b);

    // Prepare data for the chart
    const histogramData = Array(24).fill(0);
    times.forEach(time => {
      const hour = Math.floor(time);
      histogramData[hour]++;
    });

    const chartData = histogramData.map((count, hour) => ({
      hour: formatTime(hour),
      count: count
    }));

    setSimulationData(chartData);

    // Prepare vulnerability windows
    // const windows = sortedTimes.slice(0, 100).map((time, index) => ({
    //   id: index + 1,
    //   window: getVulnerabilityWindow(time)
    // }));

    // setVulnerabilityWindows(windows);
  };

  useEffect(() => {
    runSimulation();
  }, []);

  return (
    <div className="p-4 bg-slate-800 text-slate-200">
      <h1 className="text-3xl font-bold mb-4">Skyhook Vulnerability Window Simulator</h1>
      <div className='mt-8'>
        <h2 className="text-xl font-semibold mb-4">Understanding Skyhook Vulnerability Windows</h2>

        <p className="mb-3">This visualization demonstrates the distribution of multiple Skyhook vulnerability windows when owners set them to the same target time.</p>

        <p className="mb-3 text-xl font-semibold mb-4">Key points:</p>
        <ul className="list-disc list-inside mb-3">
          <li>Owners can set the target time to any hour of the day.</li>
          <li>The simulation shows how vulnerability windows spread around the chosen time.</li>
          <li>Distribution follows a normal curve with a 3-hour standard deviation, as per CCP's hints.</li>
          <li>Each vulnerability window lasts one hour, during which a Skyhook can be raided.</li>
        </ul>

        <p className="mb-3">The chart below illustrates the probability distribution of Skyhook vulnerabilities over a 24-hour period, centered on the owner-set target time.</p>
      </div>

      <div className="flex w-full my-8">
        <div className='flex space-x-4 mx-auto border rounded-lg border-gray-400 p-3 '>

          <div>
            <label htmlFor="numSkyhooks">Number of Skyhooks:</label>
            <input
              id="numSkyhooks"
              type="number"
              value={numSkyhooks}
              onChange={(e) => setNumSkyhooks(Number(e.target.value))}
              min="1"
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm bg-slate-700 px-2"
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
          <div className='flex flex-col'>
            <span >Standard Deviation (hours):</span>
            <span className="text-gray-300 text-md ml-2">3h</span>
          </div>
        </div>
      </div>

      <button
        onClick={runSimulation}
        className="mb-8 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Run Simulation
      </button>

      <div className="mb-4" style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={simulationData}>
            <CartesianGrid strokeDasharray="1" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip contentStyle={{ backgroundColor: "rgb(30 41 59)" }} labelStyle={{ color: "rgb(226 232 240)", }} />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SkyhookSimulation;