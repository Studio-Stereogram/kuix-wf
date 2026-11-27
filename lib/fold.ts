import { createContext } from "react";

// Whether the first fold is fully covered by the curtain that slides over it.
// Anything heavy inside the fold (the splat backdrop) pauses while it is.
export const FoldContext = createContext({ covered: false });
