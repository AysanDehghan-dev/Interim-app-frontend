import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Briefcase, TrendingUp, Eye, Mail, User, Calendar, MapPin, RefreshCw, XCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Job {
  id: string;
  titre: string;
  description: string;
  type_contrat: string;
  localisation?: string;
  salaire?: string;
  date_creation: string;
  actif: boolean;
  applications_count: number;
}

interface Application {
  id: string;
  job_title?: string;
  job_id?: string;
  user_name?: string;
  user_email?: string;
  user?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    competences: string[];
    experience: string;
  };
  statut: 'En attente' | 'Acceptée' | 'Refusée';
  date_candidature: string;
  lettre_motivation: string;
}

interface Stats {
  total_applications: number;
  by_status: {
    en_attente: number;
    acceptees: number;
    refusees: number;
  };
}

const CompanyDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'applications'>('overview');

  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchCompanyData();
    }
  }, [user]);

  const fetchCompanyData = async (isRefresh = false) => {
    if (!user?.id) {
      setError('Entreprise non connectée');
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
      
      console.log('Fetching data for company:', user.id);
      
      // Fetch company jobs
      try {
        const jobsResponse = await axios.get(`/api/companies/${user.id}/jobs`);
        console.log('Jobs response:', jobsResponse.data);
        setJobs(jobsResponse.data.jobs || []);
      } catch (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        // Fallback: fetch all jobs and filter by company
        try {
          const allJobsResponse = await axios.get('/api/jobs');
          const companyJobs = allJobsResponse.data.jobs?.filter(
            (job: any) => job.company_id === user.id
          ) || [];
          setJobs(companyJobs);
        } catch (fallbackError) {
          console.error('Error fetching jobs fallback:', fallbackError);
          setJobs([]);
        }
      }

      // Fetch company applications
      try {
        const applicationsResponse = await axios.get(`/api/applications/company/${user.id}?limit=10`);
        console.log('Applications response:', applicationsResponse.data);
        setRecentApplications(applicationsResponse.data.applications || []);
      } catch (appError) {
        console.error('Error fetching applications:', appError);
        // Fallback: fetch all applications and filter by company
        try {
          const allAppsResponse = await axios.get('/api/applications');
          const companyApps = allAppsResponse.data.applications?.filter(
            (app: any) => app.company_id === user.id
          ).slice(0, 10) || [];
          setRecentApplications(companyApps);
        } catch (fallbackError) {
          console.error('Error fetching applications fallback:', fallbackError);
          setRecentApplications([]);
        }
      }

      // Fetch statistics
      try {
        const statsResponse = await axios.get('/api/applications/statistics');
        console.log('Stats response:', statsResponse.data);
        setStats(statsResponse.data);
      } catch (statsError) {
        console.error('Error fetching statistics:', statsError);
        // Calculate local stats
        const calculatedStats = {
          total_applications: recentApplications.length,
          by_status: {
            en_attente: recentApplications.filter(app => app.statut === 'En attente').length,
            acceptees: recentApplications.filter(app => app.statut === 'Acceptée').length,
            refusees: recentApplications.filter(app => app.statut === 'Refusée').length,
          }
        };
        setStats(calculatedStats);
      }
    } catch (error: any) {
      console.error('Error fetching company data:', error);
      setError(error.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchCompanyData(true);
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: 'Acceptée' | 'Refusée') => {
    try {
      await axios.put(`/api/applications/${applicationId}/status`, {
        statut: newStatus
      });
      
      // Refresh applications
      fetchCompanyData();
      alert(`Candidature ${newStatus.toLowerCase()} avec succès !`);
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const deleteJob = async (jobId: string, jobTitle: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'offre "${jobTitle}" ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      await axios.delete(`/api/jobs/${jobId}`);
      alert('Offre supprimée avec succès !');
      // Refresh data
      fetchCompanyData();
    } catch (error: any) {
      console.error('Error deleting job:', error);
      alert(error.response?.data?.message || 'Erreur lors de la suppression de l\'offre');
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean, jobTitle: string) => {
    const action = currentStatus ? 'désactiver' : 'activer';
    if (!window.confirm(`Voulez-vous ${action} l'offre "${jobTitle}" ?`)) {
      return;
    }

    try {
      if (currentStatus) {
        // Deactivate job
        await axios.put(`/api/jobs/${jobId}/deactivate`);
      } else {
        // Reactivate job
        await axios.put(`/api/jobs/${jobId}`, { actif: true });
      }
      
      alert(`Offre ${currentStatus ? 'désactivée' : 'réactivée'} avec succès !`);
      // Refresh data
      fetchCompanyData();
    } catch (error: any) {
      console.error('Error updating job status:', error);
      alert(error.response?.data?.message || 'Erreur lors de la mise à jour de l\'offre');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(job => job.actif).length;
  const totalApplicationsReceived = jobs.reduce((sum, job) => sum + job.applications_count, 0);

  // Local stats calculation
  const localStats = {
    total_applications: recentApplications.length,
    by_status: {
      en_attente: recentApplications.filter(app => app.statut === 'En attente').length,
      acceptees: recentApplications.filter(app => app.statut === 'Acceptée').length,
      refusees: recentApplications.filter(app => app.statut === 'Refusée').length,
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
            onClick={() => fetchCompanyData()}
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
              Tableau de bord - {user?.nom} 🏢
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
              Gérez vos offres d'emploi et candidatures
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
            </button>
            <Link
              to="/jobs/create"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Publier une offre
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'jobs'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Mes offres ({totalJobs})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'applications'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Candidatures ({totalApplicationsReceived})
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Briefcase className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Offres publiées</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalJobs}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Offres actives</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeJobs}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Candidatures reçues</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalApplicationsReceived}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Eye className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En attente</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{displayStats.by_status.en_attente}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Applications */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Candidatures récentes</h2>
              </div>
              <div className="p-6">
                {recentApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Aucune candidature reçue pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentApplications.slice(0, 5).map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {application.user ? `${application.user.prenom} ${application.user.nom}` : 'Candidat'}
                            </span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {application.job_title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              <span>{application.user?.email || application.user_email}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDate(application.date_candidature)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            application.statut === 'En attente' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : application.statut === 'Acceptée'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {application.statut}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mes offres d'emploi</h2>
            </div>
            <div className="p-6">
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucune offre d'emploi
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Commencez par publier votre première offre d'emploi.
                  </p>
                  <Link
                    to="/jobs/create"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Publier une offre
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {job.titre}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              job.actif 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}>
                              {job.actif ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <div className="flex items-center">
                              <Briefcase className="h-4 w-4 mr-1" />
                              <span>{job.type_contrat}</span>
                            </div>
                            {job.localisation && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{job.localisation}</span>
                              </div>
                            )}
                            {job.salaire && (
                              <div className="flex items-center">
                                <span>💰 {job.salaire}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Publié le {formatDate(job.date_creation)}</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{job.applications_count} candidature{job.applications_count !== 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">
                            {job.description}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => toggleJobStatus(job.id, job.actif, job.titre)}
                            className={`text-sm font-medium transition-colors ${
                              job.actif 
                                ? 'text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300'
                                : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                            }`}
                          >
                            {job.actif ? 'Désactiver' : 'Réactiver'}
                          </button>
                          <span className="text-gray-300 dark:text-gray-600">|</span>
                          <button
                            onClick={() => deleteJob(job.id, job.titre)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Toutes les candidatures</h2>
            </div>
            <div className="p-6">
              {recentApplications.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Aucune candidature
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Les candidatures pour vos offres apparaîtront ici.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {recentApplications.map((application) => (
                    <div
                      key={application.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {application.user ? `${application.user.prenom} ${application.user.nom}` : 'Candidat'}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              application.statut === 'En attente' 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : application.statut === 'Acceptée'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {application.statut}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <div className="flex items-center">
                              <Briefcase className="h-4 w-4 mr-1" />
                              <span>{application.job_title}</span>
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              <span>{application.user?.email || application.user_email}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{formatDate(application.date_candidature)}</span>
                            </div>
                          </div>

                          {application.user?.competences && application.user.competences.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Compétences :</p>
                              <div className="flex flex-wrap gap-2">
                                {application.user.competences.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {application.user?.experience && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expérience :</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{application.user.experience}</p>
                            </div>
                          )}

                          {application.lettre_motivation && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lettre de motivation :</p>
                              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-sm text-gray-700 dark:text-gray-300">{application.lettre_motivation}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {application.statut === 'En attente' && (
                        <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => updateApplicationStatus(application.id, 'Acceptée')}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(application.id, 'Refusée')}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Refuser
                          </button>
                          <button className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            Contacter
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;