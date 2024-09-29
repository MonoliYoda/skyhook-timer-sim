function loadSystems(data) {
  return new Set(data.filter(row => row.security === '0.0').map(row => row.id));
}

function loadConnections(data) {
  const connections = new Map();
  data.forEach(row => {
      const systemId = row.systemId;
      const neighbors = row.jumpNodes.split(':');
      connections.set(systemId, new Set(neighbors));
  });
  return connections;
}

function bfs(start, connections, vulnerableSystems) {
  const queue = [[start, 0]];
  const visited = new Set([start]);
  
  while (queue.length > 0) {
      const [current, jumps] = queue.shift();
      
      if (vulnerableSystems.has(current)) {
          return jumps;
      }
      
      const neighbors = connections.get(current) || new Set();
      for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push([neighbor, jumps + 1]);
          }
      }
  }
  
  return -1;  // No vulnerable system found
}

function simulate(systems, connections, vulnerableSystems, numSimulations) {
  const results = [];
  const systemsArray = Array.from(systems);
  for (let i = 0; i < numSimulations; i++) {
      const start = systemsArray[Math.floor(Math.random() * systemsArray.length)];
      const jumps = bfs(start, connections, vulnerableSystems);
      if (jumps !== -1) {
          results.push(jumps);
      }
  }
  return results;
}

const calculateProbability = (results, maxJumps) => {
  const withinRange = results.filter(jumps => jumps <= maxJumps);
  return withinRange.length / results.length;
};

export { loadSystems, loadConnections, simulate, calculateProbability };

// function main() {
//   const systems = loadSystems(systemsData);
//   const connections = loadConnections(connectionsData);
  
//   // Assuming 500 vulnerable Skyhooks out of all nullsec systems
//   const numVulnerable = 500;
//   const vulnerableSystems = new Set(Array.from(systems).sort(() => 0.5 - Math.random()).slice(0, numVulnerable));
  
//   const numSimulations = 10000;
//   const results = simulate(systems, connections, vulnerableSystems, numSimulations);
  
//   const avgJumps = results.reduce((a, b) => a + b, 0) / results.length;
//   console.log(`Average number of jumps to reach a vulnerable Skyhook: ${avgJumps.toFixed(2)}`);
// }