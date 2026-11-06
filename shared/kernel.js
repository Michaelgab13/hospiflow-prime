// HospitFlow / MedTrack - Central Data Kernel (Shared State)
const SystemKernel = {
    channel: new BroadcastChannel('hospiflow_medtrack_sync'),

    // Estado inicial sincronizado
    state: {
        pacientes: [
            { id: 'HC-882910', nombre: 'Carlos Mendoza', triaje: 'Rojo', cama: 'Cama 101', estado: 'Hospitalizado', diagnostico: 'Infarto Agudo', insumos: ['Nitroglicerina', 'Cánula O2'] },
            { id: 'HC-442109', nombre: 'María Rodríguez', triaje: 'Amarillo', cama: 'Cama 102', estado: 'Admisión', diagnostico: 'Apendicitis Aguda', insumos: ['Solución Fisiológica'] }
        ],
        quirofanos: [
            { id: 'Q-01', nombre: 'Quirófano Central', estado: 'Ocupado', paciente: 'Carlos Mendoza', cirujano: 'Dr. Silva' },
            { id: 'Q-02', nombre: 'Quirófano Emergencias', estado: 'Disponible', paciente: null, cirujano: null }
        ]
    },

    init() {
        const localData = localStorage.getItem('hospiflow_state');
        if (localData) {
            this.state = JSON.parse(localData);
        } else {
            this.save();
        }

        // Escuchar cambios desde otras pestañas/módulos
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

    // Métodos dinámicos cruzados
    actualizarTriaje(pacienteId, nuevoTriaje) {
        const p = this.state.pacientes.find(x => x.id === pacienteId);
        if (p) {
            p.triaje = nuevoTriaje;
            this.save();
        }
    },

    asignarQuirofano(quirofanoId, pacienteNombre, cirujano) {
        const q = this.state.quirofanos.find(x => x.id === quirofanoId);
        if (q) {
            q.estado = 'Ocupado';
            q.paciente = pacienteNombre;
            q.cirujano = cirujano;
            this.save();
        }
    }
};

SystemKernel.init();
