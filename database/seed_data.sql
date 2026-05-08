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
  ('general',        'Otros temas',                                'HelpCircle')
ON CONFLICT (nombre) DO NOTHING;
