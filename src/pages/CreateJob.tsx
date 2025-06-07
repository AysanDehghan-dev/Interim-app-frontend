import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, Euro, Calendar, Users, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../config/api'; // Changed from axios to api
import { useAuth } from '../contexts/AuthContext';

const CreateJob: React.FC = () => {
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    salaire: '',
    type_contrat: 'CDI',
    localisation: '',
    competences_requises: '',
    experience_requise: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Vérifier que l'utilisateur est une entreprise
  if (user?.user_type !== 'company') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Accès réservé aux entreprises</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Seules les entreprises peuvent publier des offres d'emploi.
          </p>
          <Link
            to="/login"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Se connecter en tant qu'entreprise
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.titre.trim()) {
      setError('Le titre du poste est obligatoire');
      return false;
    }

    if (!formData.description.trim()) {
      setError('La description du poste est obligatoire');
      return false;
    }

    if (formData.description.trim().length < 50) {
      setError('La description doit contenir au moins 50 caractères');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Préparer les données
      const jobData = {
        titre: formData.titre.trim(),
        description: formData.description.trim(),
        salaire: formData.salaire.trim() || undefined,
        type_contrat: formData.type_contrat,
        localisation: formData.localisation.trim() || undefined,
        competences_requises: formData.competences_requises
          ? formData.competences_requises.split(',').map(skill => skill.trim()).filter(Boolean)
          : [],
        experience_requise: formData.experience_requise.trim() || undefined
      };

      console.log('Submitting job data:', jobData);

      const response = await api.post('/api/jobs', jobData); // Changed from axios to api
      
      if (response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/company/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error creating job:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'offre');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Offre publiée avec succès ! 🎉</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Votre offre d'emploi est maintenant visible par les candidats.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Redirection vers votre tableau de bord...</p>
            <Link
              to="/company/dashboard"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
            >
              Aller au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/company/dashboard"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Publier une nouvelle offre d'emploi
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            Créez une offre attractive pour attirer les meilleurs candidats
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Titre du poste */}
            <div>
              <label htmlFor="titre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titre du poste *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="titre"
                  name="titre"
                  required
                  value={formData.titre}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Développeur Full Stack React/Node.js"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Soyez précis et attractif (ex: Développeur Backend Python, Designer UX/UI Senior)
              </p>
            </div>

            {/* Type de contrat */}
            <div>
              <label htmlFor="type_contrat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de contrat *
              </label>
              <select
                id="type_contrat"
                name="type_contrat"
                value={formData.type_contrat}
                onChange={handleInputChange}
                className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="CDI">CDI - Contrat à Durée Indéterminée</option>
                <option value="CDD">CDD - Contrat à Durée Déterminée</option>
                <option value="Interim">Intérim</option>
                <option value="Stage">Stage</option>
                <option value="Freelance">Freelance</option>
                <option value="Apprentissage">Apprentissage</option>
              </select>
            </div>

            {/* Localisation et Salaire */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="localisation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Localisation
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="localisation"
                    name="localisation"
                    value={formData.localisation}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ex: Paris, Lyon, Télétravail"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="salaire" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Salaire
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Euro className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="salaire"
                    name="salaire"
                    value={formData.salaire}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ex: 35000-45000 EUR, À négocier"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Optionnel - Vous pouvez indiquer une fourchette ou "À négocier"
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description du poste *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={8}
                value={formData.description}
                onChange={handleInputChange}
                className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Décrivez le poste, les missions principales, l'environnement de travail, les avantages..."
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Minimum 50 caractères</span>
                <span>{formData.description.length} caractères</span>
              </div>
            </div>

            {/* Compétences requises */}
            <div>
              <label htmlFor="competences_requises" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Compétences requises
              </label>
              <input
                type="text"
                id="competences_requises"
                name="competences_requises"
                value={formData.competences_requises}
                onChange={handleInputChange}
                className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: JavaScript, React, Node.js, MongoDB, Git"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Séparez les compétences par des virgules
              </p>
            </div>

            {/* Expérience requise */}
            <div>
              <label htmlFor="experience_requise" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expérience requise
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="experience_requise"
                  name="experience_requise"
                  value={formData.experience_requise}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: 2-4 ans d'expérience, Débutant accepté, 5+ ans"
                />
              </div>
            </div>

            {/* Preview Box */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Aperçu de votre offre
              </h3>
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formData.titre || 'Titre du poste'}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {user?.nom} • {formData.type_contrat} • {formData.localisation || 'Localisation'}
                </div>
                {formData.salaire && (
                  <div className="text-primary-600 dark:text-primary-400 font-medium">
                    💰 {formData.salaire}
                  </div>
                )}
                <div className="text-gray-700 dark:text-gray-300 line-clamp-3">
                  {formData.description || 'Description du poste...'}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/company/dashboard"
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publication...
                  </>
                ) : (
                  <>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Publier l'offre
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            💡 Conseils pour une offre attractive
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• <strong>Titre clair :</strong> Mentionnez le poste exact et les technologies principales</li>
            <li>• <strong>Description détaillée :</strong> Décrivez les missions, l'équipe, et l'environnement de travail</li>
            <li>• <strong>Compétences précises :</strong> Listez les technologies et compétences vraiment nécessaires</li>
            <li>• <strong>Transparence :</strong> Indiquez le salaire ou la fourchette si possible</li>
            <li>• <strong>Avantages :</strong> Mentionnez télétravail, formations, avantages sociaux</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;