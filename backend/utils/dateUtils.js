// utils/dateUtils.js

class DateUtils {
  
  // Get start of day
  static getStartOfDay(date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  // Get end of day
  static getEndOfDay(date = new Date()) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  // Get start of week (Monday)
  static getStartOfWeek(date = new Date()) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  // Get end of week (Sunday)
  static getEndOfWeek(date = new Date()) {
    const end = new Date(date);
    const day = end.getDay();
    const diff = end.getDate() + (7 - day);
    end.setDate(diff);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  // Get start of month
  static getStartOfMonth(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  // Get end of month
  static getEndOfMonth(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  // Get start of year
  static getStartOfYear(date = new Date()) {
    return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
  }

  // Get end of year
  static getEndOfYear(date = new Date()) {
    return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  // Get date range for timeframe
  static getTimeframeRange(timeframe = '30d', endDate = new Date()) {
    const end = new Date(endDate);
    let start = new Date(end);

    // Parse timeframe (e.g., '7d', '1w', '3m', '1y')
    const match = timeframe.match(/^(\d+)([dwmyh])$/);
    if (!match) {
      // Default to 30 days if invalid format
      start.setDate(end.getDate() - 30);
      return { start, end };
    }

    const [, value, unit] = match;
    const amount = parseInt(value);

    switch (unit) {
      case 'h': // hours
        start.setHours(end.getHours() - amount);
        break;
      case 'd': // days
        start.setDate(end.getDate() - amount);
        break;
      case 'w': // weeks
        start.setDate(end.getDate() - (amount * 7));
        break;
      case 'm': // months
        start.setMonth(end.getMonth() - amount);
        break;
      case 'y': // years
        start.setFullYear(end.getFullYear() - amount);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }

    return { start, end };
  }

  // Format date for display
  static formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    const formats = {
      'YYYY-MM-DD': `${year}-${month}-${day}`,
      'DD/MM/YYYY': `${day}/${month}/${year}`,
      'MM/DD/YYYY': `${month}/${day}/${year}`,
      'YYYY-MM-DD HH:mm': `${year}-${month}-${day} ${hours}:${minutes}`,
      'YYYY-MM-DD HH:mm:ss': `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
      'DD MMM YYYY': `${day} ${this.getMonthName(d.getMonth())} ${year}`,
      'MMM DD, YYYY': `${this.getMonthName(d.getMonth())} ${day}, ${year}`,
      'relative': this.getRelativeTime(d)
    };

    return formats[format] || formats['YYYY-MM-DD'];
  }

  // Get month name
  static getMonthName(monthIndex, short = true) {
    const months = {
      long: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      short: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ]
    };

    return months[short ? 'short' : 'long'][monthIndex] || '';
  }

  // Get day name
  static getDayName(dayIndex, short = true) {
    const days = {
      long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    };

    return days[short ? 'short' : 'long'][dayIndex] || '';
  }

  // Get relative time (e.g., "2 hours ago", "3 days ago")
  static getRelativeTime(date) {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  }

  // Check if date is today
  static isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    
    return today.toDateString() === checkDate.toDateString();
  }

  // Check if date is yesterday
  static isYesterday(date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const checkDate = new Date(date);
    
    return yesterday.toDateString() === checkDate.toDateString();
  }

  // Check if date is in current week
  static isThisWeek(date) {
    const weekStart = this.getStartOfWeek();
    const weekEnd = this.getEndOfWeek();
    const checkDate = new Date(date);
    
    return checkDate >= weekStart && checkDate <= weekEnd;
  }

  // Check if date is in current month
  static isThisMonth(date) {
    const today = new Date();
    const checkDate = new Date(date);
    
    return today.getMonth() === checkDate.getMonth() && 
           today.getFullYear() === checkDate.getFullYear();
  }

  // Get age in years
  static getAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Add time to date
  static addTime(date, amount, unit) {
    const result = new Date(date);
    
    switch (unit) {
      case 'seconds':
        result.setSeconds(result.getSeconds() + amount);
        break;
      case 'minutes':
        result.setMinutes(result.getMinutes() + amount);
        break;
      case 'hours':
        result.setHours(result.getHours() + amount);
        break;
      case 'days':
        result.setDate(result.getDate() + amount);
        break;
      case 'weeks':
        result.setDate(result.getDate() + (amount * 7));
        break;
      case 'months':
        result.setMonth(result.getMonth() + amount);
        break;
      case 'years':
        result.setFullYear(result.getFullYear() + amount);
        break;
    }
    
    return result;
  }

  // Subtract time from date
  static subtractTime(date, amount, unit) {
    return this.addTime(date, -amount, unit);
  }

  // Get business days between dates (excluding weekends)
  static getBusinessDays(startDate, endDate) {
    let count = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    while (start <= end) {
      const dayOfWeek = start.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        count++;
      }
      start.setDate(start.getDate() + 1);
    }
    
    return count;
  }

  // Generate date range array
  static generateDateRange(startDate, endDate, increment = 'day') {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    while (start <= end) {
      dates.push(new Date(start));
      
      switch (increment) {
        case 'hour':
          start.setHours(start.getHours() + 1);
          break;
        case 'day':
          start.setDate(start.getDate() + 1);
          break;
        case 'week':
          start.setDate(start.getDate() + 7);
          break;
        case 'month':
          start.setMonth(start.getMonth() + 1);
          break;
        case 'year':
          start.setFullYear(start.getFullYear() + 1);
          break;
      }
    }
    
    return dates;
  }

  // Parse various date formats
  static parseDate(dateString) {
    if (!dateString) return null;
    
    // Try different formats
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
      /^(\d{4})\/(\d{2})\/(\d{2})$/ // YYYY/MM/DD
    ];
    
    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        const [, part1, part2, part3] = match;
        
        // Determine date parts based on format
        if (format === formats[0] || format === formats[3]) {
          // YYYY-MM-DD or YYYY/MM/DD
          return new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
        } else {
          // DD/MM/YYYY or DD-MM-YYYY
          return new Date(parseInt(part3), parseInt(part2) - 1, parseInt(part1));
        }
      }
    }
    
    // Fallback to Date constructor
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  // Get timezone offset in minutes
  static getTimezoneOffset(date = new Date()) {
    return date.getTimezoneOffset();
  }

  // Convert to UTC
  static toUTC(date) {
    const utc = new Date(date);
    utc.setMinutes(utc.getMinutes() + utc.getTimezoneOffset());
    return utc;
  }

  // Convert from UTC to local time
  static fromUTC(date) {
    const local = new Date(date);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local;
  }

  // Get week number of the year
  static getWeekNumber(date = new Date()) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }

  // Check if year is leap year
  static isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  // Get days in month
  static getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  // Format duration in milliseconds to human readable
  static formatDuration(durationMs) {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

module.exports = DateUtils;