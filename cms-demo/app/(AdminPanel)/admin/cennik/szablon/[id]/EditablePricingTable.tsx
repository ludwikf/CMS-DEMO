import React, { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditablePricingTableProps {
  onChange: (data: PricingTableData) => void;
  initialData?: PricingTableData;
  tableType?: "regular" | "color";
}

export type PricingTableData = {
  heights: number[];
  widths: number[];
  prices: number[][];
  tableType?: "regular" | "color";
  colorGroupName?: string;
  colors?: string[];
};

const staticHeights = [
  0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2,
  2.3, 2.4, 2.5,
];
const staticWidths = [
  0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5,
];

const defaultHeights = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5];
const defaultWidths = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

const defaultPrices = defaultHeights.map(() => defaultWidths.map(() => 0));

export default function EditablePricingTable({
  onChange,
  initialData,
  tableType = "regular",
}: EditablePricingTableProps) {
  const [prices, setPrices] = React.useState<number[][]>(
    initialData && initialData.prices ? initialData.prices : defaultPrices
  );
  const [bulkInput, setBulkInput] = React.useState<string>("");
  const [currentTableType, setCurrentTableType] = React.useState<
    "regular" | "color"
  >(initialData?.tableType || tableType);

  const [colors, setColors] = React.useState<string[]>(
    initialData?.colors || []
  );
  const [newColor, setNewColor] = React.useState<string>("");

  const [heights, setHeights] = React.useState<number[]>(
    initialData?.heights || defaultHeights
  );
  const [widths, setWidths] = React.useState<number[]>(
    initialData?.widths || defaultWidths
  );
  const [startWidth, setStartWidth] = React.useState<string>(
    widths[0]?.toString() || "0.4"
  );
  const [startHeight, setStartHeight] = React.useState<string>(
    heights[0]?.toString() || "0.8"
  );
  const [widthStep, setWidthStep] = React.useState<string>("0.1");
  const [heightStep, setHeightStep] = React.useState<string>("0.1");
  const scrollRef = useRef<HTMLDivElement>(null);

  const widthStepNum = parseFloat(widthStep) > 0 ? parseFloat(widthStep) : 0.1;
  const heightStepNum =
    parseFloat(heightStep) > 0 ? parseFloat(heightStep) : 0.1;

  const startWidthNum = parseFloat(startWidth.replace(/,/g, ".")) || 0;
  const startHeightNum = parseFloat(startHeight.replace(/,/g, ".")) || 0;

  React.useEffect(() => {
    if (initialData) {
      if (initialData.prices) {
        setPrices(initialData.prices);
      }
      if (initialData.heights) {
        setHeights(initialData.heights);
      }
      if (initialData.widths) {
        setWidths(initialData.widths);
      }
      if (initialData.tableType) {
        setCurrentTableType(initialData.tableType);
      }
      if (initialData.colors) {
        setColors(initialData.colors);
      }
    }
  }, [initialData]);

  React.useEffect(() => {
    if (initialData) {
      onChange({
        heights,
        widths,
        prices,
        tableType: currentTableType,
        colors: currentTableType === "color" ? colors : undefined,
      });
    }
  }, []);

  React.useEffect(() => {
    const newWidths = Array.from({ length: widths.length }, (_, i) =>
      parseFloat((startWidthNum + i * widthStepNum).toFixed(3))
    );
    if (JSON.stringify(newWidths) !== JSON.stringify(widths)) {
      setWidths(newWidths);
      setTimeout(() => {
        onChange({
          heights,
          widths: newWidths,
          prices,
          tableType: currentTableType,
          colors: currentTableType === "color" ? colors : undefined,
        });
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startWidthNum, widthStepNum]);

  React.useEffect(() => {
    const newHeights = Array.from({ length: heights.length }, (_, i) =>
      parseFloat((startHeightNum + i * heightStepNum).toFixed(3))
    );
    if (JSON.stringify(newHeights) !== JSON.stringify(heights)) {
      setHeights(newHeights);
      setTimeout(() => {
        onChange({
          heights: newHeights,
          widths,
          prices,
          tableType: currentTableType,
          colors: currentTableType === "color" ? colors : undefined,
        });
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startHeightNum, heightStepNum]);

  const addColor = () => {
    if (newColor && !colors.includes(newColor)) {
      const newColors = [...colors, newColor];
      setColors(newColors);
      setNewColor("");
      setTimeout(() => {
        onChange({
          heights,
          widths,
          prices,
          tableType: currentTableType,
          colors: newColors,
        });
      }, 0);
    }
  };

  const removeColor = (colorToRemove: string) => {
    const newColors = colors.filter((color) => color !== colorToRemove);
    setColors(newColors);
    setTimeout(() => {
      onChange({
        heights,
        widths,
        prices,
        tableType: currentTableType,
        colors: newColors,
      });
    }, 0);
  };

  const setCell = (row: number, col: number, value: number) => {
    setPrices((prices) => {
      const newPrices = prices.map((r, i) =>
        i === row ? r.map((c, j) => (j === col ? value : c)) : r
      );
      setTimeout(() => {
        onChange({
          heights,
          widths,
          prices: newPrices,
          tableType: currentTableType,
          colors: currentTableType === "color" ? colors : undefined,
        });
      }, 0);
      return newPrices;
    });
  };

  const addRow = () => {
    const newHeight =
      heights.length > 0 ? heights[heights.length - 1] + 0.1 : 0.8;
    const newHeights = [...heights, newHeight];
    setHeights(newHeights);

    const newPrices = [...prices, new Array(widths.length).fill(0)];
    setPrices(newPrices);

    setTimeout(() => {
      onChange({
        heights: newHeights,
        widths,
        prices: newPrices,
        tableType: currentTableType,
        colors: currentTableType === "color" ? colors : undefined,
      });
    }, 0);
  };

  const removeRow = () => {
    if (heights.length <= 1) return;

    const newHeights = heights.slice(0, -1);
    setHeights(newHeights);

    const newPrices = prices.slice(0, -1);
    setPrices(newPrices);

    setTimeout(() => {
      onChange({
        heights: newHeights,
        widths,
        prices: newPrices,
        tableType: currentTableType,
        colors: currentTableType === "color" ? colors : undefined,
      });
    }, 0);
  };

  const addColumn = () => {
    const newWidth = widths.length > 0 ? widths[widths.length - 1] + 0.1 : 0.4;
    const newWidths = [...widths, newWidth];
    setWidths(newWidths);

    const newPrices = prices.map((row) => [...row, 0]);
    setPrices(newPrices);

    setTimeout(() => {
      onChange({
        heights,
        widths: newWidths,
        prices: newPrices,
        tableType: currentTableType,
        colors: currentTableType === "color" ? colors : undefined,
      });
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    }, 0);
  };

  const removeColumn = () => {
    if (widths.length <= 1) return;

    const newWidths = widths.slice(0, -1);
    setWidths(newWidths);

    const newPrices = prices.map((row) => row.slice(0, -1));
    setPrices(newPrices);

    setTimeout(() => {
      onChange({
        heights,
        widths: newWidths,
        prices: newPrices,
        tableType: currentTableType,
        colors: currentTableType === "color" ? colors : undefined,
      });
    }, 0);
  };

  const generateTemplate = () => {
    const template = [];
    for (let row = 0; row < heights.length; row++) {
      for (let col = 0; col < widths.length; col++) {
        const height =
          heights[row] % 1 === 0
            ? heights[row].toString()
            : heights[row].toFixed(2).replace(/\.?0+$/, "");
        const width =
          widths[col] % 1 === 0
            ? widths[col].toString()
            : widths[col].toFixed(2).replace(/\.?0+$/, "");
        const currentPrice = prices[row][col];
        template.push(`${width}/${height}/${currentPrice}`);
      }
    }
    setBulkInput(template.join(", "));
  };

  const applyBulkInput = () => {
    let newPrices = prices.map((row) => [...row]);
    const entries = bulkInput.split(",");
    entries.forEach((entry) => {
      const parts = entry.trim().split("/");
      if (parts.length !== 3) return;
      const [widthStr, heightStr, valueStr] = parts;
      const width = parseFloat(widthStr.replace(/,/g, "."));
      const height = parseFloat(heightStr.replace(/,/g, "."));
      const value = parseInt(valueStr);

      const rowIdx = heights.findIndex((h) => Math.abs(h - height) < 0.001);
      const colIdx = widths.findIndex((w) => Math.abs(w - width) < 0.001);

      if (rowIdx !== -1 && colIdx !== -1 && !isNaN(value) && value !== 0) {
        newPrices[rowIdx][colIdx] = value;
      }
    });
    setPrices(newPrices);
    setTimeout(() => {
      onChange({
        heights,
        widths,
        prices: newPrices,
        tableType: currentTableType,
        colors: currentTableType === "color" ? colors : undefined,
      });
    }, 0);
  };

  return (
    <div>

      {currentTableType === "color" && (
        <div className="mb-4 p-4 border border-gray-300 dark:border-[#666] rounded-lg">
          <h4 className="text-sm font-medium mb-2">Kolory w grupie:</h4>
          <div className="flex gap-2 mb-2">
            <Input
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newColor) {
                  e.preventDefault();
                  addColor();
                }
              }}
              placeholder="Dodaj kolor"
              className="flex-1"
            />
            <button
              type="button"
              onClick={addColor}
              disabled={!newColor}
              className="px-3 py-2 text-sm bg-mainTheme text-white rounded hover:bg-mainTheme/80 transition disabled:opacity-50"
            >
              Dodaj
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <span
                key={color}
                className="flex items-center bg-mainTheme/10 dark:bg-mainTheme/20 text-mainTheme dark:text-mainTheme px-3 py-1 rounded-full text-sm"
              >
                {color}
                <button
                  type="button"
                  className="ml-2 text-red-500 hover:text-red-700"
                  onClick={() => removeColor(color)}
                  aria-label={`Usuń kolor ${color}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}


      <div className="mb-4 flex flex-col gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Początkowa szerokość:</span>
          <Input
            type="text"
            inputMode="decimal"
            pattern="[0-9.]*"
            value={startWidth}
            onChange={(e) => setStartWidth(e.target.value.replace(/,/g, "."))}
            onKeyDown={(e) => {
              if (e.key === ",") e.preventDefault();
            }}
            className="w-20 text-center"
          />
          <span className="text-sm font-medium ml-4">Krok:</span>
          <Input
            type="text"
            inputMode="decimal"
            pattern="[0-9.]*"
            value={widthStep}
            onChange={(e) => setWidthStep(e.target.value.replace(/,/g, "."))}
            onKeyDown={(e) => {
              if (e.key === ",") e.preventDefault();
            }}
            className="w-16 text-center"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Początkowa wysokość:</span>
          <Input
            type="text"
            inputMode="decimal"
            pattern="[0-9.]*"
            value={startHeight}
            onChange={(e) => setStartHeight(e.target.value.replace(/,/g, "."))}
            onKeyDown={(e) => {
              if (e.key === ",") e.preventDefault();
            }}
            className="w-20 text-center"
          />
          <span className="text-sm font-medium ml-4">Krok:</span>
          <Input
            type="text"
            inputMode="decimal"
            pattern="[0-9.]*"
            value={heightStep}
            onChange={(e) => setHeightStep(e.target.value.replace(/,/g, "."))}
            onKeyDown={(e) => {
              if (e.key === ",") e.preventDefault();
            }}
            className="w-16 text-center"
          />
        </div>
      </div>


      <div className="mb-4 flex gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Wiersze:</span>
          <button
            type="button"
            onClick={addRow}
            className="w-8 h-8 rounded bg-mainTheme text-white hover:bg-mainTheme/80 transition flex items-center justify-center"
          >
            +
          </button>
          <button
            type="button"
            onClick={removeRow}
            disabled={heights.length <= 1}
            className="w-8 h-8 rounded bg-mainTheme text-white hover:bg-mainTheme/80 transition flex items-center justify-center"
          >
            -
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
            {heights.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Kolumny:</span>
          <button
            type="button"
            onClick={addColumn}
            className="w-8 h-8 rounded bg-mainTheme text-white hover:bg-mainTheme/80 transition flex items-center justify-center"
          >
            +
          </button>
          <button
            type="button"
            onClick={removeColumn}
            disabled={widths.length <= 1}
            className="w-8 h-8 rounded bg-mainTheme text-white hover:bg-mainTheme/80 transition flex items-center justify-center"
          >
            -
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
            {widths.length}
          </span>
        </div>
      </div>


      <div
        ref={scrollRef}
        className="flex ml-[-1px] overflow-x-auto w-full rounded-md max-w-full"
      >
        <table className="min-w-max border-collapse text-sm bg-white dark:bg-[#1e1e1e]">
          <thead>
            <tr>
              <th className="border p-2 bg-white dark:bg-[#1e1e1e] w-[60px] bg-mainTheme/10 text-mainTheme font-semibold sticky left-0 z-10">
                cm
              </th>
              {widths.map((w, colIdx) => (
                <th
                  key={colIdx}
                  className="border p-2 bg-mainTheme/10 text-mainTheme font-semibold"
                >
                  {w % 1 === 0
                    ? w.toString()
                    : w.toFixed(2).replace(/\.?0+$/, "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heights.map((h, rowIdx) => (
              <tr key={rowIdx}>
                <td className="border bg-white dark:bg-[#1e1e1e] p-2 text-center bg-mainTheme/10 text-mainTheme font-semibold sticky left-0 z-10">
                  {h % 1 === 0
                    ? h.toString()
                    : h.toFixed(2).replace(/\.?0+$/, "")}
                </td>
                {widths.map((_, colIdx) => (
                  <td
                    key={colIdx}
                    className="border p-1 bg-white dark:bg-[#232323]"
                  >
                    <Input
                      type="number"
                      value={prices[rowIdx][colIdx]}
                      onChange={(e) =>
                        setCell(rowIdx, colIdx, parseInt(e.target.value) || 0)
                      }
                      onClick={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.select();
                      }}
                      className="w-16 text-center border-gray-300 dark:border-gray-600 focus:ring-mainTheme "
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      <div className="mt-4 flex flex-col gap-2">
        <label className="text-sm font-medium">
          Szybkie wypełnianie (szerokość/wysokość/cena):
        </label>
        <textarea
          className="border border-[#666] rounded p-2 w-full min-h-[60px] text-sm dark:bg-[#232323] dark:text-white"
          placeholder="0.4/0.8/113, 0.5/0.8/126, ..."
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              applyBulkInput();
            }
          }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="text-sm rounded px-4 py-[6px] bg-mainTheme text-white hover:bg-mainTheme/80 transition"
            onClick={applyBulkInput}
          >
            Zastosuj
          </button>
          <button
            type="button"
            className="text-sm rounded px-4 py-[6px] bg-white dark:bg-[#232323] text-black dark:text-white border border-gray-300 dark:border-[#666] hover:bg-gray-50 dark:hover:bg-[#333] transition"
            onClick={generateTemplate}
          >
            Generuj szablon
          </button>
        </div>
      </div>
    </div>
  );
}
