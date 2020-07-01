/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useState, useCallback } from 'react';
import { Client, Room } from 'colyseus.js';
import Grid from './grid';
import { FaPlay, FaPause } from 'react-icons/fa';

export const numRows = 5;
export const numCols = 5;

export function convertTo2dArray(arr: number[]) {
  const copy = [...arr];
  const newArr = [];
  while (copy.length) newArr.push(copy.splice(0, numCols));
  return newArr;
}

let sliderGenRef = 0;

function App() {
  const [grid, setGrid] = useState<number[][]>();
  const [generation, setGeneration] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<string>('');
  const [room, setRoom] = useState<Room | undefined>();
  const [sliderGen, setSliderGen] = useState<number>(0);
  const [allGens, setAllGens] = useState<any>();
  const [currentState, setCurrentState] = useState<any>();
  const [running, setRunning] = useState(false);

  useEffect(() => {
    sliderGenRef = sliderGen;
    const interval = setInterval(() => {
      if (sliderGenRef !== generation) {
        setSliderGen((counter) => counter + 1);
        sliderGenRef += 1;
      } else {
        clearInterval(interval);
        setRunning(false);
      }
    }, 25);
    if (!running) {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    };
  }, [running]);

  useEffect(() => {
    setSliderGen(generation);
  }, []);

  useEffect(() => {
    setSliderGen(generation);
    if (running) setRunning(false);
  }, [generation]);

  useEffect(() => {
    if (allGens) {
      setAllGens([...allGens, currentState]);
    }
  }, [currentState, generation]); 

  useEffect(() => {
    const client = new Client('ws://aqueous-ravine-97393.herokuapp.com');
 
    client
      .joinOrCreate('life_room')
      .then((room) => {
        setRoom(room);
        room.onStateChange((state: any) => {
          setCurrentState(state);
          setGrid(convertTo2dArray(state.board));
          setGeneration(state.generation);
        });
        room.onMessage('tick', (timer) => {
          setSecondsLeft(new Date(timer * 1000).toISOString().substr(14, 5));
        });
        room.onMessage('receive_all', (allGens) => {
          setAllGens(allGens);
        });
      })
      .catch((e) => {
        console.log('JOIN ERROR', e);
      });
  }, []);

  const run = () => {
    setRunning(!running);
  };

  const onSend = useCallback(
    ({ i, k }) => {
      if (generation === sliderGen) {
        console.log('click')
        room?.send('click', { i, k });
      }
    },
    [room],
  );

  if (!grid) {
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
              min="1"
              max={generation}
              step="1"
              value={sliderGen}
              onChange={(e) => setSliderGen(Number.parseInt(e.target.value))}
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
        Viewing generation: <b>{sliderGen}</b>
      </div>
      {allGens && allGens[sliderGen - 1] && (
        <Grid grid={convertTo2dArray(allGens[sliderGen - 1].board)} setGrid={setGrid} onSend={onSend} />
      )}
    </div>
  );
}

export default App;
