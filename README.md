# Mi Presupuesto - App para Cristina

Progressive Web App (PWA) para gestionar presupuesto mensual de forma simple y eficiente.

---

## Características

- **Funciona sin internet**: Una vez instalada, no necesita conexión
- **Guardado automático**: Todos los datos se guardan en el teléfono
- **Interfaz simple**: Letras grandes, botones fáciles de tocar
- **5 secciones**: Inicio, Ingresos, Grupos, Historial, Ajustes
- **10 grupos de gastos**: Servicios, Administración, Salud, Mercado, Impuestos, etc.
- **Calculadora integrada**: Para sumar facturas rápidamente
- **Backup de datos**: Exporta e importa toda la información
- **Historial**: Consulta meses anteriores y busca gastos
- **Notas mensuales**: Agrega recordatorios importantes

---

## Instalación en GitHub Pages

### Paso 1: Generar los íconos

1. Abre el archivo `generar-iconos.html` en cualquier navegador
2. Haz clic en "Descargar icon-192.png"
3. Haz clic en "Descargar icon-512.png"
4. Guarda ambos archivos en la carpeta del proyecto

### Paso 2: Subir a GitHub

1. Sube todos los archivos a tu repositorio en GitHub:
   - index.html
   - styles.css
   - app.js
   - manifest.json
   - sw.js
   - icon-192.png
   - icon-512.png

2. Ve a Settings > Pages
3. En "Source" selecciona "main" branch
4. Haz clic en Save
5. Espera unos minutos y tu app estará disponible en:
   `https://[tu-usuario].github.io/[nombre-repo]`

### Paso 3: Instalar en el iPhone de Cristina

1. Abre Safari en el iPhone
2. Ve a la URL de GitHub Pages
3. Toca el botón de compartir (el cuadro con flecha hacia arriba)
4. Desliza hacia abajo y toca "Agregar a la pantalla de inicio"
5. Cambia el nombre si quieres (ej: "Mi Presupuesto")
6. Toca "Agregar"

¡Listo! Ahora la app aparece como un ícono en la pantalla de inicio y funciona como una app normal.

### Primer uso

La primera vez que abras la app, verás una pantalla de bienvenida donde debes configurar los presupuestos mensuales de cada grupo. Estos valores se mantendrán automáticamente mes a mes, no necesitas configurarlos otra vez.

---

## Cómo usar la app

### Sección INICIO
- Muestra resumen del mes: ingresos, presupuesto, gastado, disponible
- Lista de servicios pendientes por pagar
- Alertas si te pasaste del presupuesto

### Sección INGRESOS
- Agrega tus ingresos mensuales (pensión, arriendos, etc.)
- Edita o elimina ingresos
- Ve el total automáticamente

### Sección GRUPOS
- 11 grupos con presupuesto asignado
- Cada grupo muestra:
  - Barra de progreso (verde, amarilla o roja)
  - Total gastado vs presupuesto
  - Lo que queda disponible

**Los 11 grupos son:**
- Servicios (fijo)
- Administración (fijo)
- Salud (fijo)
- Mercado (libre)
- Impuestos (especial)
- Entretenimiento (libre)
- Ahorro (libre)
- Aseo (libre)
- Gasolina (libre)
- Mantenimiento finca (libre)
- Otros (libre) - para gastos inesperados

**Tipos de grupos:**

1. **Fijos** (Servicios, Administración, Salud):
   - Ítems predefinidos
   - Puedes guardar números de referencia
   - Marca como pagado al ingresar el valor

2. **Especial** (Impuestos):
   - Un solo campo para el valor mensual

3. **Libres** (Mercado, Entretenimiento, Ahorro, Aseo, Gasolina, Mantenimiento finca, Otros):
   - Agrega gastos con descripción, valor y fecha
   - Elimina gastos cuando quieras

### Sección HISTORIAL
- Ve meses anteriores completos
- Busca gastos específicos
- Agrega notas al mes actual
- Cierra el mes cuando termina (esto archiva todo y empieza uno nuevo)

### Sección AJUSTES
- Cambia tu nombre
- Edita presupuestos de cada grupo
- **Descarga respaldo**: Guarda todos tus datos en un archivo
- **Restaurar respaldo**: Recupera datos desde un archivo

### Calculadora flotante
- Botón verde con calculadora (abajo a la derecha)
- Súmale rápidamente todas las facturas
- Cierra tocando fuera de la calculadora

---

## Preguntas frecuentes

### ¿Se pierden los datos si cierro la app?
No. Todo se guarda automáticamente en el teléfono.

### ¿Qué pasa si borro la app?
Se pierden todos los datos. Por eso es importante hacer respaldos desde Ajustes.

### ¿Cómo hago un respaldo?
Ve a Ajustes > Descargar Respaldo. Se descarga un archivo JSON que puedes guardar en iCloud, enviar por email, etc.

### ¿Cómo restauro un respaldo?
Ve a Ajustes > Restaurar Respaldo > Selecciona el archivo JSON.

### ¿Puedo usar la app en varios dispositivos?
Sí, pero debes pasar los respaldos manualmente entre dispositivos.

### ¿Qué pasa al cerrar el mes?
- Se archiva todo el mes en Historial
- **Los presupuestos se copian automáticamente al nuevo mes** (no hay que configurarlos otra vez)
- Los ítems fijos vuelven a 0 (pero conservan números de referencia)
- Los gastos libres se borran completamente
- Los ingresos se vacían
- Empieza un mes nuevo limpio listo para usar

### ¿Cómo cambio los presupuestos?
Puedes editar los presupuestos en cualquier momento desde Ajustes. Los cambios solo aplican al mes actual. Al cerrar el mes, el nuevo mes copiará los presupuestos que tenías configurados.

### ¿Tengo que configurar los presupuestos cada mes?
No. Los presupuestos se configuran solo una vez al inicio, y luego se copian automáticamente mes a mes. Solo tienes que cambiarlos si quieres ajustar algún valor.

---

## Estructura del proyecto

```
presupuestoACHC/
├── index.html          (HTML principal)
├── styles.css          (Estilos)
├── app.js              (Lógica de la aplicación)
├── manifest.json       (Configuración PWA)
├── sw.js               (Service Worker para offline)
├── icon-192.png        (Ícono pequeño)
├── icon-512.png        (Ícono grande)
├── generar-iconos.html (Generador de íconos)
└── README.md           (Este archivo)
```

---

## Soporte

Si encuentras algún problema o necesitas ayuda, contacta al desarrollador.

**Versión:** 1.0
**Fecha:** Abril 2026
**Hecho con ❤️ para Cristina**
