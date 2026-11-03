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
    (customer.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (customer.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 font-poppins text-2xl font-bold text-white sm:text-3xl lg:text-4xl">Clients</h1>
        <p className="text-sm text-gray-400 sm:text-base">Liste de tous les clients</p>
      </div>

      <div className="mb-5">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-dark-light py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-dark-light p-4 sm:p-6">
          <p className="mb-2 text-sm text-gray-400">Total clients</p>
          <p className="text-3xl font-bold text-white sm:text-4xl">{customers.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl bg-dark-light py-12 text-center text-gray-400">Chargement des clients...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="rounded-xl bg-dark-light px-4 py-12 text-center text-gray-400">
          {search ? 'Aucun client ne correspond à cette recherche.' : 'Aucun client enregistré.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:hidden">
            {filteredCustomers.map((customer) => (
              <article key={customer.id} className="min-w-0 rounded-xl border border-dark-lighter bg-dark-light p-4">
                <h2 className="break-words font-semibold text-white">{customer.full_name || 'Client'}</h2>
                <div className="mt-3 space-y-2 text-sm text-gray-300">
                  <p className="flex min-w-0 items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /><span className="break-all">{customer.email}</span></p>
                  <p className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /><span className="break-words">{customer.phone || 'Téléphone non renseigné'}</span></p>
                </div>
                <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-dark-lighter pt-3 text-xs text-gray-400">
                  <span>{customer.city || 'Ville non renseignée'}</span>
                  <span>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'Date inconnue'}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl bg-dark-light xl:block">
            <table className="w-full min-w-[760px]">
              <thead className="bg-dark">
                <tr>
                  <th className="p-4 text-left font-semibold text-white">Client</th>
                  <th className="p-4 text-left font-semibold text-white">Email</th>
                  <th className="p-4 text-left font-semibold text-white">Téléphone</th>
                  <th className="p-4 text-left font-semibold text-white">Ville</th>
                  <th className="p-4 text-left font-semibold text-white">Date d'inscription</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-t border-dark-lighter">
                    <td className="p-4 font-semibold text-white">{customer.full_name}</td>
                    <td className="break-all p-4 text-gray-300">{customer.email}</td>
                    <td className="p-4 text-gray-300">{customer.phone || '-'}</td>
                    <td className="p-4 text-gray-300">{customer.city || '-'}</td>
                    <td className="p-4 text-gray-300">{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCustomers;
