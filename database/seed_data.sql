-- ============================================================
-- Datos semilla iniciales para UNT Bot
-- (El usuario administrador se crea desde el backend al iniciar
--  usando las variables ADMIN_EMAIL y ADMIN_PASSWORD)
-- ============================================================

INSERT INTO categorias_documento (nombre, descripcion, icono) VALUES
  ('silabo',         'Sílabos y currículas',                       'BookOpen'),
  ('matricula',      'Procesos de matrícula',                      'ClipboardList'),
  ('bienestar',      'Bienestar universitario, gimnasio, comedor', 'Heart'),
  ('tramites',       'Trámites académicos y administrativos',      'FileText'),
  ('biblioteca',     'Biblioteca y préstamo de libros',            'Library'),
  ('laboratorios',   'Ubicación y reserva de laboratorios',        'FlaskConical'),
  ('practicas',      'Prácticas preprofesionales',                 'Briefcase'),
  ('idiomas',        'Inglés y otros idiomas',                     'Languages'),
  ('cocurriculares', 'Cursos co-curriculares',                     'Award'),
  ('general',        'Otros temas',                                'HelpCircle'),
  ('comedor_universitario', 'Postulación al comedor universitario',           'Utensils'),
  ('carne_universitario_ura', 'Solicitud de carné universitario (URA)',     'IdCard'),
  ('certificado_estudios_ura', 'Obtención de certificado de estudios (URA)', 'FileCheck'),
  ('carpeta_ura', 'Elaboración de carpeta (URA)',                            'FolderOpen')
ON CONFLICT (nombre) DO NOTHING;
