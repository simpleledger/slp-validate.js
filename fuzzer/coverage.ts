import * as fs from "fs";
import * as path from "path";
import { fuzz } from "./dfuzz";

(() => {
    const files = fs.readdirSync("./corpus");
    files.forEach((file, index) => {
        const f = path.join("./corpus", file);
        const buf = fs.readFileSync(f);
        fuzz(buf);
    });
})();
