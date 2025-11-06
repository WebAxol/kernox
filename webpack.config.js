import TerserPlugin from "terser-webpack-plugin";

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default  {
    entry : './lib/Kernox.js',
    output: {
        path : path.resolve(__dirname,'dist'),
        filename : 'kernox.min.js',
        library: {
            type: 'module',
        }
    },
    
    experiments: {
        outputModule: true
    },
    optimization : {
        minimize  : true,
        minimizer : [new TerserPlugin()]
    },
    mode : "development",
}