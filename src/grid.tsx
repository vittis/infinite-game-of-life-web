import React from 'react';
import { numCols } from './App';

const Grid = ({ grid, onSend }: { grid: number[][]; onSend: any }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${numCols}, 20px)`
      }}
    >
      {grid.map((rows, i) =>
        rows.map((col, k) => (
          <div
            key={`${i}-${k}`}
            onClick={() => {
              onSend({ i, k });
            }}
            style={{
              width: 20,
              height: 20,
              backgroundColor: grid[i][k] ? 'pink' : undefined,
              border: 'solid 1px #444'
            }}
          />
        ))
      )}
    </div>
  );
};

export default Grid;
