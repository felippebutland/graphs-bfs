import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, MousePointer2 } from 'lucide-react';

const BFSVisualization = () => {
  const [grid, setGrid] = useState([]);
  const [visited, setVisited] = useState(new Set());
  const [queue, setQueue] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [startNode, setStartNode] = useState({ row: 0, col: 0 });
  const [visitHistory, setVisitHistory] = useState([]);
  const [isSelectingStart, setIsSelectingStart] = useState(false);
  const [isPlacingWalls, setIsPlacingWalls] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const historyRef = useRef(null);

  const ROWS = 8;
  const COLS = 8;

  useEffect(() => {
    initializeGrid();
  }, []);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [visitHistory]);

  const initializeGrid = () => {
    const newGrid = [];
    for (let i = 0; i < ROWS; i++) {
      const row = [];
      for (let j = 0; j < COLS; j++) {
        row.push({
          row: i,
          col: j,
          isWall: false
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  };

  const getNeighbors = (row, col) => {
    const directions = [
      [-1, 0], // up
      [1, 0],  // down
      [0, -1], // left
      [0, 1]   // right
    ];

    return directions
        .map(([dr, dc]) => ({
          row: row + dr,
          col: col + dc
        }))
        .filter(({row, col}) =>
            row >= 0 && row < ROWS &&
            col >= 0 && col < COLS &&
            !grid[row][col].isWall
        );
  };

  const bfsStep = () => {
    if (queue.length === 0) {
      setIsRunning(false);
      return;
    }

    const current = queue.shift();
    const neighbors = getNeighbors(current.row, current.col);

    const newQueue = [...queue];
    const newVisited = new Set(visited);
    const newHistory = [...visitHistory];

    for (const neighbor of neighbors) {
      const key = `${neighbor.row},${neighbor.col}`;
      if (!newVisited.has(key)) {
        newVisited.add(key);
        newQueue.push(neighbor);
        newHistory.push({
          position: `(${neighbor.row}, ${neighbor.col})`,
          step: newHistory.length + 1
        });
      }
    }

    setQueue(newQueue);
    setVisited(newVisited);
    setVisitHistory(newHistory);
  };

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(bfsStep, 500);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, queue, visited]);

  const handleCellClick = (row, col) => {
    if (isSelectingStart) {
      if (grid[row][col].isWall) return;
      setStartNode({ row, col });
      setIsSelectingStart(false);
      return;
    }

    if (isPlacingWalls && !isRunning) {
      if (row === startNode.row && col === startNode.col) return;
      const newGrid = [...grid];
      newGrid[row][col].isWall = !isErasing;
      setGrid(newGrid);
    }
  };

  const handleCellDrag = (e, row, col) => {
    e.preventDefault();
    if (e.buttons === 1 && isPlacingWalls && !isRunning) {
      handleCellClick(row, col);
    }
  };

  const startBFS = () => {
    setVisited(new Set([`${startNode.row},${startNode.col}`]));
    setQueue([startNode]);
    setVisitHistory([{
      position: `(${startNode.row}, ${startNode.col})`,
      step: 0
    }]);
    setIsRunning(true);
  };

  const resetBFS = () => {
    setIsRunning(false);
    setVisited(new Set());
    setQueue([]);
    setVisitHistory([]);
    initializeGrid();
  };

  const getCellColor = (row, col) => {
    if (row === startNode.row && col === startNode.col) return 'bg-green-500';
    if (grid[row][col].isWall) return 'bg-gray-800';
    if (visited.has(`${row},${col}`)) return 'bg-blue-500';
    return 'bg-white';
  };

  const getInteractionClass = (row, col) => {
    if (isPlacingWalls && !isRunning && !(row === startNode.row && col === startNode.col)) {
      return 'cursor-pointer hover:opacity-75';
    }
    if (isSelectingStart && !grid[row][col].isWall) {
      return 'cursor-pointer hover:opacity-75';
    }
    return '';
  };

  const CustomButton = ({ onClick, disabled, active, children }) => (
      <button
          onClick={onClick}
          disabled={disabled}
          className={`
        px-4 py-2 rounded-md font-medium flex items-center gap-2
        transition-colors duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${active
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}
      `}
      >
        {children}
      </button>
  );

  return (
      <div className="flex gap-4 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-6">BFS Visualization</h2>
          <div className="flex flex-col gap-4">
            <div className="grid gap-1">
              {grid.map((row, i) => (
                  <div key={i} className="flex gap-1">
                    {row.map((cell, j) => (
                        <div
                            key={`${i}-${j}`}
                            className={`w-8 h-8 border ${getCellColor(i, j)} 
                      ${getInteractionClass(i, j)}
                      transition-colors duration-300`}
                            onClick={() => handleCellClick(i, j)}
                            onMouseEnter={(e) => handleCellDrag(e, i, j)}
                            onDragStart={(e) => e.preventDefault()}
                        />
                    ))}
                  </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <CustomButton
                  onClick={() => isRunning ? setIsRunning(false) : startBFS()}
                  disabled={isSelectingStart || isPlacingWalls}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRunning ? 'Pause' : 'Start'}
              </CustomButton>

              <CustomButton
                  onClick={resetBFS}
                  disabled={isSelectingStart || isPlacingWalls}
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </CustomButton>

              <CustomButton
                  onClick={() => {
                    setIsSelectingStart(!isSelectingStart);
                    setIsPlacingWalls(false);
                  }}
                  disabled={isRunning}
                  active={isSelectingStart}
              >
                <MousePointer2 className="w-4 h-4" />
                {isSelectingStart ? 'Cancel Selection' : 'Select Start'}
              </CustomButton>

              <CustomButton
                  onClick={() => {
                    setIsPlacingWalls(!isPlacingWalls);
                    setIsSelectingStart(false);
                    setIsErasing(false);
                  }}
                  disabled={isRunning}
                  active={isPlacingWalls && !isErasing}
              >
                Place Walls
              </CustomButton>

              <CustomButton
                  onClick={() => {
                    setIsPlacingWalls(!isPlacingWalls);
                    setIsSelectingStart(false);
                    setIsErasing(true);
                  }}
                  disabled={isRunning}
                  active={isPlacingWalls && isErasing}
              >
                Erase Walls
              </CustomButton>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 w-64">
          <h2 className="text-2xl font-bold mb-6">Visit History</h2>
          <div
              ref={historyRef}
              className="h-96 overflow-y-auto pr-2"
          >
            <div className="space-y-2">
              {visitHistory.map((visit, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    Step {visit.step}: Position {visit.position}
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
};

export default BFSVisualization;