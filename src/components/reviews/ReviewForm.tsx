'use client';

import { useState } from 'react';
import { collection, addDoc, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/firebase/config';

interface ReviewFormProps {
  serviceId: string;
  technicianId: string;
  clientId: string;
  clientName: string;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({
  serviceId,
  technicianId,
  clientId,
  clientName,
  onReviewSubmitted
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Por favor, selecciona una calificación');
      return;
    }
    
    if (!comment.trim()) {
      setError('Por favor, escribe un comentario');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // 1. Crear la reseña en Firestore
      const reviewData = {
        serviceId,
        technicianId,
        clientId,
        clientName,
        rating,
        comment,
        createdAt: new Date()
      };
      
      // Añadir la reseña a la colección de reseñas
      const reviewRef = await addDoc(collection(firestore, 'reviews'), reviewData);
      
      // 2. Actualizar el servicio para indicar que tiene reseña
      await updateDoc(doc(firestore, 'services', serviceId), {
        hasReview: true,
        reviewId: reviewRef.id,
        updatedAt: new Date()
      });
      
      // 3. Actualizar la calificación del técnico
      // Primero obtenemos todas las reseñas del técnico
      const reviewsQuery = query(collection(firestore, 'reviews'), where('technicianId', '==', technicianId));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      // Calcular la nueva calificación promedio
      let totalRating = 0;
      reviewsSnapshot.forEach(doc => {
        totalRating += doc.data().rating;
      });
      
      const averageRating = totalRating / reviewsSnapshot.size;
      
      // Actualizar el perfil del técnico
      await updateDoc(doc(firestore, 'users', technicianId), {
        rating: averageRating,
        reviewCount: reviewsSnapshot.size,
        updatedAt: new Date()
      });
      
      // Notificar que se ha enviado la reseña
      onReviewSubmitted();
      
    } catch (err) {
      console.error('Error al enviar la reseña:', err);
      setError('Ocurrió un error al enviar tu reseña. Por favor, inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">Calificar el servicio</h3>
        <p className="mt-1 text-sm text-gray-500">
          Tu opinión nos ayuda a mejorar nuestros servicios
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )} 
        {/* Estrellas de calificación */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <svg 
                  className={`h-8 w-8 ${
                    (hoverRating ? hoverRating >= star : rating >= star) 
                      ? 'text-yellow-400' 
                      : 'text-gray-300'
                  } transition-colors duration-150`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {rating > 0 ? `${rating} de 5 estrellas` : 'Seleccione una calificación'}
            </span>
          </div>
        </div>
        
        {/* Campo para el comentario */}
        <div className="mb-6">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Comentario (opcional)
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Comparte tu experiencia con este técnico..."
          ></textarea>
        </div>
        
        {/* Botón de envío */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>            
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </>
            ) : 'Enviar calificación'}
          </button>
        </div>
      </form>
    </div>
  );
}
