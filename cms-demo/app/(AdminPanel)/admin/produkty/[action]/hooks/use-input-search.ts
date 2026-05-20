import { useState } from "react";

export function useInputSearch() {
  const [inputSearch, setInputSearch] = useState("");

  const clearSearch = () => setInputSearch("");

  return {
    inputSearch,
    setInputSearch,
    clearSearch,
  };
}
