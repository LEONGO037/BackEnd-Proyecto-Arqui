import { check } from "express-validator";

export const validacionRegistro = [
    check("nombre").trim().notEmpty().withMessage("El nombre es requerido").isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
    check("email").trim().isEmail().withMessage("Formato de correo inválido").custom((value) => {
        if (!value.endsWith("@ucb.edu.bo")) {
            throw new Error("Debe ser un correo institucional (@ucb.edu.bo)");
        }
        return true;
    }),
    check("password").isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres"),
];

export const validacionLogin = [
    check("email").trim().notEmpty().withMessage("El correo es requerido").isEmail().withMessage("Formato de correo inválido"),
    check("password").notEmpty().withMessage("La contraseña es requerida")
];

export const validacionReset = [
    check("email").trim().notEmpty().withMessage("El correo es requerido").isEmail().withMessage("Formato de correo inválido")
];

export const validacionNuevaPassword = [
    check("email").trim().notEmpty().withMessage("El correo es requerido"),
    check("codigo").trim().notEmpty().withMessage("El código es requerido"),
    check("nuevoPassword").isLength({ min: 8 }).withMessage("La nueva contraseña debe tener al menos 8 caracteres")
];

export const validacionCambiarPassword = [
    check("password_actual").notEmpty().withMessage("La contraseña actual es requerida"),
    check("nueva_password").isLength({ min: 12 }).withMessage("La nueva contraseña debe tener al menos 12 caracteres")
];

export const validacionResetPassword = [
    check("token").notEmpty().withMessage("El token es requerido"),
    check("nueva_password").isLength({ min: 12 }).withMessage("La nueva contraseña debe tener al menos 12 caracteres")
];
