import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { obtenerUsuarioPorEmailConRol,
  obtenerRolPorNombre,
  obtenerUsuarioPorEmail,
  crearUsuario
 } from "../models/usuario.modelo.js";

export const iniciarSesion = async (email, password) => {

  if (!email || !password) {
    throw new Error("Correo y contraseña son obligatorios");
  }

  const usuario = await obtenerUsuarioPorEmailConRol(email);

  if (!usuario) {
    throw new Error("Credenciales incorrectas");
  }

  const passwordValido = await bcrypt.compare(password, usuario.password_hash);

  if (!passwordValido) {
    throw new Error("Credenciales incorrectas");
  }

  const token = jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol_nombre
    },
    process.env.JWT_SECRET,
    { expiresIn: "4h" }
  );

  return {
    mensaje: "Inicio de sesión exitoso",
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol_nombre
    }
  };
};


export const registrarEstudiante = async (datos) => {

  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    ci_nit,
    telefono,
    direccion,
    email,
    password
  } = datos;

  if (!nombre || !apellido_paterno || !ci_nit || !email || !password) {
    throw new Error("Los campos obligatorios no fueron enviados");
  }

  const usuarioExistente = await obtenerUsuarioPorEmail(email);
  if (usuarioExistente) {
    throw new Error("El correo electrónico ya está registrado");
  }

  const rol = await obtenerRolPorNombre("ESTUDIANTE");
  if (!rol) {
    throw new Error("El rol ESTUDIANTE no existe en la base de datos");
  }

  const passwordEncriptado = await bcrypt.hash(password, 10);

  const nuevoUsuario = await crearUsuario({
    nombre,
    apellido_paterno,
    apellido_materno,
    ci_nit,
    telefono,
    direccion,
    email,
    password_hash: passwordEncriptado,
    rol_id: rol.id
  });

  return nuevoUsuario;
};
