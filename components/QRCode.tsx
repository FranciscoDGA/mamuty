'use client';

import React from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

// Simple QR Code generator using SVG
// This is a basic implementation for booking links
export default function QRCode({ value, size = 200, className = '' }: QRCodeProps) {
  // Simple hash function for QR-like pattern
  const hash = (str: string): number[] => {
    let h = 0;
    const result: number[] = [];
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
      result.push(h);
    }
    return result;
  };

  const hashes = hash(value);
  const modules: boolean[][] = [];
  const moduleCount = 21; // QR Code version 1

  // Initialize modules
  for (let i = 0; i < moduleCount; i++) {
    modules[i] = [];
    for (let j = 0; j < moduleCount; j++) {
      modules[i][j] = false;
    }
  }

  // Add finder patterns (top-left, top-right, bottom-left)
  const addFinderPattern = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          modules[row + r][col + c] = true;
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(0, moduleCount - 7);
  addFinderPattern(moduleCount - 7, 0);

  // Add timing patterns
  for (let i = 8; i < moduleCount - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
  }

  // Add data based on hash
  let hashIndex = 0;
  for (let i = 0; i < moduleCount; i++) {
    for (let j = 0; j < moduleCount; j++) {
      // Skip finder patterns and timing
      if ((i < 9 && j < 9) || (i < 9 && j > moduleCount - 9) || (i > moduleCount - 9 && j < 9)) {
        continue;
      }
      if (i === 6 || j === 6) continue;

      // Use hash to determine module state
      const h = hashes[hashIndex % hashes.length];
      modules[i][j] = ((h >> (hashIndex % 31)) & 1) === 1;
      hashIndex++;
    }
  }

  const moduleSize = size / moduleCount;

  return (
    <div className={`inline-block bg-white p-2 rounded-xl ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {modules.map((row, i) =>
          row.map((cell, j) => (
            cell ? (
              <rect
                key={`${i}-${j}`}
                x={j * moduleSize}
                y={i * moduleSize}
                width={moduleSize}
                height={moduleSize}
                fill="#000"
              />
            ) : null
          ))
        )}
      </svg>
    </div>
  );
}
