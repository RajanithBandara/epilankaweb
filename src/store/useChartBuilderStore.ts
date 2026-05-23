import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';

export type ChartWidgetConfig = {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'area';
  granularity: 'weekly' | 'yearly';
  diseaseIds: number[];
  years: number[];
};

interface ChartBuilderState {
  widgets: ChartWidgetConfig[];
  addWidget: (widget: ChartWidgetConfig) => void;
  updateWidget: (id: string, widget: Partial<Omit<ChartWidgetConfig, 'id'>>) => void;
  removeWidget: (id: string) => void;
  clearWidgets: () => void;
  setWidgets: (widgets: ChartWidgetConfig[]) => void;
}

const chartBuilderStore: StateCreator<
  ChartBuilderState,
  [],
  [["zustand/persist", ChartBuilderState]]
> = (set) => ({
      widgets: [],
      addWidget: (widget) => {
        set((state) => ({
          widgets: [...state.widgets, widget],
        }));
      },
      updateWidget: (id, updates) => {
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id ? { ...widget, ...updates } : widget
          ),
        }));
      },
      removeWidget: (id) => {
        set((state) => ({
          widgets: state.widgets.filter((widget) => widget.id !== id),
        }));
      },
      clearWidgets: () => {
        set({ widgets: [] });
      },
      setWidgets: (widgets) => {
        set({ widgets });
      },
    });

export const useChartBuilderStore = create<ChartBuilderState>()(
  persist(chartBuilderStore, {
    name: 'chart-builder-storage',
  })
);