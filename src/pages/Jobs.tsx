import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Clock, Building2, Euro, Filter } from 'lucide-react';
import api from '../config/api';
import { useAuth } from '../contexts/AuthContext';

interface Job {
  id: string;
  titre: string;
  description: string;
  salaire?: string;
  type_contrat: string;
  localisation?: string;
  competences_requises: string[];
  experience_requise?: string;
  date_creation: string;
  company_name?: string;
  company_secteur?: string;
  candidatures_count: number;
}

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [contractFilter, setContractFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [applying, setApplying] = useState<string | null>(null);

  const { user } = useAuth();

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(searchTerm && { search: searchTerm }),
        ...(locationFilter && { localisation: locationFilter }),
        ...(contractFilter && { type_contrat: contractFilter }),
      });
  
      const response = await api.get(`/api/jobs?${params}`); // Changed from axios to api
      setJobs(response.data.jobs);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, locationFilter, contractFilter]);  

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchJobs();
  };

  const applyToJob = async (jobId: string) => {
    if (!user || user.user_type !== 'user') {
      alert('Vous devez être connecté en tant que candidat pour postuler');
      return;
    }

    try {
      setApplying(jobId);
      await axios.post('/api/applications', {
        job_id: jobId,
        lettre_motivation: 'Candidature via la plateforme InterimApp'
      });
      alert('Candidature envoyée avec succès !');
    } catch (error: any) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Erreur lors de l\'envoi de la candidature');
      }
    } finally {
      setApplying(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Offres d'emploi intérimaire
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Découvrez {jobs.length} opportunités disponibles
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un emploi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Location */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Localisation..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Contract Type */}
              <select
                value={contractFilter}
                onChange={(e) => setContractFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Tous les contrats</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Interim">Intérim</option>
                <option value="Stage">Stage</option>
              </select>

              {/* Search Button */}
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </button>
            </div>
          </form>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                {/* Job Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {job.titre}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <Building2 className="h-4 w-4 mr-1" />
                    <span>{job.company_name}</span>
                  </div>
                  {job.localisation && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{job.localisation}</span>
                    </div>
                  )}
                </div>

                {/* Job Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Type de contrat :</span>
                    <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-full text-xs font-medium">
                      {job.type_contrat}
                    </span>
                  </div>
                  
                  {job.salaire && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Salaire :</span>
                      <div className="flex items-center">
                        <Euro className="h-3 w-3 mr-1" />
                        <span className="text-gray-900 dark:text-white font-medium">{job.salaire}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Publié le :</span>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span className="text-gray-900 dark:text-white">{formatDate(job.date_creation)}</span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {job.competences_requises.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Compétences :</p>
                    <div className="flex flex-wrap gap-1">
                      {job.competences_requises.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.competences_requises.length > 3 && (
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                          +{job.competences_requises.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {job.description}
                </p>

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {job.candidatures_count} candidature{job.candidatures_count !== 1 ? 's' : ''}
                  </span>
                  
                  {user && user.user_type === 'user' ? (
                    <button
                      onClick={() => applyToJob(job.id)}
                      disabled={applying === job.id}
                      className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {applying === job.id ? 'Candidature...' : 'Postuler'}
                    </button>
                  ) : (
                    <button className="bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                      Se connecter pour postuler
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Précédent
              </button>
              
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                Page {currentPage} sur {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;