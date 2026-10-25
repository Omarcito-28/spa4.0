import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../src/models/service.model.js';
import DatabaseSeeder from '../src/database/database-seeder.js';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Conectado a MongoDB');

await Service.deleteMany({});
console.log('🗑️ Servicios eliminados');

await Service.insertMany(DatabaseSeeder.DEFAULT_SERVICES.map(service => ({ ...service })));

console.log('✅ Servicios actualizados correctamente');
await mongoose.disconnect();
process.exit(0);
