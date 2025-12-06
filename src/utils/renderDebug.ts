/**
 * Simple render debug utility
 * Just logs component name when it re-renders
 */
export const useRenderCheck = (componentName: string) => {
  console.log(`${componentName} rerender chk`);
};
