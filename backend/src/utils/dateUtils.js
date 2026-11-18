/**
 * Date & Time utilities tailored for Indian PG Operations
 */

// Format current date in YYYY-MM-DD using Indian Standard Time (IST)
export const getTodayIST = () => {
  const d = new Date();
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(d.getTime() + istOffset);
  return istTime.toISOString().split('T')[0];
};

// Format specific Date into YYYY-MM-DD (IST)
export const formatDateIST = (dateObj) => {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(d.getTime() + istOffset);
  return istTime.toISOString().split('T')[0];
};

// Get current day of week in lowercase ('monday', 'tuesday', ...) in IST
export const getDayOfWeekIST = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const d = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(d.getTime() + istOffset);
  return days[istTime.getUTCDay()];
};

// Check which meal is active based on current IST time or default timings
export const getCurrentMealType = () => {
  const d = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(d.getTime() + istOffset);
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;

  // 06:00 (360) to 11:30 (690): Breakfast
  if (totalMinutes >= 360 && totalMinutes < 690) {
    return 'breakfast';
  }
  // 11:30 (690) to 16:30 (990): Lunch
  if (totalMinutes >= 690 && totalMinutes < 990) {
    return 'lunch';
  }
  // 18:00 (1080) to 23:30 (1410): Dinner
  if (totalMinutes >= 1080 && totalMinutes < 1410) {
    return 'dinner';
  }

  // Off hours: return nearest or upcoming meal
  if (totalMinutes < 360) return 'breakfast';
  if (totalMinutes >= 990 && totalMinutes < 1080) return 'dinner';
  return 'breakfast';
};

// Return expiry time for a meal QR token (valid through meal window end + 30 mins grace)
export const getMealExpiryTime = (dateStr, mealType) => {
  // dateStr is YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(Number);
  
  let endHour = 11;
  let endMinute = 0;
  
  if (mealType === 'breakfast') {
    endHour = 11;
    endMinute = 0;
  } else if (mealType === 'lunch') {
    endHour = 16;
    endMinute = 0;
  } else if (mealType === 'dinner') {
    endHour = 23;
    endMinute = 30;
  }
  
  // Create IST date object: subtract 5.5 hrs to get UTC Date
  const dateObj = new Date(Date.UTC(year, month - 1, day, endHour - 5, endMinute - 30));
  return dateObj;
};
