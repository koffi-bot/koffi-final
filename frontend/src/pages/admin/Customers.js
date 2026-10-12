import React, { useState, useEffect } from 'react';
import { adminStatsAPI } from '../../services/api';
import { Search, Mail, Phone } from 'lucide-react';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await adminStatsAPI.getAllUsers();
      setCustomers(response.data.filter(user => user.role === 'customer'));
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.full_name.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 font-poppins">Clients</h1>
        <p className="text-gray-400">Liste de tous les clients</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-light text-white px-4 py-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-dark-light rounded-xl p-6">
          <p className="text-gray-400 mb-2">Total clients</p>
          <p className="text-4xl font-bold text-white">{customers.length}</p>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-dark-light rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark">
            <tr>
              <th className="text-left text-white font-semibold p-4">Client</th>
              <th className="text-left text-white font-semibold p-4">Email</th>
              <th className="text-left text-white font-semibold p-4">Téléphone</th>
              <th className="text-left text-white font-semibold p-4">Ville</th>
              <th className="text-left text-white font-semibold p-4">Date d'inscription</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="border-t border-dark-lighter">
                <td className="p-4">
                  <p className="text-white font-semibold">{customer.full_name}</p>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Mail className="w-4 h-4" />
                    {customer.email}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Phone className="w-4 h-4" />
                    {customer.phone || '-'}
                  </div>
                </td>
                <td className="p-4 text-gray-300">
                  {customer.city || '-'}
                </td>
                <td className="p-4 text-gray-300">
                  {new Date(customer.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCustomers;
