import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SkyhookSimulation = () => {
  const [numSkyhooks, setNumSkyhooks] = useState(100);
  const [centerTime, setCenterTime] = useState(18);
  const [simulationData, setSimulationData] = useState([]);
  const [vulnerabilityWindows, setVulnerabilityWindows] = useState([]);

  const generateTimes = (num, center, std) => {
    return Array.from({ length: num }, () => {
      let time = center + std * Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
      return (time + 24) % 24; // Ensure time is within 0-24 range
    });
  };

  const formatTime = (hour) => {
    const date = new Date(2024, 0, 1, hour);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getVulnerabilityWindow = (startTime) => {
    const endTime = (startTime + 1) % 24;
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const runSimulation = () => {
    const times = generateTimes(numSkyhooks, centerTime, 3);
    const sortedTimes = [...times].sort((a, b) => a - b);

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
    const windows = sortedTimes.slice(0, 100).map((time, index) => ({
      id: index + 1,
      window: getVulnerabilityWindow(time)
    }));

    setVulnerabilityWindows(windows);
  };

  useEffect(() => {
    runSimulation();
  }, []);

  return (
    <div className="p-4 bg-slate-800 text-slate-200">
      <h1 className="text-2xl font-bold mb-4">Skyhook Vulnerability Windows</h1>
      
      <div className="mb-4 flex space-x-4">
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

      <button 
        onClick={runSimulation} 
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Run Simulation
      </button>

      <div className="mb-4" style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart data={simulationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip contentStyle={{backgroundColor: "rgb(30 41 59)"}} labelStyle={{color: "rgb(226 232 240)",}} />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#b4b1e7" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Vulnerability Windows (First 100)</h2>
        <ul className="list-disc pl-5">
          {vulnerabilityWindows.map(({ id, window }) => (
            <li key={id}>Skyhook {id}: {window}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SkyhookSimulation;