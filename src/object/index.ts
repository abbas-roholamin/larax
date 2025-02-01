import type { getProps } from "./type";

class Obj {
    static get({obj, path, daf}: getProps): object | string | undefined {
      return path.split(".").reduce((obj, current) => obj && obj[current], obj) || daf;
    }
}
  
export default Obj;
  