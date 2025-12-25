import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { defineConfig } from 'rollup';
import typescript from 'rollup-plugin-typescript2';

import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
  input: 'src/index.ts',
  output: [
    {
      file: packageJson.main,
      format: 'cjs',
      exports: 'named',
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
      exports: 'named',
    },
    {
      file: `${packageJson.umd}/lucia-sdk-latest.min.js`,
      format: 'umd',
      name: 'LuciaSDK',
      exports: 'named',
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({ useTsconfigDeclarationDir: true }),
    replace({
      __LUCIA_SDK_VERSION__: JSON.stringify(packageJson.version),
      preventAssignment: true,
    }),
    terser(),
  ],
});
