import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Building2, Mail, Lock, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../config/api'; // Changed from axios to api

const Register: React.FC = () => {
  const [userType, setUserType] = useState<'user' | 'company'>('user');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nom: '',
    prenom: '',
    telephone: '',
    // Company specific fields
    description: '',
    secteur: '',
    adresse: '',
    site_web: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.nom) {
      setError('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    if (userType === 'user' && !formData.prenom) {
      setError('Le prénom est obligatoire pour les candidats');
      return false;
    }

    if (userType === 'company' && !formData.description) {
      setError('La description est obligatoire pour les entreprises');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = userType === 'user' 
        ? '/api/auth/register/user' 
        : '/api/auth/register/company';

      const payload = userType === 'user' 
        ? {
            email: formData.email,
            password: formData.password,
            nom: formData.nom,
            prenom: formData.prenom,
            telephone: formData.telephone || undefined
          }
        : {
            email: formData.email,
            password: formData.password,
            nom: formData.nom,
            description: formData.description,
            secteur: formData.secteur || undefined,
            adresse: formData.adresse || undefined,
            telephone: formData.telephone || undefined,
            site_web: formData.site_web || undefined
          };

      const response = await api.post(endpoint, payload); // Changed from axios to api
      
      if (response.status === 201) {
        // Registration successful, redirect to login
        navigate('/login', { 
          state: { 
            message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
            email: formData.email,
            userType 
          }
        });
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Une erreur est survenue lors de l\'inscription');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Créer votre compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Ou{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* User Type Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Type de compte
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType('user')}
                className={`${
                  userType === 'user'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                } relative rounded-lg border p-4 flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors`}
              >
                <User className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Candidat</span>
              </button>
              <button
                type="button"
                onClick={() => setUserType('company')}
                className={`${
                  userType === 'company'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                } relative rounded-lg border p-4 flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors`}
              >
                <Building2 className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Entreprise</span>
              </button>
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="sr-only">
              Adresse email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="relative block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Adresse email *"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="sr-only">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="relative block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Mot de passe (min. 6 caractères) *"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="relative block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Confirmer le mot de passe *"
              />
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 gap-3">
            <input
              name="nom"
              type="text"
              required
              value={formData.nom}
              onChange={handleInputChange}
              className="relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder={userType === 'user' ? 'Nom de famille *' : 'Nom de l\'entreprise *'}
            />
            
            {userType === 'user' && (
              <input
                name="prenom"
                type="text"
                required
                value={formData.prenom}
                onChange={handleInputChange}
                className="relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Prénom *"
              />
            )}
          </div>

          {/* Phone */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              name="telephone"
              type="tel"
              value={formData.telephone}
              onChange={handleInputChange}
              className="relative block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Numéro de téléphone"
            />
          </div>

          {/* Company Specific Fields */}
          {userType === 'company' && (
            <>
              <textarea
                name="description"
                required
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Description de l'entreprise *"
              />
              
              <div className="grid grid-cols-1 gap-3">
                <input
                  name="secteur"
                  type="text"
                  value={formData.secteur}
                  onChange={handleInputChange}
                  className="relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Secteur d'activité"
                />
                
                <input
                  name="adresse"
                  type="text"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  className="relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Adresse"
                />
                
                <input
                  name="site_web"
                  type="url"
                  value={formData.site_web}
                  onChange={handleInputChange}
                  className="relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Site web (https://...)"
                />
              </div>
            </>
          )}

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

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Inscription en cours...' : 'Créer mon compte'}
            </button>
          </div>

          {/* Required Fields Notice */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>Les champs marqués d'un * sont obligatoires</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;