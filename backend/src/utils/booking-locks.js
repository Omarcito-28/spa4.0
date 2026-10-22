import User from '../models/user.model.js';
import BookingLock from '../models/booking-lock.model.js';

export const lockBookingResources = async (session, stylistUsernames) => {
  const names = [...new Set(stylistUsernames.map(name => name.trim().toLowerCase()))].sort();

  if (names.includes('')) {
    const result = await BookingLock.updateOne(
      { _id: 'unassigned' },
      { $inc: { version: 1 } },
      { session }
    );
    if (!result.matchedCount) {
      throw new Error('The unassigned booking lock has not been initialized.');
    }
  }

  for (const username of names.filter(Boolean)) {
    await User.updateOne(
      { username, role: 'STYLIST', isActive: { $ne: false } },
      { $inc: { bookingLockVersion: 1 } },
      { session }
    );
  }
};
