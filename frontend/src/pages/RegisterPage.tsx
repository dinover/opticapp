import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, User, Lock, Mail, Building, MapPin, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const registerSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  optic_name: z.string().min(1, 'El nombre de la óptica es requerido'),
  optic_address: z.string().min(1, 'La dirección de la óptica es requerida'),
  optic_phone: z.string().min(1, 'El teléfono de la óptica es requerido'),
  optic_email: z.string().email('Email de la óptica inválido'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, loading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
      // Redirect to login page after successful registration
      // The user will see a message that their account needs approval
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600 p-4">
      <div className="w-full max-w-2xl">
        <div className="glass-effect rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Registrar Nueva Óptica</h1>
            <p className="text-white/80">Crea tu cuenta y configura tu óptica</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                  Información del Usuario
                </h3>
                
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                    Nombre de Usuario
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-white/60" />
                    </div>
                    <input
                      {...register('username')}
                      type="text"
                      id="username"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                      placeholder="Ingresa tu nombre de usuario"
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-300">{errors.username.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-white/60" />
                    </div>
                    <input
                      {...register('email')}
                      type="email"
                      id="email"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                      placeholder="Ingresa tu email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/60" />
                    </div>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                      placeholder="Ingresa tu contraseña"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-white/60 hover:text-white transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-white/60 hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* Optic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                  Información de la Óptica
                </h3>
                
                {/* Optic Name */}
                <div>
                  <label htmlFor="optic_name" className="block text-sm font-medium text-white mb-2">
                    Nombre de la Óptica
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-white/60" />
                    </div>
                    <input
                      {...register('optic_name')}
                      type="text"
                      id="optic_name"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                      placeholder="Nombre de tu óptica"
                    />
                  </div>
                  {errors.optic_name && (
                    <p className="mt-1 text-sm text-red-300">{errors.optic_name.message}</p>
                  )}
                </div>

                {/* Optic Address */}
                <div>
                  <label htmlFor="optic_address" className="block text-sm font-medium text-white mb-2">
                    Dirección
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-white/60" />
                    </div>
                    <input
                      {...register('optic_address')}
                      type="text"
                      id="optic_address"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                      placeholder="Dirección de la óptica"
                    />
                  </div>
                  {errors.optic_address && (
                    <p className="mt-1 text-sm text-red-300">{errors.optic_address.message}</p>
                  )}
                </div>

                {/* Optic Phone */}
                <div>
                  <label htmlFor="optic_phone" className="block text-sm font-medium text-white mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-white/60" />
                    </div>
                    <input
                      {...register('optic_phone')}
                      type="tel"
                      id="optic_phone"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                      placeholder="Teléfono de la óptica"
                    />
                  </div>
                  {errors.optic_phone && (
                    <p className="mt-1 text-sm text-red-300">{errors.optic_phone.message}</p>
                  )}
                </div>

                {/* Optic Email */}
                <div>
                  <label htmlFor="optic_email" className="block text-sm font-medium text-white mb-2">
                    Email de la Óptica
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-white/60" />
                    </div>
                    <input
                      {...register('optic_email')}
                      type="email"
                      id="optic_email"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                      placeholder="Email de la óptica"
                    />
                  </div>
                  {errors.optic_email && (
                    <p className="mt-1 text-sm text-red-300">{errors.optic_email.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-primary-600 font-semibold py-3 px-4 rounded-lg hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Registrando...
                </div>
              ) : (
                'Registrar Óptica'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-white/80">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="text-white font-semibold hover:text-white/80 transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            Sistema de control de stock para ópticas
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 