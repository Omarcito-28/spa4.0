import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet;

export async function setup({ provide }) {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  provide('mongoUri', replSet.getUri());
}

export async function teardown() {
  await replSet?.stop();
}
