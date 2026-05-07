export const getSavedCharacter = () => {
  try {
    const saved = localStorage.getItem('mythic_saved_character');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Error reading from localStorage", e);
  }
  return null;
};
