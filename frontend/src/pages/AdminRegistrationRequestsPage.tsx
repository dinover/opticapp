import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { RegistrationRequest } from '../types';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminRegistrationRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await authAPI.getRegistrationRequests();
      setRequests(data);
    } catch (error: any) {
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number, status: 'approved' | 'rejected') => {
    try {
      await authAPI.approveRegistrationRequest(requestId, {
        status,
        admin_notes: adminNotes
      });
      
      toast.success(`Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente`);
      setShowModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
    } catch (error: any) {
      toast.error('Error al procesar la solicitud');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      default:
        return 'Pendiente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">Solo los administradores pueden acceder a esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitudes de Registro</h1>
              <p className="text-gray-600">Gestiona las solicitudes de registro de nuevas ópticas</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">Total de solicitudes</p>
              <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Cargando solicitudes...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay solicitudes</h3>
              <p className="text-gray-500">No hay solicitudes de registro pendientes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.username} - {request.optic_name}
                        </h3>
                        <p className="text-gray-600 text-sm">{request.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                      {request.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowModal(true);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Revisar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Información de la Óptica</h4>
                      <div className="space-y-1 text-gray-700">
                        <p><strong>Dirección:</strong> {request.optic_address}</p>
                        <p><strong>Teléfono:</strong> {request.optic_phone}</p>
                        <p><strong>Email:</strong> {request.optic_email}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Detalles de la Solicitud</h4>
                      <div className="space-y-1 text-gray-700">
                        <p><strong>Fecha:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
                        {request.admin_notes && (
                          <p><strong>Notas:</strong> {request.admin_notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para aprobar/rechazar */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Revisar Solicitud de {selectedRequest.username}
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas del Administrador (opcional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Agrega notas sobre esta solicitud..."
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleApprove(selectedRequest.id, 'approved')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Aprobar
              </button>
              <button
                onClick={() => handleApprove(selectedRequest.id, 'rejected')}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                <XCircle className="w-4 h-4 inline mr-2" />
                Rechazar
              </button>
            </div>

            <button
              onClick={() => {
                setShowModal(false);
                setSelectedRequest(null);
                setAdminNotes('');
              }}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistrationRequestsPage;
