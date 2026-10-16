import { DetailCard } from "./components/card";
import { List } from "./components/list";
import { ContextProvider } from "./context";

export const SamplePage = (): React.ReactNode => {
  return (
    <ContextProvider>
      <div className="space-y-4">
        <List />
        <DetailCard />
      </div>
    </ContextProvider>
  );
};
