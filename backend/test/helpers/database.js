import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { inject } from 'vitest';

// Conecta mongoose a una base aislada dentro del MongoDB en memoria.
export async function connectTestDatabase(name) {
  const uri = inject('mongoUri');
  if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/.test(uri)) {
    throw new Error(`Las pruebas solo pueden usar el MongoDB en memoria, no ${uri}`);
  }
  await mongoose.connect(uri, { dbName: `test_${name}_${crypto.randomBytes(4).toString('hex')}` });
}

export async function disconnectTestDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}
