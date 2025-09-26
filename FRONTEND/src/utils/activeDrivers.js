// Utility to fetch drivers with active (not delivered) transports
import axios from 'axios';

export async function getActiveDrivers(API_URL) {
  try {
    const { data } = await axios.get(`${API_URL}/api/transports`);
    // Return driver names with status not delivered
    return data.filter(t => t.status !== 'delivered').map(t => t.driverName);
  } catch (e) {
    return [];
  }
}
