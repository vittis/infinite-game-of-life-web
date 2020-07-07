/* eslint-disable no-restricted-globals */
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState, useCallback } from 'react';
import { Client, Room } from 'colyseus.js';
import Grid from './grid';
import { FaPlay, FaPause } from 'react-icons/fa';

export const numRows = 19;
export const numCols = 19;

export function convertTo2dArray(arr: number[]) {
  const copy = [...arr];
  const newArr: number[][] = [];
  while (copy.length) newArr.push(copy.splice(0, numCols));
  return newArr;
}

let sliderGenRef = 0

function App() {
  const [secondsLeft, setSecondsLeft] = useState<string>('');
  const [room, setRoom] = useState<Room | undefined>();

  const [gridToShow, setGridToShow] = useState<number[][]>();
  const [displayGeneration, setDisplayGeneration] = useState(0);

  const [lastGrid, setLastGrid] = useState<number[][]>();
  const [lastGeneration, setLastGeneration] = useState(0);
  const [running, setRunning] = useState(false);

  const [allGens, setAllGens] = useState<{ board: number[]; generation: number }[]>([]);

  useEffect(() => {
    const client = new Client('ws://167.172.126.142');

    client
      .joinOrCreate('life_room')
      .then((room) => {
        setRoom(room);
        room.onStateChange((state: any) => {
          setLastGrid(convertTo2dArray(state.board));
          setGridToShow(convertTo2dArray(state.board));
          setLastGeneration(state.generation);
          setDisplayGeneration(state.generation);
          setRunning(false);
        });
        room.onMessage('tick', (timer) => {
          setSecondsLeft(new Date(timer * 1000).toISOString().substr(14, 5));
        });
        room.onMessage('receive_all', ({ allGens, state }) => {
          setAllGens(allGens);
          setLastGrid(convertTo2dArray(state.board));
          setGridToShow(convertTo2dArray(state.board));
          setDisplayGeneration(state.generation);
          setLastGeneration(state.generation);
          setRunning(false);
        });
      })
      .catch((e) => {
        console.log('JOIN ERROR', e);
      });
  }, []);

  useEffect(() => {
    if (allGens && displayGeneration !== lastGeneration && allGens[displayGeneration - 1]) {
      setGridToShow(convertTo2dArray(allGens[displayGeneration - 1].board));
    } else if (displayGeneration === lastGeneration) {
      setGridToShow(lastGrid);
    }
  }, [displayGeneration, lastGeneration]);

  const run = () => {
    setRunning(!running);
  };

  useEffect(() => {
    sliderGenRef = displayGeneration;
    const interval = setInterval(() => {
      if (sliderGenRef !== lastGeneration) {
        setDisplayGeneration((counter) => counter + 1);
        sliderGenRef += 1;
      } else {
        clearInterval(interval);
        setRunning(false);
      }
    }, 30);
    if (!running) {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    };
  }, [running]);

  const onSend = useCallback(
    ({ i, k }) => {
      if (displayGeneration === lastGeneration) {
        room?.send('click', { i, k });
      }
    },
    [room, displayGeneration, lastGeneration]
  );

  if (!gridToShow) {
    return <div>loading</div>;
  }
  return (
    <div className="my-5 flex flex-col w-full items-center">
      <div className="flex items-center">
        <div className="text-2xl font-bold mb-2">Infinite Game of Life </div>
      </div>
      <div className="mb-1 flex flex-col-reverse">
        <div className="mt-1 flex flex-col items-center">
          <div className="flex items-center">
            <input
              className="rounded-lg overflow-hidden appearance-none bg-gray-400 h-3 w-full"
              type="range"
              min="0"
              max={lastGeneration}
              step="1"
              value={displayGeneration}
              onChange={(e) => setDisplayGeneration(Number.parseInt(e.target.value))}
            />
            <button
              onClick={run}
              className="ml-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-1 px-4 border border-gray-400 rounded shadow"
            >
              {!running ? <FaPlay /> : <FaPause />}
            </button>
          </div>
        </div>
        <div className="m-1 p-2 border border-gray-600 rounded">
          Next generation in: <span className="font-bold">{secondsLeft}</span>
        </div>
      </div>
      <div className="mb-3">
        Viewing generation: <b>{displayGeneration}</b>
      </div>
      {gridToShow && <Grid grid={gridToShow} onSend={onSend} />}

    </div>
  );
}

export default App;
