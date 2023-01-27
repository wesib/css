import { configureJest } from '@run-z/project-config';

export default await configureJest({
  restoreMocks: true,
  testEnvironment: 'jsdom',
});
