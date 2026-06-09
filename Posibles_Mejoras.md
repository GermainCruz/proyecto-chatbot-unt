# Posibles Mejoras del Proyecto QueryBot UNT

## 1. Enfoque de este documento

Este documento se concentra en mejoras funcionales y de utilidad del chatbot. No se enfoca en lo estetico. La pregunta central es:

- Como hacer que el chatbot responda mejor.
- Como reducir respuestas negativas incorrectas.
- Como mejorar la organizacion y consistencia de las respuestas.
- Si conviene incorporar `Context Caching`.

Las recomendaciones se basan en el comportamiento actual del proyecto, en la arquitectura implementada y en casos observados donde:

- una misma intencion produce resultados distintos segun como se formula la pregunta,
- el bot a veces dice que no tiene informacion aun cuando existe un PDF relacionado,
- y la salida del chat todavia puede desordenarse si el LLM no sigue exactamente el formato esperado.

---

## 2. Diagnostico funcional actual

### 2.1 Fortalezas ya logradas

- El proyecto ya usa una arquitectura RAG funcional.
- El retrieval ya no es solo vectorial; incluye señal lexical.
- La consulta puede filtrarse por categoria/tema.
- Existen FAQs por tema, lo cual reduce ambiguedad.
- Se controla cuando un tema no tiene PDFs indexados.
- El sistema muestra fuentes y registra feedback.

### 2.2 Problemas funcionales todavia visibles

- El chatbot puede fallar cuando la pregunta usa sinonimos o parafraseos distintos al texto del PDF.
- El chatbot puede responder "no tengo informacion" incluso cuando el documento correcto existe, pero no fue recuperado como candidato util.
- La calidad de la respuesta depende demasiado de la calidad del texto extraido del PDF.
- La organizacion de salida aun depende del prompt y del postproceso textual.
- El sistema no distingue con suficiente fuerza cuando el usuario pregunta sobre un tema distinto al tema visualmente seleccionado.
- No existe una capa de evaluacion automatica para saber si la respuesta estuvo bien sustentada.

---

## 3. Prioridades reales de mejora

Si el objetivo es mejorar la utilidad del chatbot, el orden recomendado de trabajo es:

1. Mejorar `retrieval`.
2. Mejorar validacion documental.
3. Estandarizar la generacion estructurada.
4. Agregar verificacion de respuesta.
5. Incorporar observabilidad y evaluacion.
6. Recién despues considerar `Context Caching`.

Ese orden es importante porque hoy el principal cuello de botella no es el estilo visual ni la velocidad de render, sino la calidad del contenido que llega al modelo.

---

## 4. Mejoras recomendadas en retrieval

### 4.1 Incorporar reranking

Hoy el sistema recupera candidatos con busqueda hibrida y luego selecciona fragmentos. Eso ya ayuda, pero todavia puede quedarse corto cuando:

- la pregunta es larga,
- hay varios documentos similares,
- o el fragmento top no es el mejor para responder de forma especifica.

#### Recomendacion

Agregar una etapa de `reranking` despues de la recuperacion inicial. El flujo seria:

1. Traer `top_k` candidatos con busqueda vectorial + lexical.
2. Reordenarlos con un reranker.
3. Enviar al LLM solo los mejores fragmentos finales.

#### Beneficio

- Menos respuestas de "no tengo informacion" cuando si existe el dato.
- Menos envio de contexto irrelevante al modelo.
- Respuestas mas precisas y mas especificas.

### 4.2 Mejorar expansion de consultas

El proyecto ya tiene un intento de expansion, pero conviene fortalecerlo con reglas mas orientadas al dominio UNT.

#### Recomendacion

Crear un modulo de expansion por sinonimos institucionales:

- `carne` <-> `carné universitario`
- `comedor` <-> `comedor universitario`
- `gym` <-> `gimnasio`
- `matricularme` <-> `matricula`
- `suv` <-> `sistema universitario virtual`
- `ura` <-> `unidad de registro academico`

#### Beneficio

- Mayor tolerancia a lenguaje natural.
- Menor dependencia de coincidencias exactas con el PDF.

### 4.3 Reforzar retrieval por tipo de pregunta

No todas las preguntas requieren el mismo tipo de recuperacion. Por ejemplo:

- `¿Cuánto cuesta...?` suele apuntar a montos.
- `¿Dónde queda...?` suele apuntar a ubicaciones.
- `¿Cuáles son los requisitos...?` suele apuntar a listas.

#### Recomendacion

Detectar intencion de consulta y ponderar retrieval distinto segun el caso:

- costo,
- ubicacion,
- requisitos,
- cronograma,
- contacto,
- procedimiento,
- observacion/rechazo.

#### Beneficio

- Mejor contextualizacion.
- Respuestas mas alineadas a la necesidad exacta del usuario.

### 4.4 Recuperacion por documento y por fragmento

Hoy el sistema trabaja bien a nivel de fragmento, pero a veces conviene evaluar primero el documento mas relevante y luego extraer sus mejores fragmentos.

#### Recomendacion

Aplicar doble etapa:

1. score a nivel documento,
2. score a nivel fragmento dentro del documento seleccionado.

#### Beneficio

- Menos dispersión.
- Menos mezcla de documentos distintos para una misma respuesta.

---

## 5. Mejoras en la base documental

### 5.1 OCR real para PDFs escaneados

Actualmente el proyecto detecta documentos con texto insuficiente, pero no los recupera automaticamente con OCR.

#### Recomendacion

Integrar OCR real con una opcion como:

- `Tesseract OCR`
- `Google Document AI`
- `AWS Textract`

#### Beneficio

- Mayor cobertura documental.
- Menos documentos marcados como inutiles.

### 5.2 Validacion previa a indexacion

No basta con extraer texto. Tambien importa si el texto:

- esta incompleto,
- viene con encabezados repetidos,
- esta roto por salto de linea,
- mezcla tablas o firmas.

#### Recomendacion

Agregar validaciones de calidad antes de indexar:

- densidad de caracteres,
- porcentaje de lineas vacias,
- repeticion excesiva,
- longitud promedio por parrafo,
- porcentaje de tokens basura.

#### Beneficio

- Evita que el LLM reciba contexto contaminado.
- Disminuye respuestas poco claras o erroneas.

### 5.3 Metadatos mas fuertes

El campo `palabras_clave` ya existe, pero aun puede aprovecharse mejor.

#### Recomendacion

Normalizar metadatos obligatorios por documento:

- tema principal,
- subtema,
- oficina responsable,
- vigencia,
- periodo academico,
- tipo de tramite,
- palabras clave controladas.

#### Beneficio

- Mejor filtrado.
- Mejor recuperacion contextual.
- Mejor auditoria documental.

---

## 6. Mejoras recomendadas en generacion de respuesta

### 6.1 Pasar de formato libre a salida estructurada estricta

Ahora el sistema usa un prompt fuerte y luego limpia texto. Eso es mejor que antes, pero sigue siendo fragil.

#### Recomendacion principal

Pedir al modelo una salida estructurada en `JSON` o mediante un esquema fijo. Ejemplo conceptual:

```json
{
  "respuesta": "texto corto",
  "detalles": ["punto 1", "punto 2"],
  "fuentes": ["documento A"],
  "nivel_confianza": "alto"
}
```

Luego el backend renderiza esa estructura y no depende de encabezados textuales como `Respuesta:` o `Detalles:`.

#### Beneficio

- Elimina muchos errores de formato.
- Evita asteriscos vacios.
- Facilita plantillas por tipo de consulta.
- Permite medir calidad de forma mas objetiva.

### 6.2 Plantillas por intencion

La organizacion ideal no es la misma para todas las preguntas.

#### Recomendacion

Usar plantillas segun la intencion detectada:

- `requisitos`
  - resumen
  - lista de requisitos
  - observaciones
  - fuente

- `procedimiento`
  - resumen
  - pasos numerados
  - costo
  - plazo
  - fuente

- `ubicacion/horario`
  - respuesta directa
  - detalle puntual
  - fuente

- `estado de tramite / observaciones`
  - significado
  - que hacer
  - a donde acudir
  - fuente

#### Beneficio

- Respuestas mas faciles de leer.
- Menor sensacion de "bloque de texto".
- Mayor utilidad practica.

### 6.3 Resumen primero, detalle despues

Las imagenes muestran que el usuario entiende mejor cuando la respuesta inicia con una frase clara y luego baja al detalle.

#### Recomendacion

Mantener siempre esta estructura logica:

1. Respuesta directa.
2. Desarrollo util.
3. Fuente.

Ademas, limitar la `Respuesta` a 1 o 2 oraciones. Todo lo demas debe ir en `Detalles`.

#### Beneficio

- Menor carga cognitiva.
- Mejor lectura en pantalla.

### 6.4 Respuestas negativas mas utiles

Actualmente el bot a veces responde que no cuenta con informacion especifica. Eso es correcto como politica anti-alucinacion, pero puede ser mas util.

#### Recomendacion

Cuando no haya suficiente evidencia, responder:

- que dato exacto falta,
- si hay informacion parcial,
- y como reformular la pregunta.

Ejemplo de comportamiento deseable:

- "No encontre el costo exacto del tramite en los documentos cargados."
- "Si deseas, puedes preguntarme por requisitos, pasos o portal de registro de este mismo tramite."

#### Beneficio

- El usuario siente orientacion, no solo rechazo.

---

## 7. Mejoras de utilidad en el chatbot

### 7.1 Deteccion de desalineacion entre tema seleccionado y pregunta

En una de las imagenes se observa un caso muy importante: el usuario tenia seleccionado un tema, pero pregunto sobre otro.

Ejemplo:

- tema seleccionado: `Solicitud de carné`
- pregunta: `¿Cuáles son los requisitos para el comedor?`

Eso puede generar falsos "no tengo informacion" aunque el sistema si tenga informacion en otra categoria.

#### Recomendacion

Agregar un detector de desalineacion entre:

- `tema activo`
- `intencion de la pregunta`
- `palabras clave dominantes`

Si hay conflicto:

- advertir al usuario,
- sugerir cambiar de tema,
- o permitir una busqueda cruzada confirmada.

#### Beneficio

- Reduce errores por contexto equivocado.
- Mejora la percepcion de inteligencia del sistema.

### 7.2 FAQs administrables desde backend

Hoy las preguntas frecuentes estan hardcodeadas en frontend.

#### Recomendacion

Mover FAQs a base de datos o al menos a un endpoint configurable por categoria.

#### Beneficio

- Permite mantenimiento sin editar codigo.
- Facilita crecimiento tematico.
- Mejora gobernanza del contenido.

### 7.3 Sugerencias de seguimiento

Cuando una respuesta sea util, el bot deberia proponer preguntas relacionadas.

#### Recomendacion

Despues de responder, sugerir 2 o 3 consultas siguientes relevantes, por ejemplo:

- "Tambien puedes preguntarme por el costo del tramite."
- "Tambien puedo indicarte los documentos requeridos."

#### Beneficio

- Aumenta utilidad.
- Reduce friccion del usuario.
- Hace la experiencia mas guiada.

### 7.4 Indicador de confianza o evidencia

No siempre el usuario sabe si la respuesta esta muy sustentada o apenas basada en un fragmento parcial.

#### Recomendacion

Agregar un indicador interno o visible:

- `alta evidencia`
- `evidencia parcial`
- `informacion incompleta`

#### Beneficio

- Mejora transparencia.
- Reduce sobreconfianza en respuestas incompletas.

---

## 8. Es recomendable colocar Context Caching

### Respuesta corta

`Si, pero no como prioridad inmediata.`

### Analisis

`Context Caching` puede ser util cuando se reutiliza mucho el mismo bloque de contexto entre consultas, por ejemplo:

- mismo tema,
- misma categoria,
- mismo documento grande,
- mismas instrucciones persistentes.

En este proyecto, hoy el cuello de botella principal no parece ser el costo del prompt o el tamaño del contexto, sino:

- recuperar el fragmento correcto,
- mantener coherencia por tema,
- y estructurar bien la respuesta.

Por eso, `Context Caching` no deberia ser la primera mejora a implementar.

### Cuando si conviene

Es recomendable si luego deseas:

- escalar a mas usuarios,
- bajar costo por tokens,
- reducir latencia,
- reutilizar contexto por categoria muy consultada.

Ejemplos donde si puede aportar:

- cache del contexto base de `Matrícula`,
- cache del contexto base de `Comedor`,
- cache de resúmenes estructurados por documento,
- cache de prompts de sistema e instrucciones fijas.

### Como aplicarlo de forma inteligente

No conviene cachear "todo el PDF crudo". Conviene cachear:

1. resumen estructurado por documento,
2. resumen por categoria,
3. bloque estable de instrucciones,
4. resultados de FAQs frecuentes.

### Recomendacion concreta

Implementarlo en una segunda fase, despues de:

1. mejorar retrieval,
2. estructurar salida en JSON,
3. agregar evaluacion de respuestas.

#### Veredicto

- `Si es recomendable`, pero `no es la mejora de mayor impacto inmediato`.
- El mayor retorno hoy esta en precision y consistencia, no en cache.

---

## 9. Como mejorar la organizacion de la respuesta del chatbot

Esta es una de las mejoras mas importantes del proyecto.

### 9.1 Pasar a respuesta estructurada por esquema

Ya indicado antes: usar `JSON` o un esquema tipado.

### 9.2 Separar claramente tipos de contenido

La respuesta deberia distinguir:

- respuesta final,
- pasos,
- requisitos,
- montos,
- excepciones,
- fuente.

No todo debe ir al mismo nivel.

### 9.3 Numerar procedimientos

Cuando la pregunta sea "como hago", el usuario entiende mejor una lista numerada que una lista plana.

Ejemplo recomendado:

1. Ingresa al portal.
2. Completa el formulario.
3. Adjunta documentos.
4. Realiza el pago.
5. Verifica el estado del tramite.

### 9.4 Mostrar informacion puntual como bloques

Si la respuesta contiene datos concretos, conviene aislarlos:

- costo,
- horario,
- ubicacion,
- enlace,
- plazo.

Aunque eso luego pueda reflejarse visualmente en UI, la mejora real es logica y de organizacion semantica.

### 9.5 Evitar repeticion textual

El postprocesado debe quitar:

- encabezados repetidos,
- viñetas vacias,
- signos aislados,
- bloques redundantes,
- frases de relleno.

### 9.6 Definir una politica de longitud

Conviene decidir reglas fijas:

- `Respuesta`: maximo 2 oraciones.
- `Detalles`: maximo 5 puntos.
- `Fuente`: maximo 3 documentos.

#### Beneficio

- Respuestas mas escaneables.
- Menor fatiga de lectura.

---

## 10. Mejoras de control de calidad

### 10.1 Evaluacion offline con dataset de preguntas

Crear un conjunto de preguntas por categoria y medir:

- recuperacion correcta,
- respuesta correcta,
- completitud,
- grounding,
- utilidad percibida.

### 10.2 Registro de fallos por tipo

No basta con guardar feedback util/no util. Conviene clasificar por causa:

- no encontro documento,
- encontro documento equivocado,
- respuesta incompleta,
- respuesta mal estructurada,
- respuesta fuera de tema.

### 10.3 Panel de vacios de conocimiento mas detallado

Hoy ya existe una metrica de vacios, pero conviene enriquecerla:

- por tema,
- por documento,
- por pregunta recurrente,
- por categoria sin suficiente cobertura.

---

## 11. Mejoras de gobernanza del conocimiento

### 11.1 Versionado documental mas explicito

Cuando un oficio o instructivo cambia, deberia quedar claro:

- documento vigente,
- documento anterior,
- fecha de vigencia,
- periodo academico.

### 11.2 Curaduria editorial

Recomendable definir una rutina minima:

- revisar documento antes de cargarlo,
- completar palabras clave,
- verificar calidad del texto,
- marcar vigencia,
- asignar categoria correcta.

### 11.3 Sintesis administrable por documento

Ademas del PDF original, podria existir un resumen administrativo curado que el RAG use como apoyo.

#### Beneficio

- Mejor respuesta para preguntas frecuentes.
- Menor dependencia del texto crudo del PDF.

---

## 12. Hoja de ruta sugerida

### Fase 1 - Alto impacto inmediato

- Salida estructurada en JSON.
- Deteccion de desalineacion tema/pregunta.
- Mejor expansion por sinonimos.
- Limpieza mas fuerte del postprocesado.
- FAQs gestionables por backend.

### Fase 2 - Precision y control

- Reranking.
- Evaluacion automatica con dataset.
- Dashboard de fallos por categoria.
- Metadatos mas ricos por documento.

### Fase 3 - Escalabilidad

- OCR integrado.
- Cache semantico.
- Context Caching por categoria.
- Resumenes curados reutilizables.

---

## 13. Recomendacion final

Si tu meta es que el chatbot sea realmente util para estudiantes, el foco no debe ponerse primero en la apariencia, sino en estas cuatro capacidades:

1. Encontrar el fragmento correcto.
2. Detectar cuando el usuario pregunto fuera del tema seleccionado.
3. Responder en un formato consistentemente util.
4. Medir cuando falla y por que falla.

### Respuesta puntual a tus preguntas

- `¿Como puede mejorar?`
  - Mejorando retrieval, plantillas de respuesta, validacion documental y evaluacion.

- `¿Es recomendable colocarle Context Caching?`
  - Si, pero despues de fortalecer retrieval y salida estructurada.

- `¿Como puedo mejorar la organizacion de la respuesta del chatbot?`
  - Con salida estructurada por esquema, plantillas por intencion, pasos numerados, datos puntuales aislados y limpieza automatica fuerte.

### Conclusion operativa

La siguiente gran mejora del proyecto no deberia ser "mas UI", sino "mejor inteligencia documental y mejor disciplina de salida". Ahi es donde el chatbot puede pasar de ser funcional a realmente confiable.

