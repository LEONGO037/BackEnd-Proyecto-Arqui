-- 004_otp_security.sql
-- OTP code for email verification + must-change-password flag + login audit log

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS codigo_verificacion    VARCHAR(64);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS codigo_verificacion_expira TIMESTAMPTZ;

-- Log de inicios de sesion exitosos para deteccion de actividad sospechosa
CREATE TABLE IF NOT EXISTS login_log (
  id         SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_log_usuario_created
  ON login_log (usuario_id, created_at DESC);

-- Actualizar bloqueo: 24h en vez de 30min para cuentas ya bloqueadas existentes
-- (solo afecta a las que siguen bloqueadas en este momento; el umbral cambia en el codigo)
