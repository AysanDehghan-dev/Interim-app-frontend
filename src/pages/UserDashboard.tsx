import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, XCircle, Building2, MapPin, Calendar, RefreshCw } from 'lucide-react';
import api from '../config/api'; // Changed from axios to api
import { useAuth } from '../contexts/AuthContext';

interface Application {
  id: string;
  job_id: string;
  user_id?: string;
  job_title?: string;
  company_name?: string;
  company_secteur?: string;
  job_localisation?: string;
  job_type_contrat?: string;
  lettre_motivation: string;
  statut: 'En attente' | 'Acceptée' | 'Refusée';
  date_candidature: string;
  date_modification: string;
}

interface Stats {
  total_applications: number;
  by_status: {
    en_attente: number;
    acceptees: number;
    refusees: number;
  };
}

const UserDashboard: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'En attente' | 'Acceptée' | 'Refusée'>('all');

  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async (isRefresh = false) => {
    if (!user?.id) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      console.log('Fetching data for user:', user.id);
      
      // Fetch user applications
      try {
        const applicationsResponse = await api.get(`/api/applications/user/${user.id}`); // Changed from axios
        console.log('Applications response:', applicationsResponse.data);
        setApplications(applicationsResponse.data.applications || []);
      } catch (appError) {
        console.error('Error fetching applications:', appError);
        // Si l'endpoint user specific ne marche pas, essayer l'endpoint général
        try {
          const generalResponse = await api.get('/api/applications'); // Changed from axios
          console.log('General applications response:', generalResponse.data);
          // Filtrer les applications de cet utilisateur
          const userApplications = generalResponse.data.applications?.filter(
            (app: Application) => app.user_id === user.id
          ) || [];
          setApplications(userApplications);
        } catch (generalError) {
          console.error('Error fetching general applications:', generalError);
          setApplications([]);
        }
      }

      // Fetch statistics
      try {
        const statsResponse = await api.get('/api/applications/statistics'); // Changed from axios
        console.log('Stats response:', statsResponse.data);
        setStats(statsResponse.data);
      } catch (statsError) {
        console.error('Error fetching statistics:', statsError);
        // Calculer les stats manuellement basé sur les applications
        const userApps = applications;
        const calculatedStats = {
          total_applications: userApps.length,
          by_status: {
            en_attente: userApps.filter(app => app.statut === 'En attente').length,
            acceptees: userApps.filter(app => app.statut === 'Acceptée').length,
            refusees: userApps.filter(app => app.statut === 'Refusée').length,
          }
        };
        setStats(calculatedStats);
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      setError(error.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchUserData(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'En attente':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Acceptée':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Refusée':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Acceptée':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Refusée':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredApplications = activeTab === 'all' 
    ? applications 
    : applications.filter(app => app.statut === activeTab);

  // Calculer les stats locales si pas de stats du serveur
  const localStats = {
    total_applications: applications.length,
    by_status: {
      en_attente: applications.filter(app => app.statut === 'En attente').length,
      acceptees: applications.filter(app => app.statut === 'Acceptée').length,
      refusees: applications.filter(app => app.statut === 'Refusée').length,
    }
  };

  const displayStats = stats || localStats;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => fetchUserData()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Bonjour, {user?.prenom} {user?.nom} 👋
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
              Voici un aperçu de vos candidatures
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Briefcase className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total candidatures</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{displayStats.total_applications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En attente</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{displayStats.by_status.en_attente}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Acceptées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{displayStats.by_status.acceptees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Refusées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{displayStats.by_status.refusees}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Mes candidatures</h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  Toutes ({applications.length})
                </button>
                <button
                  onClick={() => setActiveTab('En attente')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'En attente'
                      ? 'bg-yellow-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-yellow-600'
                  }`}
                >
                  En attente ({applications.filter(app => app.statut === 'En attente').length})
                </button>
                <button
                  onClick={() => setActiveTab('Acceptée')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'Acceptée'
                      ? 'bg-green-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-green-600'
                  }`}
                >
                  Acceptées ({applications.filter(app => app.statut === 'Acceptée').length})
                </button>
                <button
                  onClick={() => setActiveTab('Refusée')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'Refusée'
                      ? 'bg-red-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-red-600'
                  }`}
                >
                  Refusées ({applications.filter(app => app.statut === 'Refusée').length})
                </button>
              </div>
            </div>
          </div>

          {/* Applications List */}
          <div className="p-6">
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {activeTab === 'all' ? 'Aucune candidature' : `Aucune candidature ${activeTab.toLowerCase()}`}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {activeTab === 'all' 
                    ? 'Vous n\'avez pas encore postulé à des offres d\'emploi.'
                    : `Vous n'avez aucune candidature ${activeTab.toLowerCase()}.`
                  }
                </p>
                <Link
                  to="/jobs"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Découvrir les offres
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <div
                    key={application.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {application.job_title || 'Titre non disponible'}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(application.statut)}`}>
                            {application.statut}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-1" />
                            <span>{application.company_name || 'Entreprise non disponible'}</span>
                          </div>
                          {application.job_localisation && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{application.job_localisation}</span>
                            </div>
                          )}
                          {application.job_type_contrat && (
                            <div className="flex items-center">
                              <Briefcase className="h-4 w-4 mr-1" />
                              <span>{application.job_type_contrat}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Candidature envoyée le {formatDate(application.date_candidature)}</span>
                        </div>

                        {application.lettre_motivation && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Lettre de motivation :</strong> {application.lettre_motivation}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {getStatusIcon(application.statut)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {applications.length > 0 && (
          <div className="mt-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h3>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/jobs"
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Voir plus d'offres
              </Link>
              <button
                onClick={() => window.location.href = '/user/profile'}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Modifier mon profil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;