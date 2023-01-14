import { State } from "./state";
import { unlinkSync } from "fs";

// future issue: might be faster to use promises.unlink than unlinkSync
export const removeUnusedFiles = (state: State) => {
    state.getUnusedFiles().forEach(file => {
        unlinkSync(file);
    })
};