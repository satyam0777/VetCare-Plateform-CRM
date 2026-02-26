
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const SubscriptionPanel = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/subscriptions');
        setSubscriptions(res.data);
      } catch (err) {
        setError('Failed to fetch subscriptions');
      }
      setLoading(false);
    };
    fetchSubscriptions();
  }, []);


  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-xl font-bold mb-2">Subscription Management</h3>
      {loading && <div className="text-blue-600">Loading subscriptions...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <ul>
        {subscriptions.length === 0 && !loading && !error && (
          <li className="text-gray-500">No subscriptions found.</li>
        )}
        {subscriptions.map(sub => (
          <li key={sub._id} className="border-b py-2 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <span className="font-semibold">{sub.user?.name || sub.user}</span> - {sub.plan} ({sub.status})
            </div>
            <div className="mt-2 md:mt-0">
              {/* Add manage/renew/cancel buttons here */}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SubscriptionPanel;
