import { useSampleContext } from "../context";

export const DetailCard = (): React.ReactNode => {
  const { selectedItem, setSelectedItem } = useSampleContext();

  if (!selectedItem) {
    return null;
  }

  return (
    <div data-testid="detail-card">
      <h3>{selectedItem.title}</h3>
      <button onClick={() => setSelectedItem(null)}>Close</button>
    </div>
  );
};
