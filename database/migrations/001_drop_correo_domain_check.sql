-- Permite registro con cualquier dominio de correo válido
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_correo_check;
