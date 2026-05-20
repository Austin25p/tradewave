import React, { useRef } from 'react';
import Papa from 'papaparse';
import { Upload } from 'lucide-react';
import { Trade } from '../lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useHaptic } from '../lib/haptic';
import { motion } from 'motion/react';

interface CsvImportButtonProps {
  onImport: (trades: Trade[]) => void;
}

export function CsvImportButton({ onImport }: CsvImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const haptic = useHaptic();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Mock normalization logic matching prompt: "normalizes different broker headers into a unified Standard Trade Format"
        const importedTrades: Trade[] = results.data.map((row: any) => ({
          id: uuidv4(),
          assetClass: row.AssetClass || 'Stocks',
          symbol: row.Symbol || row.Ticker || 'UNKNOWN',
          direction: row.Direction || (parseFloat(row.Quantity) > 0 ? 'Long' : 'Short'),
          entryDate: row.EntryDate || new Date().toISOString(),
          exitDate: row.ExitDate || new Date().toISOString(),
          entryTimestamp: new Date(row.EntryDate || Date.now()).getTime(),
          exitTimestamp: new Date(row.ExitDate || Date.now()).getTime(),
          entryPrice: parseFloat(row.EntryPrice || '0'),
          exitPrice: parseFloat(row.ExitPrice || '0'),
          quantity: Math.abs(parseFloat(row.Quantity || '0')),
          fees: parseFloat(row.Fees || row.Commissions || '0'),
          rMultiple: parseFloat(row.RMultiple || '0'),
          setup: row.Setup || 'Imported Breakout',
          netPnL: parseFloat(row.NetPnL || row.Profit || '0'),
          executionErrors: row.ExecutionErrors ? row.ExecutionErrors.split('|') : [],
          thesis: row.Thesis || '',
        }));

        onImport(importedTrades);
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  return (
    <div>
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          haptic('medium');
          fileInputRef.current?.click();
        }}
        className="glass-button flex items-center space-x-2 text-sm"
      >
        <Upload size={16} />
        <span>Import CSV</span>
      </motion.button>
    </div>
  );
}
