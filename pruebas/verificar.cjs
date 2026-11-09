// Ejecutar con Node.js y Playwright instalado: node pruebas/verificar.cjs
// BROWSER_PATH permite usar un navegador Chromium instalado.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const checks = [];
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml' };
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + (decodeURIComponent(req.url.split('?')[0]) === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0])));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (error,data) => { res.writeHead(error ? 404 : 200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}); res.end(error ? 'No encontrado' : data); });
});
function pass(name, detail) { checks.push({prueba:name, resultado:'Aprobada', detalle:detail}); }
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({headless:true, ...(process.env.BROWSER_PATH ? {executablePath:process.env.BROWSER_PATH} : {})});
  const base = `http://127.0.0.1:${server.address().port}`;
  const errors=[];
  try {
    const context = await browser.newContext();
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400) errors.push(`${r.status()} ${r.url()}`);});
    for(const [name,width,height,columns] of [['computador',1440,1000,3],['tableta',768,1024,2],['movil',390,844,1],['movil_estrecho',320,740,1]]){
      await page.setViewportSize({width,height}); await page.goto(base); await page.locator('.card').first().waitFor();
      assert.equal(await page.locator('.card').count(),6);
      await page.evaluate(async()=>{await Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode();}));});
      const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,columns:getComputedStyle(document.querySelector('.resource-grid')).gridTemplateColumns.split(' ').length,images:[...document.images].every(i=>i.complete&&i.naturalWidth>0),controls:[...document.querySelectorAll('button,input,select')].filter(e=>e.getBoundingClientRect().height>0).every(e=>e.getBoundingClientRect().height>=44)}));
      assert.ok(layout.scroll<=layout.width);assert.equal(layout.columns,columns);assert.ok(layout.images);assert.ok(layout.controls);
      if(width<=640){await page.getByRole('button',{name:'Menú'}).click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.locator('nav').getByRole('link',{name:'Explorar recursos'}).click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');}
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      if(name!=='movil_estrecho') {
        await page.screenshot({path:path.join(root,'evidencias',`${name}.png`),fullPage:true});
        await page.locator('#catalogo').scrollIntoViewIfNeeded();
        await page.evaluate((mobile)=>document.querySelector(mobile ? '#resource-grid' : '#catalogo').scrollIntoView({behavior:'instant',block:'start'}),name==='movil');
        await page.screenshot({path:path.join(root,'evidencias',`${name}_catalogo.png`)});
      }
      pass(`Diseño ${name}`,`${width} × ${height} px; ${columns} columnas; sin desbordamiento; imágenes cargadas; controles ≥44 px; ${width<=640?'menú móvil comprobado':'navegación visible'}.`);
    }
    await page.setViewportSize({width:1440,height:1000});await page.goto(base);
    await page.locator('#search').fill('DISENO');assert.equal(await page.locator('.card').count(),2);pass('Búsqueda normalizada','DISENO encuentra las dos guías del tema Diseño, sin depender de mayúsculas ni tildes.');
    await page.locator('#search').fill('');await page.locator('#category').selectOption('CSS');await page.locator('#level').selectOption('Intermedio');assert.equal(await page.locator('.card').count(),1);assert.match(await page.locator('.card h3').innerText(),/Grid/);pass('Filtros combinados','CSS + Intermedio devuelve únicamente Ordena ideas con Grid.');
    await page.screenshot({path:path.join(root,'evidencias','filtros.png'),fullPage:true});
    await page.locator('#search').fill('zzzzzz');await page.locator('#empty').waitFor({state:'visible'});assert.equal(await page.locator('.card').count(),0);await page.locator('#reset-empty').click();await page.waitForFunction(()=>document.querySelectorAll('.card').length===6);pass('Estado vacío y reinicio','Consulta sin coincidencias muestra orientación; Ver todos los recursos restaura seis tarjetas.');
    await page.locator('[data-save="html"]').click();assert.equal(await page.locator('#saved-count').innerText(),'1');await page.reload();assert.equal(await page.locator('#saved-count').innerText(),'1');assert.equal(await page.locator('[data-save="html"]').getAttribute('aria-pressed'),'true');pass('Lista persistente','Guardar y recargar mantiene un recurso y el estado del botón.');
    await page.locator('[data-read="html"]').first().click();assert.equal(await page.locator('#reader').evaluate(e=>e.open),true);assert.equal(await page.locator('#reader-content section').count(),3);await page.screenshot({path:path.join(root,'evidencias','lectura.png')});await page.keyboard.press('Escape');assert.equal(await page.locator('#reader').evaluate(e=>e.open),false);assert.equal(await page.evaluate(()=>document.activeElement.dataset.read),'html');pass('Lectura y teclado','Diálogo con tres secciones; Escape lo cierra y devuelve el foco al botón de apertura.');
    await page.locator('[data-save="css"]').click();await page.locator('#mi-lista').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'evidencias','lista.png')});await page.locator('[data-remove="html"]').click();assert.equal(await page.locator('#saved-count').innerText(),'1');page.once('dialog',d=>d.dismiss());await page.locator('#clear-list').click();assert.equal(await page.locator('#saved-count').innerText(),'1');page.once('dialog',d=>d.accept());await page.locator('#clear-list').click();assert.equal(await page.locator('#saved-count').innerText(),'0');pass('Quitar y vaciar lista','Quitar elimina solo el recurso seleccionado; cancelar conserva la lista; confirmar la vacía.');
    await page.locator('summary').nth(1).click();assert.equal(await page.locator('details').nth(1).getAttribute('open'),'');pass('Ayuda desplegable','La pregunta sobre almacenamiento muestra su respuesta.');
    const anchors=await page.locator('a[href^="#"]').evaluateAll(links=>links.every(a=>document.getElementById(a.getAttribute('href').slice(1))));assert.ok(anchors);pass('Enlaces internos','Todos los destinos de navegación existen.');
    await page.evaluate(()=>localStorage.setItem('biblioteca-abierta-lista-v1','["inexistente", "html", "html"]'));await page.reload();assert.equal(await page.locator('#saved-count').innerText(),'1');pass('Datos locales inesperados','Se descartan identificadores desconocidos y duplicados.');
    await page.evaluate(()=>localStorage.setItem('biblioteca-abierta-lista-v1','{invalido'));await page.reload();assert.equal(await page.locator('.card').count(),6);assert.equal(await page.locator('#saved-count').innerText(),'0');pass('Datos locales dañados','Un JSON inválido no bloquea el catálogo.');
    const blocked=await browser.newContext();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('bloqueado');}});});const bp=await blocked.newPage();await bp.goto(base);await bp.locator('[data-save="html"]').click();assert.equal(await bp.locator('#saved-count').innerText(),'1');assert.match(await bp.locator('#storage-note').innerText(),/solo durante esta visita/);pass('Almacenamiento bloqueado','La lista funciona en memoria y muestra un aviso claro.');await blocked.close();
    // Aproximación a aumento de texto, no sustituye zoom real ni lector de pantalla.
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.documentElement.style.fontSize='200%');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));pass('Texto ampliado','Tamaño raíz al 200% en 390 px sin desbordamiento horizontal.');
    assert.deepEqual(errors,[]);pass('Errores de ejecución y recursos','No se registraron excepciones JavaScript ni respuestas HTTP de error.');
    fs.writeFileSync(path.join(root,'pruebas','resultados.json'),JSON.stringify({fecha:'2026-11-08',navegador:await browser.version(),entorno:'Chromium de escritorio en modo headless; resoluciones emuladas; no son dispositivos físicos',checks},null,2));
    console.log(JSON.stringify({aprobadas:checks.length,navegador:await browser.version(),checks},null,2));
  } finally { await browser.close();server.close(); }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
