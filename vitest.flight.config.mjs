import{realpathSync}from'node:fs';
import{defineConfig}from'vitest/config';
// The playable free-flight suite is separate from historical gate/platform tests.
export default defineConfig({root:realpathSync(process.cwd()),test:{include:['tests/flight*.test.ts'],fileParallelism:false,maxWorkers:1,isolate:true,testTimeout:15000,pool:'forks',reporters:['verbose']}});
