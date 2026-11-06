// HospitFlow / MedTrack - Central Data Kernel (Shared State)
const SystemKernel = {
    channel: new BroadcastChannel('hospiflow_medtrack_sync'),

    state: {
        pacientes: [
            { id: 'HC-882910', nombre: 'Carlos Mendoza', triaje: 'Rojo', cama: 'Cama 101', estado: 'Hospitalizado', diagnostico: 'Infarto Agudo', notas: ['Paciente estable tras reanimación inicial.'], insumos: ['Nitroglicerina'] },
            { id: 'HC-442109', nombre: 'María Rodríguez', triaje: 'Amarillo', cama: 'Cama 102', estado: 'Admisión', diagnostico: 'Apendicitis Aguda', notas: ['En espera de valoración quirúrgica.'], insumos: ['Solución Fisiológica'] }
        ],
        quirofanos: [
            { id: 'Q-01', nombre: 'Quirófano Central', estado: 'Ocupado', paciente: 'Carlos Mendoza', cirujano: 'Dr. Silva' }
        ],
        personal: [
            { id: 1, nombre: 'Dr. Alejandro Silva', rol: 'Médico Urgencias', horario: '08:00 - 16:00', disponibilidad: 'En Cirugía' },
            { id: 2, nombre: 'Dra. Sofía Benítez', rol: 'Pediatra', horario: '14:00 - 22:00', disponibilidad: 'Disponible' }
        ]
    },

    init() {
        const localData = localStorage.getItem('hospiflow_state');
        if (localData) {
            try {
                this.state = JSON.parse(localData);
            } catch (e) {
                this.save();
            }
        } else {
            this.save();
        }

        // Verificar automáticamente horarios al iniciar y cada minuto
        this.verificarHorariosPersonal();
        setInterval(() => this.verificarHorariosPersonal(), 60000);

        this.channel.onmessage = (event) => {
            if (event.data.type === 'STATE_UPDATE') {
                this.state = event.data.state;
                window.dispatchEvent(new CustomEvent('kernelUpdated', { detail: this.state }));
            }
        };
    },

    save() {
        localStorage.setItem('hospiflow_state', JSON.stringify(this.state));
        this.channel.postMessage({ type: 'STATE_UPDATE', state: this.state });
        window.dispatchEvent(new CustomEvent('kernelUpdated', { detail: this.state }));
    },

    actualizarTriaje(pacienteId, nuevoTriaje) {
        const p = this.state.pacientes.find(x => x.id === pacienteId);
        if (p) {
            p.triaje = nuevoTriaje;
            this.save();
        }
    },

    agregarPaciente(nuevoPaciente) {
        this.state.pacientes.push(nuevoPaciente);
        this.save();
    },

    agregarNotaPaciente(pacienteId, nuevaNota) {
        const p = this.state.pacientes.find(x => x.id === pacienteId);
        if (p) {
            if (!p.notas) p.notas = [];
            p.notas.push(nuevaNota);
            this.save();
        }
    },

    agregarTurnoPersonal(nombre, rol, horario, disponibilidad) {
        if (!this.state.personal) this.state.personal = [];
        this.state.personal.push({ id: Date.now(), nombre, rol, horario, disponibilidad });
        this.save();
    },

    actualizarDisponibilidadPersonal(personalId, nuevaDisp) {
        const p = this.state.personal.find(x => x.id === personalId);
        if (p) {
            p.disponibilidad = nuevaDisp;
            this.save();
        }
    },

    removerPersonal(personalId) {
        this.state.personal = this.state.personal.filter(x => x.id !== personalId);
        this.save();
    },

    // Verificador automático basado en reloj del sistema (Hora HH:MM)
    verificarHorariosPersonal() {
        if (!this.state.personal) return;
        const ahora = new Date();
        const horaActual = ahora.getHours().toString().padStart(2, '0') + ':' + ahora.getMinutes().toString().padStart(2, '0');

        let modificado = false;
        this.state.personal.forEach(per => {
            if (per.horario && per.horario.includes('-')) {
                const partes = per.horario.split('-');
                const horaFin = partes[1].trim(); // Extrae la hora de cierre del turno (ej: 16:00)
                
                // Si la hora actual supera la hora de fin del turno, cambia automáticamente a Fuera de Turno
                if (horaActual >= horaFin && per.disponibilidad !== 'Fuera de Turno') {
                    per.disponibilidad = 'Fuera de Turno';
                    modificado = true;
                }
            }
        });

        if (modificado) {
            this.save();
        }
    }
};

SystemKernel.init();

// Añade esta función dentro de SystemKernel en shared/kernel.js
agregarOrdenClinica(pacienteId, nuevaOrden) {
    const p = this.state.pacientes.find(x => x.id === pacienteId);
    if (p) {
        if (!p.ordenes) p.ordenes = [];
        p.ordenes.push(nuevaOrden);
        this.save();
    }
}
