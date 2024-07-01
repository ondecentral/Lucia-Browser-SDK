import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import typescript from 'rollup-plugin-typescript2';

const packageJson = require('./package.json');

export default {
  input: 'src/index.ts',
  output: [
    {
      file: packageJson.main,
      format: 'cjs',
      exports: 'default',
      sourcemap: true,
    },
    {
      file: packageJson.module,
      format: 'esm',
      sourcemap: true,
    },
    {
      file: `${packageJson.umd}/lucia-sdk-${packageJson.version}.min.js`,
      format: 'umd',
      name: 'LuciaSDK',
    },
    {
      file: `${packageJson.umd}/lucia-sdk-latest.min.js`,
      format: 'umd',
      name: 'LuciaSDK',
    },
  ],
  plugins: [peerDepsExternal(), resolve(), commonjs(), typescript({ useTsconfigDeclarationDir: true }), terser()],
};
