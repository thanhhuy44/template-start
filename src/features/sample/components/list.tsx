import { useSampleContext } from "../context";

export const List = (): React.ReactNode => {
  const { items, isLoading, setSelectedItem } = useSampleContext();

  if (isLoading) {
    return <div data-testid="loading-state">Loading items...</div>;
  }

  if (items.length === 0) {
    return <div data-testid="empty-state">No items found.</div>;
  }

  return (
    <ul data-testid="item-list">
      {items.map((item) => (
        <li
          key={item.id}
          onClick={() => setSelectedItem(item)}
          className="cursor-pointer"
        >
          {item.title}
        </li>
      ))}
    </ul>
  );
};
