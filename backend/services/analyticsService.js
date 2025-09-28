// services/analyticsService.js

// Example in-memory analytics (replace with DB logic later)
const analyticsData = {
  totalUsers: 0,
  activeUsers: 0,
  reportsGenerated: 0,
  lastUpdated: new Date(),
};

// Fetch analytics data
function getAnalytics() {
  return { ...analyticsData, lastUpdated: new Date() };
}

// Update analytics (increment counters etc.)
function updateAnalytics(event) {
  if (event === 'user_registered') analyticsData.totalUsers++;
  if (event === 'user_active') analyticsData.activeUsers++;
  if (event === 'report_generated') analyticsData.reportsGenerated++;
  analyticsData.lastUpdated = new Date();
  return analyticsData;
}

module.exports = { getAnalytics, updateAnalytics };
