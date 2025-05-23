// firebase/users.js
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  addDoc,
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';
import { firestore } from './config';

const usersCollection = collection(firestore, 'users');
const techniciansCollection = collection(firestore, 'users');

// Obtener todos los usuarios
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(usersCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw error;
  }
};

// Obtener todos los técnicos
export const getAllTechnicians = async () => {
  try {
    const q = query(usersCollection, where("role", "==", "technician"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw error;
  }
};

// Obtener usuario por ID
export const getUserById = async (userId) => {
  try {
    const docRef = doc(usersCollection, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

// Actualizar usuario
export const updateUser = async (userId, data) => {
  try {
    const userRef = doc(usersCollection, userId);
    await updateDoc(userRef, data);
    return true;
  } catch (error) {
    throw error;
  }
};