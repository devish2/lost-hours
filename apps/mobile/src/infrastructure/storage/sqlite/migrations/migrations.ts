import type { Migration } from './Migration';
import { migration001Initial } from './migration001Initial';

export const migrations: readonly Migration[] = [migration001Initial];
