import { Fragment } from 'react';
import { RPC } from "playroomkit";
import { useState, useRef } from "react";
import { Hexagon } from "./Hexagon";
import { useFrame } from '@react-three/fiber';

export const HEX_X_SPACING = 2.25;
export const HEX_Z_SPACING = 1.95;
export const NB_ROWS = 7;
export const NB_COLUMNS = 7;
export const FLOOR_HEIGHT = 10;
export const LAYER_OFFSET = 0.5;
export const CYLINDER_RADIUS = 4; // Radio del cilindro
export const HEXAGON_RADIUS = 1.5; // Radio de cada hexágono (ajústalo al tamaño de tu modelo)
export const CYLINDER_CIRCUMFERENCE = CYLINDER_RADIUS * Math.PI * 2;
export const HEXAGONS_PER_ROW = Math.floor(CYLINDER_CIRCUMFERENCE / (HEXAGON_RADIUS * Math.sqrt(3)));
export const ROWS = 7; // Cantidad de filas a lo largo del cilindro
export const FLOORS = [
  {
    color: "red",
  },
  {
    color: "blue",
  },
  {
    color: "green",
  },
  {
    color: "yellow",
  },
  {
    color: "purple",
  },
];

const RotatingCylinder = () => {
  const cylinderRef = useRef();

  // Establecer la rotación del cilindro
  useFrame(() => {
    cylinderRef.current.rotation.y += 0.005; // Esto hace que el cilindro gire
  });

  // Genera un array de elementos hexagonales
  const hexagons = Array.from({ length: ROWS }, (_, row) => {
    return Array.from({ length: HEXAGONS_PER_ROW }, (_, count) => {
      const angle = (Math.PI * 2 / HEXAGONS_PER_ROW) * count;
      const hexX = CYLINDER_RADIUS * Math.cos(angle);
      const hexY = CYLINDER_RADIUS * Math.sin(angle);
      const hexZ = (row - ROWS / 2) * HEXAGON_RADIUS * 1.5; // Posición en Z ajustada para cada fila
      
      return (
        <Hexagon
          key={`hex-${row}-${count}`}
          position={[hexX, hexZ, hexY]} // Ajuste las coordenadas según sea necesario
          rotation={[0, -angle, Math.PI / 2]} // Los hexágonos deben estar rotados para alinearse con la curva
          // ... otras props necesarias
        />
      );
    });
  }).flat();  // Aplana el array de arrays en un único array
  
  const cylinderYPosition = -FLOOR_HEIGHT * FLOORS.length;
  const cylinderZPosition = HEX_Z_SPACING * (NB_ROWS - 1) / 2;
  const cylinderXPosition = HEX_X_SPACING * (NB_COLUMNS - 1) / 2;

  return (
    <group 
      ref={cylinderRef} 
      rotation={[Math.PI / 2, 0, 0]} 
      position={[cylinderXPosition, cylinderYPosition, cylinderZPosition]}
    >
      {hexagons}
    </group>
  );
};

export const GameArena = () => {
  const [hexagonHit, setHexagonHit] = useState({});
  RPC.register("hexagonHit", (data) => {
    setHexagonHit((prev) => ({
      ...prev,
      [data.hexagonKey]: true,
    }));
  });

  return (
    <group
      position-x={-((NB_COLUMNS - 1) / 2) * HEX_X_SPACING}
      position-z={-((NB_ROWS - 1) / 2) * HEX_Z_SPACING}
    >
      {FLOORS.map((floor, floorIndex) => (
        <group key={floorIndex} position-y={floorIndex * -FLOOR_HEIGHT}>
          {[...Array(NB_ROWS)].map((_, rowIndex) => (
            <Fragment key={rowIndex}>
              <group
                position-z={rowIndex * HEX_Z_SPACING}
                position-x={rowIndex % 2 ? HEX_X_SPACING / 2 : 0}
              >
                {[...Array(NB_COLUMNS)].map((_, columnIndex) => (
                  <Hexagon
                    key={columnIndex}
                    position-x={columnIndex * HEX_X_SPACING}
                    color={floor.color}
                    onHit={() => {
                      const hexagonKey = `${floorIndex}-${rowIndex}-${columnIndex}`;
                      setHexagonHit((prev) => ({
                        ...prev,
                        [hexagonKey]: true,
                      }));
                      RPC.call("hexagonHit", { hexagonKey }, RPC.Mode.ALL);
                    }}
                    hit={hexagonHit[`${floorIndex}-${rowIndex}-${columnIndex}`]}
                  />
                ))}
              </group>
              {floorIndex % 2 == 0 && (
                <group
                  position-z={rowIndex * HEX_Z_SPACING}
                  position-x={rowIndex % 2 ? HEX_X_SPACING / 2 : 0}
                  position-y={-LAYER_OFFSET}
                >
                  {[...Array(NB_COLUMNS)].map((_, columnIndex) => (
                    <Hexagon
                      key={`double-${columnIndex}`}
                      position-x={columnIndex * HEX_X_SPACING}
                      color={floor.color}
                      onHit={() => {
                        const hexagonKey = `double-${floorIndex}-${rowIndex}-${columnIndex}`;
                        setHexagonHit((prev) => ({
                          ...prev,
                          [hexagonKey]: true,
                        }));
                        RPC.call("hexagonHit", { hexagonKey }, RPC.Mode.ALL);
                      }}
                      hit={hexagonHit[`double-${floorIndex}-${rowIndex}-${columnIndex}`]}
                    />
                  ))}
                </group>
              )}
            </Fragment>
          ))}
        </group>
      ))}
      <RotatingCylinder />
    </group>
  );
};
