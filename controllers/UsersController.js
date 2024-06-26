import UserModel from '../models/UsersModel.js';
import RoleModel from '../models/RoleModel.js';
import bcrypt from 'bcrypt';
import { passwordGenerated } from '../utils/passwordGenerator.js';
import { sendEmailClient } from '../utils/sendMail.js';

// Configuración de variables de entorno
const { SMTP_EMAIL, PORT_EMAIL, SERVER_EMAIL, PASSWORD_APLICATION } = process.env;

// Controlador para crear un nuevo usuario
export const createUser = async (req, res) => {
  try {
    const { username, email, roleName, lastname, name, phone_number, partner_number } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
    }

    // Obtener el rol
    const role = await RoleModel.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ message: 'El rol proporcionado no existe' });
    }

    // Generar y cifrar la contraseña
    let password = passwordGenerated();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear un nuevo usuario con la contraseña cifrada y el rol
    const newUser = new UserModel({
      username,
      password: hashedPassword,
      email,
      role: role._id, // Asignar el ObjectId del rol
      lastname,
      name,
      phone_number: roleName === 'partner' ? phone_number : undefined,
      partner_number: roleName === 'partner' ? partner_number : undefined
    });

    // Guardar el nuevo usuario en la base de datos
    const savedUser = await newUser.save();

    // Enviar correo electrónico con la contraseña generada
    sendEmailClient(SMTP_EMAIL, PORT_EMAIL, SERVER_EMAIL, PASSWORD_APLICATION, email, password);

    // Enviar la respuesta con el usuario --- ELIMINAR password , esta puesto solo para PRUEBAS
    res.status(201).json({ user: savedUser, password });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Controlador para obtener todos los usuarios
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const role = req.query.role;

    const skip = (page - 1) * pageSize;
    const limit = pageSize;

    const query = {};

    if (role) {
      const roleData = await RoleModel.findOne({ name: role });
      if (roleData) {
        query.role = roleData._id;
      } else {
        return res.status(400).json({ message: 'El rol proporcionado no existe' });
      }
    }

    const users = await UserModel.aggregate([
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'role'
        }
      },
      {
        $unwind: '$role'
      },
      {
        $match: query
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    const totalUsers = await UserModel.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / pageSize);

    res.status(200).json({
      users,
      totalPages,
      currentPage: page,
      pageSize
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controlador para obtener usuarios por rol
export const getUsersByRole = async (req, res) => {
  try {
    const { roleName } = req.params;

    // Obtener el rol por su nombre
    const role = await RoleModel.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ message: 'El rol proporcionado no existe' });
    }

    // Obtener los usuarios con el rol especificado
    const users = await UserModel.find({ role: role._id }).populate('role');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controlador para obtener un usuario por su ID
export const getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).populate('role');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controlador para actualizar un usuario por su ID
export const updateUserById = async (req, res) => {
  try {
    const { roleName, ...updateData } = req.body;

    if (roleName) {
      const role = await RoleModel.findOne({ name: roleName });
      if (!role) {
        return res.status(400).json({ message: 'El rol proporcionado no existe' });
      }
      updateData.role = role._id;
      if (roleName === 'partner') {
        updateData.phone_number = req.body.phone_number;
        updateData.partner_number = req.body.partner_number;
      }
    }

    const updatedUser = await UserModel.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('role');
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controlador para eliminar un usuario por su ID
export const deleteUserById = async (req, res) => {
  try {
    const deletedUser = await UserModel.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controlador para obtener todos los socios con sus estudiantes
export const getPartnersWithStudents = async (req, res) => {
  try {
    const role = await RoleModel.findOne({ name: 'partner' });
    if (!role) {
      return res.status(400).json({ message: 'El rol de socio no existe' });
    }
    const partners = await UserModel.find({ role: role._id }).populate('student_id');
    res.status(200).json(partners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

