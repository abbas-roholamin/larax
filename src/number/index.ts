import type { clampProps } from "./type";

class Num {
    static clamp({num, min, max}: clampProps): number {
      return Math.min(Math.max(num, min), max);
    }
}
  
export default Num;
  