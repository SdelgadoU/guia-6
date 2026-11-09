"use strict";
const resources = [{"id": "html", "title": "Tu primera página web", "category": "HTML", "level": "Inicial", "minutes": 8, "color": "#cde4cc", "symbol": "&lt;/&gt;", "desc": "Del contenido a una estructura con sentido. Empieza por las bases de HTML.", "sections": [["Una estructura con significado", "HTML describe la estructura del contenido. Un encabezado presenta la página, la navegación reúne enlaces, main contiene la información principal y footer cierra el documento. Elegir etiquetas por su significado ayuda a mantener un orden comprensible."], ["Un ejemplo para empezar", "Crea un archivo index.html con la declaración doctype, un elemento html con lang=\"es\", head con la codificación UTF-8 y body. Dentro de body escribe un h1 y un párrafo. Abre el archivo en un navegador y observa el resultado."], ["Ponlo en práctica", "Escribe una presentación personal con un solo título principal, dos secciones con h2 y un enlace descriptivo. Comprueba que el orden siga teniendo sentido sin estilos."]]}, {"id": "css", "title": "Diseña con CSS", "category": "CSS", "level": "Inicial", "minutes": 10, "color": "#f4d3b4", "symbol": "{ }", "desc": "Color, espacios y tipografía para convertir una página en una experiencia clara.", "sections": [["Separar contenido y presentación", "Una hoja de estilos permite controlar la apariencia de varios elementos sin repetir reglas en cada etiqueta. Enlaza css/styles.css desde head y usa clases que describan la función de los componentes."], ["El modelo de caja", "El contenido está rodeado de padding, borde y margen. Con box-sizing: border-box, el ancho declarado incluye el relleno y el borde. Esta decisión hace más previsible el cálculo de las dimensiones."], ["Ponlo en práctica", "Diseña una tarjeta con fondo claro, texto oscuro, un título y un botón. Usa rem para las medidas del texto y verifica que el contenido no se recorte al aumentar el tamaño de fuente."]]}, {"id": "responsive", "title": "Una web para cada pantalla", "category": "Diseño", "level": "Inicial", "minutes": 9, "color": "#d9daf3", "symbol": "↔", "desc": "Aprende a pensar en móvil, tableta y computador desde el primer boceto.", "sections": [["Comenzar por lo esencial", "Diseña primero una columna legible para el teléfono. Después amplía la distribución cuando exista suficiente espacio. El contenido importante debe estar disponible en todos los tamaños."], ["Cambios según el espacio", "Las consultas de medios permiten aplicar estilos según el ancho de la ventana. Usa imágenes con max-width: 100% y height: auto. Evita fijar anchos que superen la pantalla."], ["Ponlo en práctica", "Prueba una tarjeta a 390, 768 y 1440 píxeles. Revisa el menú, el tamaño de los botones y la ausencia de desplazamiento horizontal. No confundas una captura emulada con una prueba en un dispositivo físico."]]}, {"id": "grid", "title": "Ordena ideas con Grid", "category": "CSS", "level": "Intermedio", "minutes": 12, "color": "#e8dfa9", "symbol": "▦", "desc": "Construye catálogos que cambian de columnas sin perder su equilibrio.", "sections": [["Filas y columnas", "CSS Grid organiza el espacio en dos dimensiones. Un contenedor con display: grid distribuye a sus hijos en las columnas y filas que se declaren. gap agrega separación sin márgenes individuales."], ["Una cuadrícula flexible", "Combina repeat, minmax y fr para crear columnas que repartan el ancho disponible. En este proyecto el catálogo pasa de una a dos y a tres columnas mediante consultas de medios."], ["Ponlo en práctica", "Crea seis tarjetas de alturas distintas. Usa tres columnas en escritorio y una en móvil. Comprueba que los botones sigan visibles y que los textos largos no desborden sus tarjetas."]]}, {"id": "access", "title": "Diseñar para más personas", "category": "Diseño", "level": "Inicial", "minutes": 7, "color": "#c9e0e4", "symbol": "Aa", "desc": "Etiquetas, foco y navegación: pequeños detalles que abren más puertas.", "sections": [["Navegación comprensible", "Usa enlaces para navegar y botones para ejecutar acciones. Escribe textos que expliquen el destino o el resultado esperado. Asocia cada campo de formulario a una etiqueta visible."], ["Teclado y foco", "Recorre la interfaz con Tab y activa sus controles con el teclado. El foco debe ser visible. Si abres un diálogo, permite cerrarlo con Escape y devuelve el foco al control que lo abrió."], ["Ponlo en práctica", "Intenta buscar una guía, guardarla y abrir la lista de lectura sin usar el ratón. Anota cualquier control inaccesible. Estas comprobaciones son básicas y no equivalen a una auditoría completa de accesibilidad."]]}, {"id": "js", "title": "Interacciones con propósito", "category": "JavaScript", "level": "Intermedio", "minutes": 11, "color": "#f0cad3", "symbol": "( )", "desc": "Conecta búsquedas y botones con acciones útiles y respuestas visibles.", "sections": [["Escuchar una acción", "JavaScript puede responder a eventos como input, change y click. Separa los datos de los recursos de las funciones que actualizan el catálogo para facilitar su mantenimiento."], ["Guardar preferencias", "localStorage permite conservar una lista en el navegador entre sesiones. Puede estar bloqueado o contener datos inesperados, por lo que debe validarse su lectura y manejarse cualquier error. No es una base de datos compartida."], ["Ponlo en práctica", "Implementa un botón Guardar que cambie a Quitar y actualice un contador. Recarga la página para comprobar la persistencia. Incluye un mensaje si el almacenamiento no está disponible."]]}];
const byId = id => document.getElementById(id);
const key = 'biblioteca-abierta-lista-v1';
let saved = new Set();
let persistent = true;
try {
  const raw = JSON.parse(localStorage.getItem(key) || '[]');
  if (Array.isArray(raw)) saved = new Set(raw.filter(id => resources.some(r => r.id === id)));
} catch { persistent = false; }
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
let toastTimer;
function notify(message) { byId('toast').textContent = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => byId('toast').textContent = '', 3200); }
function saveState() {
  try { localStorage.setItem(key, JSON.stringify([...saved])); }
  catch { persistent = false; }
  byId('storage-note').textContent = persistent ? '' : 'El almacenamiento no está disponible. Tu lista se conservará solo durante esta visita.';
}
function renderCatalog() {
  const query = normalize(byId('search').value);
  const visible = resources.filter(r => normalize(r.title + ' ' + r.category + ' ' + r.desc).includes(query) && (!byId('category').value || r.category === byId('category').value) && (!byId('level').value || r.level === byId('level').value));
  byId('results').textContent = `${visible.length} ${visible.length === 1 ? 'recurso disponible' : 'recursos disponibles'} de ${resources.length}`;
  byId('empty').hidden = visible.length !== 0;
  byId('resource-grid').innerHTML = visible.map(r => `<article class="card"><img src="img/${r.id}.svg" alt="" width="640" height="360" loading="lazy"><div class="card-body"><div class="card-meta"><span class="tag">${r.category} / ${r.level}</span><span>${r.minutes} min aprox.</span></div><h3>${r.title}</h3><p>${r.desc}</p><div class="card-actions"><button type="button" class="button primary" data-read="${r.id}" aria-label="Leer guía: ${r.title}">Leer guía ↗</button><button type="button" class="button save" data-save="${r.id}" aria-pressed="${saved.has(r.id)}" aria-label="${saved.has(r.id) ? 'Quitar de' : 'Guardar en'} mi lista: ${r.title}">${saved.has(r.id) ? 'Guardado ✓' : 'Guardar +'}</button></div></div></article>`).join('');
}
function renderList() {
  byId('saved-count').textContent = saved.size;
  byId('clear-list').disabled = saved.size === 0;
  byId('list-empty').hidden = saved.size !== 0;
  byId('reading-list').innerHTML = resources.filter(r => saved.has(r.id)).map(r => `<article class="saved-row"><div><h3>${r.title}</h3><p>${r.category} · ${r.minutes} min aprox.</p></div><div class="saved-actions"><button type="button" class="button" data-read="${r.id}" aria-label="Leer guía guardada: ${r.title}">Leer guía ↗</button><button type="button" class="button subtle" data-remove="${r.id}" aria-label="Quitar de mi lista: ${r.title}">Quitar</button></div></article>`).join('');
}
function refreshSaveButtons() {
  document.querySelectorAll('[data-save]').forEach(button => {
    const r = resources.find(r => r.id === button.dataset.save);
    button.textContent = saved.has(r.id) ? 'Guardado ✓' : 'Guardar +';
    button.setAttribute('aria-pressed', saved.has(r.id));
    button.setAttribute('aria-label', `${saved.has(r.id) ? 'Quitar de' : 'Guardar en'} mi lista: ${r.title}`);
  });
}
let opener;
function openReader(id, trigger) {
  const r = resources.find(r => r.id === id);
  if (!r) return;
  opener = trigger;
  byId('reader-title').textContent = r.title;
  byId('reader-meta').textContent = `${r.category} · Nivel ${r.level.toLowerCase()} · ${r.minutes} minutos aproximados`;
  byId('reader-content').replaceChildren(...r.sections.map(([title, text]) => {
    const section = document.createElement('section');
    const heading = document.createElement('h3'); heading.textContent = title;
    const paragraph = document.createElement('p'); paragraph.textContent = text;
    section.append(heading, paragraph); return section;
  }));
  byId('reader').showModal(); byId('reader').scrollTop = 0; document.body.classList.add('modal-open');
}
document.addEventListener('click', event => {
  const read = event.target.closest('[data-read]');
  if (read) openReader(read.dataset.read, read);
  const toggle = event.target.closest('[data-save], [data-remove]');
  if (!toggle) return;
  const id = toggle.dataset.save || toggle.dataset.remove;
  const removed = saved.has(id);
  if (removed) saved.delete(id); else saved.add(id);
  saveState(); renderList(); refreshSaveButtons();
  notify(removed ? 'Guía retirada de tu lista.' : 'Guía guardada en tu lista.');
  if (toggle.dataset.remove) {
    const next = byId('reading-list').querySelector('button');
    if (next) next.focus(); else { byId('reading-title').tabIndex = -1; byId('reading-title').focus(); }
  }
});
byId('close-reader').addEventListener('click', () => byId('reader').close());
byId('reader').addEventListener('close', () => { document.body.classList.remove('modal-open'); opener?.focus(); });
byId('search-form').addEventListener('submit', event => event.preventDefault());
byId('search').addEventListener('input', renderCatalog);
byId('category').addEventListener('change', renderCatalog);
byId('level').addEventListener('change', renderCatalog);
byId('search-form').addEventListener('reset', () => setTimeout(renderCatalog, 0));
byId('reset-empty').addEventListener('click', () => { byId('search-form').reset(); byId('search').focus(); });
byId('clear-list').addEventListener('click', () => {
  if (!confirm('¿Quieres quitar todas las guías de tu lista de lectura?')) return;
  saved.clear(); saveState(); renderList(); refreshSaveButtons(); notify('Tu lista está vacía.');
  byId('reading-title').tabIndex = -1; byId('reading-title').focus();
});
const menuButton = document.querySelector('.menu-toggle');
menuButton.addEventListener('click', () => { const opened = byId('navegacion').classList.toggle('open'); menuButton.setAttribute('aria-expanded', opened); });
byId('navegacion').addEventListener('click', event => { if (event.target.closest('a')) { byId('navegacion').classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); } });
renderCatalog(); renderList();
if (!persistent) byId('storage-note').textContent = 'El almacenamiento no está disponible. Tu lista se conservará solo durante esta visita.';
