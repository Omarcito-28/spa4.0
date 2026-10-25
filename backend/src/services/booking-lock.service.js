// Serializa las reservas que compiten por el mismo estilista (o por la agenda
// sin estilista asignado) incrementando un contador dentro de la transacción.
export default class BookingLockService {
  static UNASSIGNED_LOCK_ID = 'unassigned';

  #users;
  #bookingLocks;

  constructor({ userModel, bookingLockModel }) {
    this.#users = userModel;
    this.#bookingLocks = bookingLockModel;
  }

  async initialize() {
    await this.#bookingLocks.updateOne(
      { _id: BookingLockService.UNASSIGNED_LOCK_ID },
      { $setOnInsert: { version: 0 } },
      { upsert: true }
    );
  }

  async lock(session, stylistUsernames) {
    const names = [...new Set(stylistUsernames.map(name => name.trim().toLowerCase()))].sort();

    if (names.includes('')) {
      const result = await this.#bookingLocks.updateOne(
        { _id: BookingLockService.UNASSIGNED_LOCK_ID },
        { $inc: { version: 1 } },
        { session }
      );
      if (!result.matchedCount) {
        throw new Error('The unassigned booking lock has not been initialized.');
      }
    }

    for (const username of names.filter(Boolean)) {
      await this.#users.updateOne(
        { username, role: 'STYLIST', isActive: { $ne: false } },
        { $inc: { bookingLockVersion: 1 } },
        { session }
      );
    }
  }
}
