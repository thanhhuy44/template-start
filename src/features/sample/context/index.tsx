import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
} from "react";

export interface SampleItem {
  id: number;
  title: string;
}

export interface ContextType {
  items: SampleItem[];
  selectedItem: SampleItem | null;
  setSelectedItem: Dispatch<SetStateAction<SampleItem | null>>;
  isLoading: boolean;
}

export const Context = createContext<ContextType | null>(null);

export const ContextProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value?: ContextType;
}): React.ReactNode => {
  const defaultValue: ContextType = value ?? {
    items: [],
    selectedItem: null,
    setSelectedItem: () => {},
    isLoading: false,
  };
  return <Context.Provider value={defaultValue}>{children}</Context.Provider>;
};

export const useSampleContext = (): ContextType => {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useSampleContext must be used within ContextProvider");
  }
  return context;
};
