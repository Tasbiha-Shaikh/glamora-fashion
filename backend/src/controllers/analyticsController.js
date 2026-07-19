const Analytics = require('../models/Analytics');
const Order = require('../models/Order');

const trackEvent = async (req, res) => {
  try {
    const { page, sessionId, eventType, productId } = req.body;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await Analytics.create({
      page,
      sessionId,
      eventType: eventType || 'pageview',
      productId: productId || null,
      userAgent,
    });

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalVisits = await Analytics.countDocuments({ eventType: 'pageview' });
    const todayVisits = await Analytics.countDocuments({ eventType: 'pageview', createdAt: { $gte: startOfToday } });
    const weekVisits = await Analytics.countDocuments({ eventType: 'pageview', createdAt: { $gte: startOfWeek } });
    const monthVisits = await Analytics.countDocuments({ eventType: 'pageview', createdAt: { $gte: startOfMonth } });

    const uniqueTotal = await Analytics.distinct('sessionId', { eventType: 'pageview' });
    const uniqueToday = await Analytics.distinct('sessionId', { eventType: 'pageview', createdAt: { $gte: startOfToday } });

    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const liveUsers = await Analytics.distinct('sessionId', { createdAt: { $gte: fiveMinutesAgo } });

    const dailyVisits = await Analytics.aggregate([
      { $match: { eventType: 'pageview', createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const topPages = await Analytics.aggregate([
      { $match: { eventType: 'pageview' } },
      { $group: { _id: '$page', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const topProducts = await Analytics.aggregate([
      { $match: { eventType: 'click', productId: { $ne: null } } },
      { $group: { _id: '$productId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
    ]);

    res.json({
      success: true,
      data: {
        visits: {
          total: totalVisits,
          today: todayVisits,
          week: weekVisits,
          month: monthVisits,
          uniqueTotal: uniqueTotal.length,
          uniqueToday: uniqueToday.length,
        },
        liveUsers: liveUsers.length,
        dailyVisits: dailyVisits.map(d => ({
          date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
          visits: d.count,
          uniqueVisitors: d.uniqueVisitors ? d.uniqueVisitors.length : 0,
        })),
        topPages,
        topProducts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { trackEvent, getSummary };