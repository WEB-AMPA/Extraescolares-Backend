import mongoose from 'mongoose';

const { Schema } = mongoose;

// Definir el esquema del desayuno
const breakfastSchema = new Schema({
  attendance: { type: String, required: true },
  date: { type: Date, required: true },
  fare: { type: String, required: true },
  id_student: { type: Schema.Types.ObjectId, ref: 'student' }, // Referencia al ID del estudiante en la tabla de estudiantes
  observations: { type: String },
  payment: { type: String, required: true },
  payment_method: { type: String, required: true }
});

// Crear el modelo de desayuno
const BreakfastModel = mongoose.model('breakfast', breakfastSchema);

export default BreakfastModel;
