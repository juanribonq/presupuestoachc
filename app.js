// ============================================
// CONFIGURACIÓN INICIAL
// ============================================

const CONFIG = {
    nombreUsuario: 'Cristina',
    gruposIniciales: [
        { nombre: 'Servicios', presupuesto: 0, tipo: 'fijo', items: ['Agua', 'Luz', 'Internet', 'Gas', 'Celular'] },
        { nombre: 'Administración', presupuesto: 0, tipo: 'fijo', items: ['Admon Bilbao', 'Admon Dalmacia', 'Admon Citadino'] },
        { nombre: 'Salud', presupuesto: 0, tipo: 'fijo', items: ['Planilla', 'Premium'] },
        { nombre: 'Mercado', presupuesto: 0, tipo: 'libre', items: [] },
        { nombre: 'Impuestos', presupuesto: 0, tipo: 'especial', items: [] },
        { nombre: 'Entretenimiento', presupuesto: 0, tipo: 'libre', items: [] },
        { nombre: 'Ahorro', presupuesto: 0, tipo: 'libre', items: [] },
        { nombre: 'Aseo', presupuesto: 0, tipo: 'libre', items: [] },
        { nombre: 'Gasolina', presupuesto: 0, tipo: 'libre', items: [] },
        { nombre: 'Mantenimiento finca', presupuesto: 0, tipo: 'libre', items: [] },
        { nombre: 'Otros', presupuesto: 0, tipo: 'libre', items: [] }
    ]
};

// ============================================
// ESTADO GLOBAL
// ============================================

let estado = {
    nombreUsuario: CONFIG.nombreUsuario,
    mesActual: obtenerMesActualKey(),
    seccionActiva: 'inicio',
    configurado: false,
    detallesPagoServicios: {}, // Detalles permanentes por servicio: { 'Servicios-Agua': { detallesPago: '...', referencia: '...' } }
    meses: {}
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function obtenerMesActualKey() {
    const fecha = new Date();
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

function obtenerNombreMes(key) {
    const [año, mes] = key.split('-');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[parseInt(mes) - 1]} ${año}`;
}

function formatearPesos(valor) {
    const num = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
    return '$' + num.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

function parsearPesos(texto) {
    return parseInt(texto.replace(/\D/g, '')) || 0;
}

function obtenerDetallesPago(grupoNombre, itemNombre) {
    const key = `${grupoNombre}-${itemNombre}`;
    return estado.detallesPagoServicios[key] || { detallesPago: '', referencia: '' };
}

function guardarDetallesPago(grupoNombre, itemNombre, detallesPago, referencia) {
    const key = `${grupoNombre}-${itemNombre}`;
    estado.detallesPagoServicios[key] = { detallesPago, referencia };
    guardarDatos();
}

// ============================================
// GESTIÓN DE DATOS (localStorage)
// ============================================

function cargarDatos() {
    const datosGuardados = localStorage.getItem('presupuestoApp');
    if (datosGuardados) {
        estado = JSON.parse(datosGuardados);
        estado.mesActual = obtenerMesActualKey();

        // Verificar si el mes actual existe, si no, crearlo copiando presupuestos del mes anterior
        if (!estado.meses[estado.mesActual]) {
            crearNuevoMes();
        }
    } else {
        inicializarMesActual();
    }
}

function guardarDatos() {
    localStorage.setItem('presupuestoApp', JSON.stringify(estado));
}

function inicializarMesActual() {
    if (!estado.meses[estado.mesActual]) {
        estado.meses[estado.mesActual] = {
            ingresos: [],
            grupos: CONFIG.gruposIniciales.map(g => ({
                nombre: g.nombre,
                presupuesto: g.presupuesto,
                tipo: g.tipo,
                items: g.tipo === 'fijo' ? g.items.map(nombre => ({
                    nombre,
                    predefinido: true, // Items predefinidos se mantienen mes a mes
                    valor: 0,
                    pagado: false
                })) : [],
                gastado: 0
            })),
            notas: '',
            cerrado: false
        };
        guardarDatos();
    }
}

function crearNuevoMes() {
    // Obtener el mes anterior más reciente
    const mesesKeys = Object.keys(estado.meses).sort().reverse();
    const mesAnteriorKey = mesesKeys[0];
    const mesAnterior = estado.meses[mesAnteriorKey];

    if (!mesAnterior) {
        inicializarMesActual();
        return;
    }

    // Crear nuevo mes copiando presupuestos del mes anterior
    estado.meses[estado.mesActual] = {
        ingresos: [],
        grupos: mesAnterior.grupos.map(grupo => ({
            nombre: grupo.nombre,
            presupuesto: grupo.presupuesto, // Copiar presupuesto del mes anterior
            tipo: grupo.tipo,
            items: grupo.tipo === 'fijo'
                ? grupo.items
                    .filter(item => item.predefinido) // Solo copiar items predefinidos
                    .map(item => ({
                        nombre: item.nombre,
                        predefinido: true,
                        valor: 0, // Resetear valor
                        pagado: false // Resetear estado
                    }))
                : [], // Items libres vacíos
            gastado: 0 // Resetear gastado
        })),
        notas: '',
        cerrado: false
    };

    guardarDatos();
}

function obtenerMesActual() {
    return estado.meses[estado.mesActual] || {};
}

// ============================================
// NAVEGACIÓN
// ============================================

function cambiarSeccion(nombreSeccion) {
    estado.seccionActiva = nombreSeccion;

    // Ocultar todas las secciones
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));

    // Mostrar sección activa
    const seccion = document.getElementById(`seccion-${nombreSeccion}`);
    if (seccion) {
        seccion.classList.add('activa');
    }

    // Actualizar navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('activo');
        if (item.dataset.seccion === nombreSeccion) {
            item.classList.add('activo');
        }
    });

    // Renderizar contenido de la sección
    renderizarSeccion(nombreSeccion);
}

function renderizarSeccion(nombreSeccion) {
    switch(nombreSeccion) {
        case 'inicio':
            renderizarInicio();
            break;
        case 'ingresos':
            renderizarIngresos();
            break;
        case 'grupos':
            renderizarGrupos();
            break;
        case 'historial':
            renderizarHistorial();
            break;
        case 'ajustes':
            renderizarAjustes();
            break;
    }
}

// ============================================
// SECCIÓN: INICIO
// ============================================

function renderizarInicio() {
    const mes = obtenerMesActual();
    const contenedor = document.getElementById('contenido-inicio');

    const totalIngresos = calcularTotalIngresos();
    const totalPresupuestado = calcularTotalPresupuestado();
    const totalGastado = calcularTotalGastado();
    const disponible = totalIngresos - totalGastado;
    const serviciosPendientes = obtenerServiciosPendientes();
    const serviciosPagados = obtenerServiciosPagados();

    let html = '';

    // Resumen
    html += '<div class="tarjeta">';
    html += '<h2>Resumen del mes</h2>';
    html += `<div class="resumen-item"><span class="label">Ingresos:</span><span class="valor positivo">${formatearPesos(totalIngresos)}</span></div>`;
    html += `<div class="resumen-item"><span class="label">Presupuestado:</span><span class="valor">${formatearPesos(totalPresupuestado)}</span></div>`;
    html += `<div class="resumen-item"><span class="label">Gastado:</span><span class="valor">${formatearPesos(totalGastado)}</span></div>`;
    html += `<div class="resumen-item ${disponible >= 0 ? 'positivo' : 'negativo'}"><span class="label">Disponible:</span><span class="valor">${formatearPesos(disponible)}</span></div>`;
    html += '</div>';

    // Alertas
    if (totalPresupuestado > totalIngresos) {
        html += '<div class="alerta peligro">';
        html += '<strong>¡Atención!</strong> Los presupuestos superan los ingresos por ' + formatearPesos(totalPresupuestado - totalIngresos);
        html += '</div>';
    }

    if (totalGastado > totalIngresos) {
        html += '<div class="alerta peligro">';
        html += '<strong>¡Cuidado!</strong> Has gastado más de lo que ingresó este mes';
        html += '</div>';
    }

    // Servicios pendientes
    if (serviciosPendientes.length > 0) {
        html += '<div class="tarjeta">';
        html += '<h2>Pendientes por pagar</h2>';
        html += '<div class="lista-items">';
        serviciosPendientes.forEach(servicio => {
            html += '<div class="item">';
            html += `<div class="item-header">`;
            html += `<span class="item-nombre">${servicio.grupo} - ${servicio.nombre}</span>`;
            html += `<span class="item-estado pendiente">Pendiente</span>`;
            html += `</div>`;
            if (servicio.referencia) {
                html += `<div class="texto-pequeno">Ref: ${servicio.referencia}</div>`;
            }
            html += '</div>';
        });
        html += '</div>';
        html += '</div>';
    } else {
        html += '<div class="alerta info">';
        html += '¡Bien hecho! No hay servicios pendientes por pagar';
        html += '</div>';
    }

    // Servicios pagados
    if (serviciosPagados.length > 0) {
        html += '<div class="tarjeta">';
        html += '<h2>Servicios pagados ✓</h2>';
        html += '<div class="lista-items">';
        serviciosPagados.forEach(servicio => {
            html += '<div class="item item-pagado">';
            html += `<div class="item-header">`;
            html += `<span class="item-nombre">${servicio.grupo} - ${servicio.nombre}</span>`;
            html += `<span class="item-valor">${formatearPesos(servicio.valor)}</span>`;
            html += `</div>`;
            html += '</div>';
        });
        html += '</div>';
        html += '</div>';
    }

    contenedor.innerHTML = html;
    actualizarBadgeNotificaciones();
}

function calcularTotalIngresos() {
    const mes = obtenerMesActual();
    return (mes.ingresos || []).reduce((sum, ing) => sum + ing.valor, 0);
}

function calcularTotalPresupuestado() {
    const mes = obtenerMesActual();
    return (mes.grupos || []).reduce((sum, g) => sum + g.presupuesto, 0);
}

function calcularTotalGastado() {
    const mes = obtenerMesActual();
    return (mes.grupos || []).reduce((sum, g) => {
        let gastado = 0;

        if (g.tipo === 'fijo') {
            gastado = g.items.reduce((s, item) => s + (item.valor || 0), 0);
        } else if (g.tipo === 'especial') {
            gastado = g.gastado || 0;
        } else if (g.tipo === 'libre') {
            gastado = g.items.reduce((s, item) => s + item.valor, 0);
        }

        return sum + gastado;
    }, 0);
}

function obtenerServiciosPendientes() {
    const mes = obtenerMesActual();
    const pendientes = [];

    (mes.grupos || []).forEach(grupo => {
        if (grupo.tipo === 'fijo') {
            grupo.items.forEach(item => {
                if (!item.pagado || item.valor === 0) {
                    pendientes.push({
                        grupo: grupo.nombre,
                        nombre: item.nombre,
                        referencia: item.referencia
                    });
                }
            });
        }
    });

    return pendientes;
}

function obtenerServiciosPagados() {
    const mes = obtenerMesActual();
    const pagados = [];

    (mes.grupos || []).forEach(grupo => {
        if (grupo.tipo === 'fijo') {
            grupo.items.forEach(item => {
                if (item.pagado && item.valor > 0) {
                    pagados.push({
                        grupo: grupo.nombre,
                        nombre: item.nombre,
                        valor: item.valor
                    });
                }
            });
        }
    });

    return pagados;
}

function actualizarBadgeNotificaciones() {
    const pendientes = obtenerServiciosPendientes();
    const badge = document.querySelector('.nav-item[data-seccion="inicio"] .nav-badge');

    if (pendientes.length > 0) {
        if (badge) {
            badge.textContent = pendientes.length;
            badge.style.display = 'flex';
        }
    } else {
        if (badge) {
            badge.style.display = 'none';
        }
    }
}

// ============================================
// SECCIÓN: INGRESOS
// ============================================

function renderizarIngresos() {
    const mes = obtenerMesActual();
    const contenedor = document.getElementById('contenido-ingresos');
    const ingresos = mes.ingresos || [];
    const total = calcularTotalIngresos();

    let html = '';

    html += '<div class="tarjeta">';
    html += '<h2>Ingresos del mes</h2>';

    if (ingresos.length > 0) {
        html += '<div class="lista-items">';
        ingresos.forEach((ingreso, index) => {
            html += '<div class="item">';
            html += `<div class="item-header">`;
            html += `<span class="item-nombre">${ingreso.nombre}</span>`;
            html += `<span class="item-valor">${formatearPesos(ingreso.valor)}</span>`;
            html += `</div>`;
            html += `<button class="secundario pequeno" onclick="eliminarIngreso(${index})">Eliminar</button>`;
            html += '</div>';
        });
        html += '</div>';

        html += `<div class="resumen-item mt-20">`;
        html += `<span class="label texto-grande">Total:</span>`;
        html += `<span class="valor positivo texto-grande">${formatearPesos(total)}</span>`;
        html += `</div>`;
    } else {
        html += '<p class="texto-centro">No hay ingresos registrados este mes</p>';
    }

    html += '<button onclick="mostrarFormularioIngreso()">+ Agregar Ingreso</button>';
    html += '</div>';

    contenedor.innerHTML = html;
}

function mostrarFormularioIngreso() {
    const modal = document.getElementById('modal-ingreso');
    document.getElementById('ingreso-nombre').value = '';
    document.getElementById('ingreso-valor').value = '';
    modal.classList.add('activo');
}

function cerrarModalIngreso() {
    document.getElementById('modal-ingreso').classList.remove('activo');
}

function agregarIngreso() {
    const nombre = document.getElementById('ingreso-nombre').value.trim();
    const valor = parsearPesos(document.getElementById('ingreso-valor').value);

    if (!nombre || valor <= 0) {
        alert('Por favor completa todos los campos');
        return;
    }

    const mes = obtenerMesActual();
    mes.ingresos.push({ nombre, valor });
    guardarDatos();
    cerrarModalIngreso();
    renderizarIngresos();

    if (estado.seccionActiva === 'inicio') {
        renderizarInicio();
    }
}

function eliminarIngreso(index) {
    if (confirm('¿Estás segura de eliminar este ingreso?')) {
        const mes = obtenerMesActual();
        mes.ingresos.splice(index, 1);
        guardarDatos();
        renderizarIngresos();
    }
}

// ============================================
// SECCIÓN: GRUPOS
// ============================================

function renderizarGrupos() {
    const mes = obtenerMesActual();
    const contenedor = document.getElementById('contenido-grupos');
    const grupos = mes.grupos || [];

    let html = '';

    grupos.forEach((grupo, index) => {
        const gastado = calcularGastadoGrupo(grupo);
        const porcentaje = grupo.presupuesto > 0 ? (gastado / grupo.presupuesto * 100) : 0;
        const colorBarra = porcentaje < 80 ? '' : (porcentaje < 100 ? 'amarillo' : 'rojo');

        html += `<div class="grupo" onclick="abrirDetalleGrupo(${index})">`;
        html += `<div class="grupo-header">`;
        html += `<span class="grupo-nombre">${grupo.nombre}</span>`;
        html += `<span class="grupo-monto">${formatearPesos(grupo.presupuesto)}</span>`;
        html += `</div>`;

        html += `<div class="grupo-progreso">`;
        html += `<div class="barra-progreso">`;
        html += `<div class="barra-progreso-fill ${colorBarra}" style="width: ${Math.min(porcentaje, 100)}%">`;
        html += `${Math.round(porcentaje)}%`;
        html += `</div>`;
        html += `</div>`;
        html += `</div>`;

        html += `<div class="grupo-stats">`;
        html += `<span>Gastado: ${formatearPesos(gastado)}</span>`;
        html += `<span>Quedan: ${formatearPesos(Math.max(0, grupo.presupuesto - gastado))}</span>`;
        html += `</div>`;

        html += `<div class="grupo-accion">`;
        html += `<span>👉 Toca para registrar gastos</span>`;
        html += `</div>`;

        html += `</div>`;
    });

    contenedor.innerHTML = html;
}

function calcularGastadoGrupo(grupo) {
    if (grupo.tipo === 'fijo') {
        return grupo.items.reduce((sum, item) => sum + (item.valor || 0), 0);
    } else if (grupo.tipo === 'especial') {
        return grupo.gastado || 0;
    } else if (grupo.tipo === 'libre') {
        return grupo.items.reduce((sum, item) => sum + item.valor, 0);
    }
    return 0;
}

function abrirDetalleGrupo(index) {
    const mes = obtenerMesActual();
    const grupo = mes.grupos[index];
    const modal = document.getElementById('modal-grupo');
    const contenido = document.getElementById('contenido-modal-grupo');

    document.getElementById('modal-grupo-titulo').textContent = grupo.nombre;

    let html = '';

    // Mostrar presupuesto
    html += `<div class="resumen-item">`;
    html += `<span class="label">Presupuesto:</span>`;
    html += `<span class="valor">${formatearPesos(grupo.presupuesto)}</span>`;
    html += `</div>`;

    // Renderizar según tipo
    if (grupo.tipo === 'fijo') {
        html += renderizarGrupoFijo(grupo, index);
    } else if (grupo.tipo === 'especial') {
        html += renderizarGrupoEspecial(grupo, index);
    } else if (grupo.tipo === 'libre') {
        html += renderizarGrupoLibre(grupo, index);
    }

    contenido.innerHTML = html;
    modal.classList.add('activo');

    // Guardar índice actual
    modal.dataset.grupoIndex = index;
}

function renderizarGrupoFijo(grupo, grupoIndex) {
    let html = '';

    // Separar items en pendientes y pagados
    const pendientes = [];
    const pagados = [];

    grupo.items.forEach((item, itemIndex) => {
        if (item.pagado && item.valor > 0) {
            pagados.push({ item, itemIndex });
        } else {
            pendientes.push({ item, itemIndex });
        }
    });

    // Sección PENDIENTES
    if (pendientes.length > 0) {
        html += '<h3 class="seccion-titulo">Pendientes</h3>';
        html += '<div class="lista-items">';

        pendientes.forEach(({ item, itemIndex }) => {
            // Obtener detalles de pago desde configuración global
            const detalles = obtenerDetallesPago(grupo.nombre, item.nombre);

            html += '<div class="item">';
            html += `<div class="item-header">`;
            html += `<strong>${item.nombre}</strong>`;
            html += `<span class="item-estado pendiente">Pendiente</span>`;
            html += `</div>`;

            // Mostrar detalles de pago si existen (solo lectura)
            if (detalles.detallesPago) {
                html += `<div class="info-pago">`;
                html += `<strong>Cómo pagar:</strong> ${detalles.detallesPago}`;
                html += `</div>`;
            }

            // Mostrar referencia si existe (solo lectura)
            if (detalles.referencia) {
                html += `<div class="info-pago">`;
                html += `<strong>Referencia:</strong> ${detalles.referencia}`;
                html += `</div>`;
            }

            // Campo para ingresar el valor pagado
            html += `<label class="mt-20">Valor pagado:</label>`;
            html += `<input type="text" inputmode="numeric" id="valor-pago-${grupoIndex}-${itemIndex}" value="${item.valor > 0 ? formatearPesos(item.valor) : ''}" placeholder="$0">`;

            html += `<button class="mt-20" onclick="confirmarPagoFijo(${grupoIndex}, ${itemIndex})">✓ Confirmar pago</button>`;

            html += '</div>';
        });

        html += '</div>';
    }

    // Permitir agregar "Otros" en todos los grupos fijos
    html += `<button class="mt-20" onclick="agregarOtroItemFijo(${grupoIndex})">+ Agregar Otros</button>`;

    // Sección PAGADOS
    if (pagados.length > 0) {
        html += '<h3 class="seccion-titulo mt-20">Pagados ✓</h3>';
        html += '<div class="lista-items">';

        pagados.forEach(({ item, itemIndex }) => {
            // Obtener detalles de pago desde configuración global (solo para predefinidos)
            const detalles = item.predefinido ? obtenerDetallesPago(grupo.nombre, item.nombre) : { detallesPago: '', referencia: '' };

            html += '<div class="item item-pagado">';
            html += `<div class="item-header">`;
            html += `<strong>${item.nombre}</strong>`;
            if (!item.predefinido) {
                html += `<span class="item-estado" style="background: #2196F3; color: white; font-size: 12px;">Otros</span>`;
            }
            html += `<span class="item-valor">${formatearPesos(item.valor)}</span>`;
            html += `</div>`;

            if (detalles.detallesPago) {
                html += `<div class="texto-pequeno">💳 ${detalles.detallesPago}</div>`;
            }
            if (detalles.referencia) {
                html += `<div class="texto-pequeno">📋 Ref: ${detalles.referencia}</div>`;
            }

            // Si es predefinido, solo "Deshacer Pago". Si es "Otros", mostrar también "Eliminar"
            if (item.predefinido) {
                html += `<button class="secundario pequeno mt-20" onclick="limpiarPagoFijo(${grupoIndex}, ${itemIndex})">Deshacer Pago</button>`;
            } else {
                html += `<button class="secundario pequeno mt-20" onclick="limpiarPagoFijo(${grupoIndex}, ${itemIndex})">Deshacer Pago</button>`;
                html += `<button class="peligro pequeno" onclick="eliminarItemOtro(${grupoIndex}, ${itemIndex})">Eliminar</button>`;
            }

            html += '</div>';
        });

        html += '</div>';
    }

    return html;
}

function renderizarGrupoEspecial(grupo, grupoIndex) {
    let html = '<div class="form-group mt-20">';
    html += `<label>Valor del mes:</label>`;
    html += `<input type="text" inputmode="numeric" value="${grupo.gastado > 0 ? formatearPesos(grupo.gastado) : ''}"
                    onchange="actualizarValorEspecial(${grupoIndex}, this.value)" placeholder="$0">`;
    html += '</div>';
    return html;
}

function renderizarGrupoLibre(grupo, grupoIndex) {
    let html = '<div class="lista-items mt-20">';

    if (grupo.items.length > 0) {
        grupo.items.forEach((item, itemIndex) => {
            html += '<div class="item">';
            html += `<div class="item-header">`;
            html += `<span class="item-nombre">${item.descripcion}</span>`;
            html += `<span class="item-valor">${formatearPesos(item.valor)}</span>`;
            html += `</div>`;
            html += `<div class="texto-pequeno">${item.fecha}</div>`;
            html += `<button class="peligro pequeno" onclick="eliminarItemLibre(${grupoIndex}, ${itemIndex})">Eliminar</button>`;
            html += '</div>';
        });
    } else {
        html += '<p class="texto-centro">No hay gastos registrados</p>';
    }

    html += '</div>';
    html += `<button onclick="agregarGastoLibre(${grupoIndex})">+ Agregar Gasto</button>`;

    return html;
}

function cerrarModalGrupo() {
    document.getElementById('modal-grupo').classList.remove('activo');
    renderizarGrupos();
    if (estado.seccionActiva === 'inicio') {
        renderizarInicio();
    }
}

function editarDetallesServicio(grupoNombre, itemNombre) {
    const detalles = obtenerDetallesPago(grupoNombre, itemNombre);

    const modal = document.getElementById('modal-editar-detalles');
    document.getElementById('editar-nombre-item').textContent = `${grupoNombre} - ${itemNombre}`;
    document.getElementById('editar-detalles-pago').value = detalles.detallesPago || '';
    document.getElementById('editar-referencia').value = detalles.referencia || '';

    modal.dataset.grupoNombre = grupoNombre;
    modal.dataset.itemNombre = itemNombre;
    modal.classList.add('activo');
}

function cerrarModalEditarDetalles() {
    document.getElementById('modal-editar-detalles').classList.remove('activo');
}

function guardarDetallesServicio() {
    const modal = document.getElementById('modal-editar-detalles');
    const grupoNombre = modal.dataset.grupoNombre;
    const itemNombre = modal.dataset.itemNombre;

    const detallesPagoTexto = document.getElementById('editar-detalles-pago').value.trim();
    const referencia = document.getElementById('editar-referencia').value.trim();

    guardarDetallesPago(grupoNombre, itemNombre, detallesPagoTexto, referencia);

    cerrarModalEditarDetalles();

    // Refrescar la vista actual
    if (estado.seccionActiva === 'ajustes') {
        renderizarAjustes();
    }
}

function confirmarPagoFijo(grupoIndex, itemIndex) {
    const input = document.getElementById(`valor-pago-${grupoIndex}-${itemIndex}`);
    const valor = input.value;
    const valorNum = parsearPesos(valor);

    if (valorNum <= 0) {
        alert('Por favor ingresa un valor mayor a $0');
        return;
    }

    const mes = obtenerMesActual();
    mes.grupos[grupoIndex].items[itemIndex].valor = valorNum;
    mes.grupos[grupoIndex].items[itemIndex].pagado = true;
    guardarDatos();
    abrirDetalleGrupo(grupoIndex);

    if (estado.seccionActiva === 'inicio') {
        renderizarInicio();
    }
}

function limpiarPagoFijo(grupoIndex, itemIndex) {
    if (confirm('¿Deshacer este pago?')) {
        const mes = obtenerMesActual();
        mes.grupos[grupoIndex].items[itemIndex].valor = 0;
        mes.grupos[grupoIndex].items[itemIndex].pagado = false;
        guardarDatos();
        abrirDetalleGrupo(grupoIndex);
    }
}

function eliminarItemOtro(grupoIndex, itemIndex) {
    if (confirm('¿Eliminar este item? Esta acción no se puede deshacer.')) {
        const mes = obtenerMesActual();
        mes.grupos[grupoIndex].items.splice(itemIndex, 1);
        guardarDatos();
        abrirDetalleGrupo(grupoIndex);

        if (estado.seccionActiva === 'inicio') {
            renderizarInicio();
        }
    }
}

function actualizarValorEspecial(grupoIndex, valor) {
    const mes = obtenerMesActual();
    mes.grupos[grupoIndex].gastado = parsearPesos(valor);
    guardarDatos();
}

function agregarOtroItemFijo(grupoIndex) {
    const mes = obtenerMesActual();
    const grupo = mes.grupos[grupoIndex];

    const nombre = prompt(`Descripción del gasto adicional de ${grupo.nombre}:`);
    if (!nombre) return;

    const valor = prompt('Valor pagado:');
    const valorNum = parsearPesos(valor);
    if (valorNum <= 0) return;

    mes.grupos[grupoIndex].items.push({
        nombre,
        predefinido: false, // Items "otros" no se copian al siguiente mes
        valor: valorNum,
        pagado: true
    });

    guardarDatos();
    abrirDetalleGrupo(grupoIndex);

    if (estado.seccionActiva === 'inicio') {
        renderizarInicio();
    }
}

function agregarGastoLibre(grupoIndex) {
    const modal = document.getElementById('modal-gasto-libre');
    modal.dataset.grupoIndex = grupoIndex;
    document.getElementById('gasto-descripcion').value = '';
    document.getElementById('gasto-valor').value = '';
    document.getElementById('gasto-fecha').value = new Date().toISOString().split('T')[0];
    modal.classList.add('activo');
}

function cerrarModalGastoLibre() {
    document.getElementById('modal-gasto-libre').classList.remove('activo');
}

function guardarGastoLibre() {
    const grupoIndex = parseInt(document.getElementById('modal-gasto-libre').dataset.grupoIndex);
    const descripcion = document.getElementById('gasto-descripcion').value.trim();
    const valor = parsearPesos(document.getElementById('gasto-valor').value);
    const fecha = document.getElementById('gasto-fecha').value;

    if (!descripcion || valor <= 0) {
        alert('Por favor completa todos los campos');
        return;
    }

    const mes = obtenerMesActual();
    mes.grupos[grupoIndex].items.push({
        descripcion,
        valor,
        fecha
    });

    guardarDatos();
    cerrarModalGastoLibre();
    abrirDetalleGrupo(grupoIndex);
}

function eliminarItemLibre(grupoIndex, itemIndex) {
    if (confirm('¿Eliminar este gasto?')) {
        const mes = obtenerMesActual();
        mes.grupos[grupoIndex].items.splice(itemIndex, 1);
        guardarDatos();
        abrirDetalleGrupo(grupoIndex);
    }
}

// ============================================
// SECCIÓN: HISTORIAL
// ============================================

function renderizarHistorial() {
    const contenedor = document.getElementById('contenido-historial');
    const mesesCerrados = Object.keys(estado.meses)
        .filter(key => estado.meses[key].cerrado)
        .sort()
        .reverse();

    let html = '';

    // Búsqueda
    html += '<div class="tarjeta">';
    html += '<div class="busqueda">';
    html += '<input type="text" id="busqueda-historial" placeholder="Buscar en historial..." oninput="buscarEnHistorial()">';
    html += '<span class="busqueda-icono">🔍</span>';
    html += '</div>';
    html += '</div>';

    // Notas del mes actual
    const mesActual = obtenerMesActual();
    html += '<div class="tarjeta">';
    html += `<h2>Notas - ${obtenerNombreMes(estado.mesActual)}</h2>`;
    html += `<textarea id="notas-mes" rows="4" placeholder="Escribe notas sobre este mes...">${mesActual.notas || ''}</textarea>`;
    html += '<button onclick="guardarNotas()">Guardar Notas</button>';
    html += '</div>';

    // Meses cerrados
    html += '<div id="lista-historial">';

    if (mesesCerrados.length > 0) {
        mesesCerrados.forEach(key => {
            const mes = estado.meses[key];
            const totalIngresos = mes.ingresos.reduce((sum, ing) => sum + ing.valor, 0);
            const totalGastado = mes.grupos.reduce((sum, g) => sum + calcularGastadoGrupo(g), 0);

            html += '<div class="tarjeta">';
            html += `<h3>${obtenerNombreMes(key)}</h3>`;
            html += `<div class="resumen-item"><span class="label">Ingresos:</span><span class="valor">${formatearPesos(totalIngresos)}</span></div>`;
            html += `<div class="resumen-item"><span class="label">Gastado:</span><span class="valor">${formatearPesos(totalGastado)}</span></div>`;
            html += `<div class="resumen-item ${totalIngresos - totalGastado >= 0 ? 'positivo' : 'negativo'}">`;
            html += `<span class="label">Diferencia:</span><span class="valor">${formatearPesos(totalIngresos - totalGastado)}</span></div>`;

            if (mes.notas) {
                html += `<div class="mt-20"><strong>Notas:</strong><br>${mes.notas}</div>`;
            }

            html += `<button class="secundario" onclick="verDetalleMes('${key}')">Ver Detalles</button>`;
            html += '</div>';
        });
    } else {
        html += '<div class="tarjeta texto-centro">';
        html += '<p>No hay meses cerrados aún</p>';
        html += '</div>';
    }

    html += '</div>';

    // Botón cerrar mes
    if (!mesActual.cerrado) {
        html += '<div class="tarjeta">';
        html += '<h3>Cerrar mes actual</h3>';
        html += '<p>Al cerrar el mes, se archivará toda la información y se iniciará un nuevo mes.</p>';
        html += '<button class="peligro" onclick="cerrarMesActual()">Cerrar Mes</button>';
        html += '</div>';
    }

    contenedor.innerHTML = html;
}

function guardarNotas() {
    const notas = document.getElementById('notas-mes').value;
    const mes = obtenerMesActual();
    mes.notas = notas;
    guardarDatos();
    alert('Notas guardadas');
}

function buscarEnHistorial() {
    const termino = document.getElementById('busqueda-historial').value.toLowerCase();
    const mesesCerrados = Object.keys(estado.meses)
        .filter(key => estado.meses[key].cerrado)
        .sort()
        .reverse();

    const contenedor = document.getElementById('lista-historial');
    let html = '';

    if (!termino) {
        renderizarHistorial();
        return;
    }

    let resultados = [];

    mesesCerrados.forEach(key => {
        const mes = estado.meses[key];

        // Buscar en ingresos
        mes.ingresos.forEach(ing => {
            if (ing.nombre.toLowerCase().includes(termino)) {
                resultados.push({
                    mes: key,
                    tipo: 'Ingreso',
                    descripcion: ing.nombre,
                    valor: ing.valor
                });
            }
        });

        // Buscar en grupos
        mes.grupos.forEach(grupo => {
            if (grupo.tipo === 'libre') {
                grupo.items.forEach(item => {
                    if (item.descripcion.toLowerCase().includes(termino)) {
                        resultados.push({
                            mes: key,
                            tipo: grupo.nombre,
                            descripcion: item.descripcion,
                            valor: item.valor,
                            fecha: item.fecha
                        });
                    }
                });
            }
        });

        // Buscar en notas
        if (mes.notas && mes.notas.toLowerCase().includes(termino)) {
            resultados.push({
                mes: key,
                tipo: 'Nota',
                descripcion: mes.notas.substring(0, 100) + '...',
                valor: 0
            });
        }
    });

    if (resultados.length > 0) {
        html += '<div class="tarjeta">';
        html += `<h3>Resultados (${resultados.length})</h3>`;
        resultados.forEach(r => {
            html += '<div class="item">';
            html += `<div class="item-header">`;
            html += `<span class="item-nombre">${r.descripcion}</span>`;
            if (r.valor > 0) {
                html += `<span class="item-valor">${formatearPesos(r.valor)}</span>`;
            }
            html += `</div>`;
            html += `<div class="texto-pequeno">${obtenerNombreMes(r.mes)} - ${r.tipo}`;
            if (r.fecha) html += ` - ${r.fecha}`;
            html += `</div>`;
            html += '</div>';
        });
        html += '</div>';
    } else {
        html += '<div class="tarjeta texto-centro">';
        html += '<p>No se encontraron resultados</p>';
        html += '</div>';
    }

    contenedor.innerHTML = html;
}

function verDetalleMes(key) {
    const mes = estado.meses[key];
    const modal = document.getElementById('modal-detalle-mes');
    const contenido = document.getElementById('contenido-detalle-mes');

    document.getElementById('modal-detalle-titulo').textContent = obtenerNombreMes(key);

    let html = '';

    // Ingresos
    html += '<h3>Ingresos</h3>';
    if (mes.ingresos.length > 0) {
        mes.ingresos.forEach(ing => {
            html += `<div class="resumen-item"><span>${ing.nombre}</span><span>${formatearPesos(ing.valor)}</span></div>`;
        });
    } else {
        html += '<p>Sin ingresos</p>';
    }

    // Grupos
    html += '<h3 class="mt-20">Gastos por Grupo</h3>';
    mes.grupos.forEach(grupo => {
        const gastado = calcularGastadoGrupo(grupo);
        html += `<div class="resumen-item"><span>${grupo.nombre}</span><span>${formatearPesos(gastado)}</span></div>`;
    });

    contenido.innerHTML = html;
    modal.classList.add('activo');
}

function cerrarModalDetalleMes() {
    document.getElementById('modal-detalle-mes').classList.remove('activo');
}

function cerrarMesActual() {
    if (!confirm('¿Estás segura de cerrar este mes? Esta acción no se puede deshacer.')) {
        return;
    }

    const mes = obtenerMesActual();
    mes.cerrado = true;

    // Crear nuevo mes
    const nuevaFecha = new Date();
    nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
    const nuevoKey = `${nuevaFecha.getFullYear()}-${String(nuevaFecha.getMonth() + 1).padStart(2, '0')}`;

    estado.mesActual = nuevoKey;

    // Usar crearNuevoMes que copia presupuestos y referencias automáticamente
    crearNuevoMes();

    guardarDatos();
    alert('Mes cerrado. Se ha iniciado un nuevo mes.');
    cambiarSeccion('inicio');
}

// ============================================
// SECCIÓN: AJUSTES
// ============================================

function renderizarAjustes() {
    const contenedor = document.getElementById('contenido-ajustes');

    let html = '';

    // Cambiar nombre
    html += '<div class="tarjeta">';
    html += '<h2>Nombre de usuario</h2>';
    html += `<input type="text" id="ajuste-nombre" value="${estado.nombreUsuario}">`;
    html += '<button onclick="guardarNombre()">Guardar Nombre</button>';
    html += '</div>';

    // Editar presupuestos
    html += '<div class="tarjeta">';
    html += '<h2>Presupuestos</h2>';
    const mes = obtenerMesActual();
    mes.grupos.forEach((grupo, index) => {
        html += '<div class="form-group">';
        html += `<label>${grupo.nombre}:</label>`;
        html += `<input type="text" inputmode="numeric" value="${formatearPesos(grupo.presupuesto)}"
                        onchange="actualizarPresupuesto(${index}, this.value)">`;
        html += '</div>';
    });
    html += '</div>';

    // Detalles de pago de servicios fijos
    html += '<div class="tarjeta">';
    html += '<h2>Detalles de pago (Servicios fijos)</h2>';
    html += '<p class="texto-pequeno mb-20">Configura cómo se paga cada servicio. Esta información se mantendrá en todos los meses.</p>';

    mes.grupos.forEach((grupo, grupoIndex) => {
        if (grupo.tipo === 'fijo') {
            html += `<h3 class="mt-20">${grupo.nombre}</h3>`;
            grupo.items.forEach((item, itemIndex) => {
                html += `<div class="item" style="margin-bottom: 15px;">`;
                html += `<strong>${item.nombre}</strong>`;
                html += `<button class="secundario pequeno" onclick="editarDetallesServicio('${grupo.nombre}', '${item.nombre}')">✏️ Editar</button>`;

                const detalles = obtenerDetallesPago(grupo.nombre, item.nombre);
                if (detalles.detallesPago || detalles.referencia) {
                    if (detalles.detallesPago) {
                        html += `<div class="texto-pequeno mt-20">💳 ${detalles.detallesPago}</div>`;
                    }
                    if (detalles.referencia) {
                        html += `<div class="texto-pequeno">📋 ${detalles.referencia}</div>`;
                    }
                } else {
                    html += `<div class="texto-pequeno mt-20" style="color: var(--gris-oscuro);">Sin configurar</div>`;
                }

                html += `</div>`;
            });
        }
    });
    html += '</div>';

    // Backup y restauración
    html += '<div class="tarjeta">';
    html += '<h2>Respaldo de datos</h2>';
    html += '<p>Descarga todos tus datos para guardarlos en un lugar seguro.</p>';
    html += '<button onclick="descargarBackup()">Descargar Respaldo</button>';
    html += '<button class="secundario mt-20" onclick="document.getElementById(\'input-restaurar\').click()">Restaurar Respaldo</button>';
    html += '<input type="file" id="input-restaurar" accept=".json" style="display:none" onchange="restaurarBackup(event)">';
    html += '</div>';

    contenedor.innerHTML = html;
}

function guardarNombre() {
    const nombre = document.getElementById('ajuste-nombre').value.trim();
    if (nombre) {
        estado.nombreUsuario = nombre;
        guardarDatos();
        document.getElementById('header-saludo').textContent = `Hola ${nombre} 👋`;
        alert('Nombre actualizado');
    }
}

function actualizarPresupuesto(grupoIndex, valor) {
    const mes = obtenerMesActual();
    mes.grupos[grupoIndex].presupuesto = parsearPesos(valor);
    guardarDatos();
}

function descargarBackup() {
    const dataStr = JSON.stringify(estado, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `presupuesto-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('Respaldo descargado');
}

function restaurarBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('¿Restaurar respaldo? Esto reemplazará todos los datos actuales.')) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const datos = JSON.parse(e.target.result);
            estado = datos;
            guardarDatos();
            alert('Respaldo restaurado con éxito');
            location.reload();
        } catch (error) {
            alert('Error al restaurar. Archivo inválido.');
        }
    };
    reader.readAsText(file);
}

// ============================================
// CALCULADORA
// ============================================

let calculadoraEstado = {
    valorActual: '0',
    operacion: null,
    valorAnterior: null
};

function toggleCalculadora() {
    const modal = document.getElementById('modal-calculadora');
    modal.classList.toggle('activa');
    if (modal.classList.contains('activa')) {
        calculadoraEstado = { valorActual: '0', operacion: null, valorAnterior: null };
        actualizarDisplayCalculadora();
    }
}

function clickCalculadora(valor) {
    if (valor === 'C') {
        calculadoraEstado = { valorActual: '0', operacion: null, valorAnterior: null };
    } else if (valor === '=') {
        if (calculadoraEstado.operacion && calculadoraEstado.valorAnterior !== null) {
            const a = parseFloat(calculadoraEstado.valorAnterior);
            const b = parseFloat(calculadoraEstado.valorActual);
            let resultado = 0;

            switch(calculadoraEstado.operacion) {
                case '+': resultado = a + b; break;
                case '-': resultado = a - b; break;
                case '*': resultado = a * b; break;
                case '/': resultado = b !== 0 ? a / b : 0; break;
            }

            calculadoraEstado.valorActual = String(resultado);
            calculadoraEstado.operacion = null;
            calculadoraEstado.valorAnterior = null;
        }
    } else if (['+', '-', '*', '/'].includes(valor)) {
        if (calculadoraEstado.operacion && calculadoraEstado.valorAnterior !== null) {
            clickCalculadora('=');
        }
        calculadoraEstado.operacion = valor;
        calculadoraEstado.valorAnterior = calculadoraEstado.valorActual;
        calculadoraEstado.valorActual = '0';
    } else {
        if (calculadoraEstado.valorActual === '0') {
            calculadoraEstado.valorActual = valor;
        } else {
            calculadoraEstado.valorActual += valor;
        }
    }

    actualizarDisplayCalculadora();
}

function actualizarDisplayCalculadora() {
    const display = document.getElementById('calc-display');
    const valor = parseFloat(calculadoraEstado.valorActual);
    display.textContent = formatearPesos(valor);
}

// ============================================
// CONFIGURACIÓN INICIAL
// ============================================

function mostrarConfiguracionInicial() {
    const modal = document.getElementById('modal-config-inicial');
    const contenido = document.getElementById('contenido-config-inicial');

    let html = '<p style="margin-bottom: 20px;">Configura los presupuestos mensuales para cada grupo. Estos valores se mantendrán mes a mes.</p>';

    html += '<div class="lista-items">';

    CONFIG.gruposIniciales.forEach((grupo, index) => {
        html += '<div class="form-group">';
        html += `<label>${grupo.nombre}:</label>`;
        html += `<input type="text" id="config-grupo-${index}" inputmode="numeric" placeholder="$0">`;
        html += '</div>';
    });

    html += '</div>';
    html += '<button onclick="guardarConfiguracionInicial()">Comenzar a usar la app</button>';

    contenido.innerHTML = html;
    modal.classList.add('activo');
}

function guardarConfiguracionInicial() {
    const mes = obtenerMesActual();

    // Actualizar presupuestos del mes actual
    CONFIG.gruposIniciales.forEach((grupo, index) => {
        const input = document.getElementById(`config-grupo-${index}`);
        const valor = parsearPesos(input.value);
        mes.grupos[index].presupuesto = valor;
    });

    estado.configurado = true;
    guardarDatos();

    document.getElementById('modal-config-inicial').classList.remove('activo');
    renderizarInicio();
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Registrar service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado'))
            .catch(err => console.log('Error al registrar SW:', err));
    }

    // Cargar datos
    cargarDatos();

    // Actualizar header
    document.getElementById('header-saludo').textContent = `Hola ${estado.nombreUsuario} 👋`;
    document.getElementById('header-mes').textContent = obtenerNombreMes(estado.mesActual);

    // Configurar navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const seccion = this.dataset.seccion;
            cambiarSeccion(seccion);
        });
    });

    // Verificar si está configurado
    if (!estado.configurado) {
        mostrarConfiguracionInicial();
    } else {
        // Mostrar sección inicial
        cambiarSeccion('inicio');
    }

    // Eventos de modales
    document.getElementById('modal-calculadora').addEventListener('click', function(e) {
        if (e.target === this) {
            toggleCalculadora();
        }
    });
});
