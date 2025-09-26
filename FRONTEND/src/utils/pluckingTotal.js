// Utility to fetch and sum today's plucking records
import axios from 'axios';

export async function getTodaysPluckingTotal(API_URL, date) {
  try {
    const token = localStorage.getItem('token');
    const { data } = await axios.get(`${API_URL}/api/plucking-records?date=${date}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {});
    // Sum all totalWeight for today
    return (data.items || data).reduce((sum, rec) => sum + (Number(rec.totalWeight) || 0), 0);
  } catch (e) {
    // Show Sweet error if unauthorized
    if (e?.response?.status === 401) {
      if (window.Swal) {
        window.Swal.fire('Unauthorized', 'You are not authorized to view plucking records. Please login again.', 'error');
      } else if (window.Sweet) {
        window.Sweet.error('You are not authorized to view plucking records. Please login again.');
      } else {
        alert('You are not authorized to view plucking records. Please login again.');
      }
    }
    return 0;
  }
}
