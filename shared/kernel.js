// HospitFlow / MedTrack - Central Data Kernel (Shared State)
const SystemKernel = {
    channel: new BroadcastChannel('hospiflow_medtrack_sync'),

    state: {
        pacientes: [
            { id: 'HC-882910', nombre: 'Carlos Mendoza', triaje: 'Rojo', cama: 'Cama 101', estado: 'Hospitalizado', diagnostico: 'Infarto Agudo', insumos: ['Nitroglicerina', 'Cánula O2'] },
            { id: 'HC-442109', nombre: 'María Rodríguez', triaje: 'Amarillo', cama: 'Cama 102', estado: 'Admisión', diagnostico: 'Apendicitis Aguda', insumos: ['Solución Fisiológica'] }
        ],
        quirofanos: [
            { id: 'Q-01', nombre: 'Quirófano Central', estado: 'Ocupado', paciente: 'Carlos Mendoza', cirujano: 'Dr. Silva' },
            { id: 'Q-02', nombre: 'Quirófano Emergencias', estado: 'Disponible', paciente: null, cirujano: null }
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
                const parsed = JSON.parse(localData);
                // Asegurar que existan todas las propiedades clave
                if (parsed.pacientes && parsed.personal) {
                    this.state = parsed;
                }
            } catch (e) {
                this.save();
            }
        } else {
            this.save();
        }

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

    darDeAltaPaciente(pacienteId) {
        const p = this.state.pacientes.find(x => x.id === pacienteId);
        if (p) {
            p.estado = 'Alta Médica';
            p.cama = 'Ninguna (Liberada)';
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
    }
};

SystemKernel.init();
