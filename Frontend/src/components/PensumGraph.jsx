import { useState, useMemo, useEffect, useRef } from 'react';
import { X, Save, CheckCircle2, Lock, Unlock, Award, ArrowRight, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NODE_RADIUS = 24;

const PensumGraph = ({ pensum, aprobados, onSaveSingleCourse, aprobadosData = [] }) => {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [scale, setScale] = useState(0.7);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [graphData, setGraphData] = useState({ nodes: [], edges: [] });

    // Controls
    const [modalNota, setModalNota] = useState("");
    const [modalAprobado, setModalAprobado] = useState(false);
    const [guardando, setGuardando] = useState(false);

    // Initial load & Simulation
    useEffect(() => {
        if (!pensum.length) return;

        // 1. Prepare Nodes & Edges
        const rawNodes = pensum.map(p => ({
            ...p,
            id: p.codigo,
            x: 400 + (Math.random() - 0.5) * 50,
            y: 300 + (Math.random() - 0.5) * 50,
            vx: 0, vy: 0
        }));

        const rawEdges = [];
        const nodeMap = {};
        rawNodes.forEach(n => nodeMap[n.codigo] = n);

        rawNodes.forEach(node => {
            if (!node.pre_requisitos) return;
            const prereqs = node.pre_requisitos.replaceAll('"', "").split(",").map(r => r.trim());
            prereqs.forEach(reqCode => {
                const target = nodeMap[reqCode];
                if (target) {
                    rawEdges.push({ source: target, target: node, id: `${target.codigo}-${node.codigo}` });
                }
            });
        });

        // 2. Run Simulation
        const TICKS = 300;
        const REPULSION = 6000;
        const SPRING_LEN = 80;
        const SPRING_K = 0.08;
        const DAMPING = 0.8;
        const CENTER_K = 0.02;

        for (let i = 0; i < TICKS; i++) {
            // Repulsion
            for (let a = 0; a < rawNodes.length; a++) {
                const nodeA = rawNodes[a];
                for (let b = a + 1; b < rawNodes.length; b++) {
                    const nodeB = rawNodes[b];
                    const dx = nodeA.x - nodeB.x;
                    const dy = nodeA.y - nodeB.y;
                    const distSq = dx * dx + dy * dy || 1;
                    const force = REPULSION / Math.sqrt(distSq);
                    const fx = (dx / Math.sqrt(distSq)) * force;
                    const fy = (dy / Math.sqrt(distSq)) * force;

                    if (distSq < 40000) {
                        nodeA.vx += fx;
                        nodeA.vy += fy;
                        nodeB.vx -= fx;
                        nodeB.vy -= fy;
                    }
                }
            }

            // Springs
            rawEdges.forEach(edge => {
                const dx = edge.target.x - edge.source.x;
                const dy = edge.target.y - edge.source.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = (dist - SPRING_LEN) * SPRING_K;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                edge.source.vx += fx;
                edge.source.vy += fy;
                edge.target.vx -= fx;
                edge.target.vy -= fy;
            });

            // Center Gravity
            rawNodes.forEach(node => {
                node.vx += (400 - node.x) * CENTER_K;
                node.vy += (300 - node.y) * CENTER_K;
                node.x += node.vx;
                node.y += node.vy;
                node.vx *= DAMPING;
                node.vy *= DAMPING;
            });
        }

        // 3. Normalize
        const minX = Math.min(...rawNodes.map(n => n.x));
        const maxX = Math.max(...rawNodes.map(n => n.x));
        const minY = Math.min(...rawNodes.map(n => n.y));
        const maxY = Math.max(...rawNodes.map(n => n.y));
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;

        const finalNodes = rawNodes.map(n => ({
            ...n,
            x: n.x - cx + 400,
            y: n.y - cy + 300
        }));

        setGraphData({ nodes: finalNodes, edges: rawEdges.map(e => ({ ...e, source: finalNodes.find(n => n.id === e.source.id), target: finalNodes.find(n => n.id === e.target.id) })) });
        setOffset({ x: 0, y: 0 });

    }, [pensum]);

    // Helpers
    const datosAprobadosMap = useMemo(() => {
        const map = {};
        aprobadosData.forEach(c => { map[c.codigo] = c; });
        return map;
    }, [aprobadosData]);

    const getEstado = (codigo, prereqsString) => {
        if (aprobados.includes(codigo)) return 'ganado';
        if (!prereqsString || prereqsString === 'Ninguno') return 'disponible';
        const prereqs = prereqsString.replaceAll('"', "").split(",").map(r => r.trim());
        return prereqs.every(p => aprobados.includes(p)) ? 'disponible' : 'bloqueado';
    };

    const handleNodeClick = (node) => {
        const estado = getEstado(node.codigo, node.pre_requisitos);
        if (estado === 'bloqueado') return; // Bloqueado no editable

        const aprobado = aprobados.includes(node.codigo);
        const data = datosAprobadosMap[node.codigo] || {};
        setSelectedCourse({
            ...node,
            estado,
            habilita: (graphData.nodes || []).filter(n => n.pre_requisitos && n.pre_requisitos.includes(node.codigo))
        });
        setModalAprobado(aprobado);
        setModalNota(data.nota || (aprobado ? 61 : ""));
    };

    const handleGuardar = async () => {
        if (!selectedCourse) return;

        let notaFinal = parseInt(modalNota) || 0;
        if (modalAprobado && notaFinal < 61) {
            // Validación visual o toast podría ir aquí, por ahora no guarda
            return;
        }

        setGuardando(true);
        const cursoPayload = {
            codigo: selectedCourse.codigo,
            nota: modalAprobado ? notaFinal : 0,
            estado_deseado: modalAprobado ? 'ganado' : 'pendiente'
        };

        await onSaveSingleCourse(cursoPayload, modalAprobado);
        setGuardando(false);
        setSelectedCourse(null);
    };

    const handleMouseDown = (e) => { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); };
    const handleMouseMove = (e) => {
        if (isDragging) {
            setOffset(prev => ({ x: prev.x + (e.clientX - dragStart.x), y: prev.y + (e.clientY - dragStart.y) }));
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    // Background Pattern
    const backgroundPattern = (
        <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
            </pattern>
        </defs>
    );

    const isValidGrade = !modalAprobado || (parseInt(modalNota) >= 61 && parseInt(modalNota) <= 100);

    return (
        <div className="w-full h-full relative overflow-hidden bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl select-none cursor-grab active:cursor-grabbing"
            onWheel={(e) => { e.preventDefault(); setScale(s => Math.min(Math.max(0.1, s * (e.deltaY > 0 ? 0.9 : 1.1)), 4)); }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
        >
            {/* Glassmorphism Background Decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-300/20 rounded-full blur-[80px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[30%] left-[40%] w-[20%] h-[20%] bg-pink-300/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 right-6 z-10 flex gap-2">
                <button onClick={() => setScale(s => Math.min(s + 0.1, 4))} className="p-2 bg-white rounded-lg shadow border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold">+</button>
                <button onClick={() => setScale(s => Math.max(s - 0.1, 0.1))} className="p-2 bg-white rounded-lg shadow border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold">-</button>
                <button onClick={() => { setScale(0.7); setOffset({ x: 0, y: 0 }); }} className="px-3 py-2 bg-white rounded-lg shadow border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold">Reset</button>
            </div>

            <motion.div
                className="w-full h-full origin-center"
                style={{ x: offset.x, y: offset.y, scale }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <svg width="100%" height="100%" viewBox="0 0 800 600" className="overflow-visible">
                    {backgroundPattern}

                    <AnimatePresence>
                        {graphData.edges.map((edge) => {
                            if (!edge.source || !edge.target) return null;
                            const isSourceGanado = aprobados.includes(edge.source.codigo);
                            const isTargetGanado = aprobados.includes(edge.target.codigo);
                            const isHighlighted = hoveredNode && (hoveredNode === edge.source.id || hoveredNode === edge.target.id);

                            let strokeColor = "#cbd5e1";
                            if (isSourceGanado && isTargetGanado) strokeColor = "#10b981";
                            else if (isSourceGanado) strokeColor = "#38bdf8";

                            const strokeWidth = isHighlighted ? 2.5 : (isSourceGanado ? 1.5 : 0.8);
                            const opacity = hoveredNode ? (isHighlighted ? 1 : 0.1) : 0.6;

                            return (
                                <motion.line
                                    key={edge.id}
                                    x1={edge.source.x} y1={edge.source.y}
                                    x2={edge.target.x} y2={edge.target.y}
                                    stroke={strokeColor}
                                    strokeWidth={strokeWidth}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity }}
                                    transition={{ duration: 0.5 }}
                                />
                            );
                        })}
                    </AnimatePresence>

                    {graphData.nodes.map((node) => {
                        const estado = getEstado(node.codigo, node.pre_requisitos);
                        const isHovered = hoveredNode === node.id;
                        const isDimmed = hoveredNode && !isHovered &&
                            !graphData.edges.some(e => (e.source.id === node.id && e.target.id === hoveredNode) || (e.target.id === node.id && e.source.id === hoveredNode));

                        let colors = { fill: "#fff", stroke: "#cbd5e1", text: "#64748b" };
                        if (estado === 'ganado') colors = { fill: "#ecfdf5", stroke: "#10b981", text: "#059669" };
                        else if (estado === 'disponible') colors = { fill: "#f0f9ff", stroke: "#38bdf8", text: "#0284c7" };
                        else colors = { fill: "#fff1f2", stroke: "#fda4af", text: "#e11d48" };

                        return (
                            <motion.g
                                key={node.id}
                                onClick={(e) => { e.stopPropagation(); handleNodeClick(node); }}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                initial={{ scale: 0, opacity: 0, x: 400, y: 300 }}
                                animate={{
                                    x: node.x, y: node.y,
                                    scale: isHovered ? 1.2 : 1,
                                    opacity: isDimmed ? 0.1 : 1
                                }}
                                transition={{ duration: 0.8, type: "spring" }}
                                className={`cursor-pointer ${estado === 'bloqueado' ? 'cursor-not-allowed opacity-80' : ''}`}
                            >
                                <circle cx={0} cy={0} r={NODE_RADIUS} fill={colors.fill} stroke={colors.stroke} strokeWidth={estado === 'disponible' ? 3 : 1.5} />
                                <foreignObject x={-14} y={-14} width={28} height={28} className="pointer-events-none">
                                    <div className={`flex items-center justify-center w-full h-full ${estado === 'ganado' ? 'text-emerald-500' : estado === 'disponible' ? 'text-sky-500 font-bold text-[10px]' : 'text-rose-300'}`}>
                                        {estado === 'ganado' ? <CheckCircle2 size={18} /> :
                                            estado === 'disponible' ? node.codigo :
                                                <Lock size={14} />}
                                    </div>
                                </foreignObject>
                                {isHovered && (
                                    <text x={0} y={-NODE_RADIUS - 8} textAnchor="middle" className="text-[10px] font-bold fill-slate-700 bg-white px-1" style={{ textShadow: "0px 0px 4px white" }}>
                                        {node.nombre_completo.substring(0, 25)}
                                    </text>
                                )}
                            </motion.g>
                        );
                    })}
                </svg>
            </motion.div>

            {/* Centered Modal Overlay */}
            <AnimatePresence>
                {selectedCourse && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
                        onClick={() => setSelectedCourse(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative border border-white/20 dark:border-slate-700/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={() => setSelectedCourse(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={20} />
                            </button>

                            <div className="p-6 pb-2">
                                {/* Header Tags */}
                                <div className="flex gap-2 mb-3">
                                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">Code: {selectedCourse.codigo}</span>
                                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[9px] uppercase font-black px-2 py-0.5 rounded shadow-sm">Semestre {selectedCourse.semestre}</span>
                                </div>

                                {/* Title */}
                                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 leading-tight pr-6">
                                    {selectedCourse.nombre_completo}
                                </h2>

                                {/* Toggle switch Compact */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-2.5 flex items-center justify-between mb-3 shadow-inner">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${modalAprobado ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'}`}>
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <span className="font-bold text-slate-600 dark:text-slate-300 text-xs">¿Curso Aprobado?</span>
                                    </div>
                                    <div
                                        onClick={() => setModalAprobado(!modalAprobado)}
                                        className={`w-10 h-6 rounded-full p-0.5 cursor-pointer transition-colors relative shadow-inner ${modalAprobado ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <motion.div
                                            className="w-5 h-5 bg-white rounded-full shadow-md absolute top-0.5"
                                            animate={{ left: modalAprobado ? 18 : 2 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    </div>
                                </div>

                                {/* Nota Input */}
                                <AnimatePresence>
                                    <motion.div
                                        initial={false}
                                        animate={{ height: modalAprobado ? "auto" : 0, opacity: modalAprobado ? 1 : 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mb-1 text-[9px] font-bold text-slate-400 uppercase tracking-wide px-1">Nota Final (61-100)</div>
                                        <div className="relative mb-4">
                                            <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="number"
                                                value={modalNota}
                                                onChange={(e) => setModalNota(e.target.value)}
                                                className="w-full bg-white dark:!bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-3 font-bold text-sm text-slate-700 dark:text-slate-100 focus:border-emerald-400 dark:focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500 shadow-sm"
                                                placeholder="0"
                                            />
                                        </div>
                                    </motion.div>
                                </AnimatePresence>

                                {/* Save Button Compact */}
                                <button
                                    onClick={handleGuardar}
                                    disabled={guardando || !isValidGrade}
                                    className={`w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95
                                            ${isValidGrade ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-800/60' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200 dark:bg-slate-800 dark:text-slate-600 dark:border-slate-700'}
                                        `}
                                >
                                    {guardando ? 'Guardando...' : (
                                        <>
                                            <Save size={16} /> Guardar Progreso
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Dependencies List Scrollable */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-100 dark:border-slate-700/50">
                                <h4 className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 mb-2 tracking-wider">
                                    <ArrowRight size={12} /> Habilita {selectedCourse.habilita?.length || 0} cursos
                                </h4>
                                <div className="flex flex-col gap-2 pr-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                                    {selectedCourse.habilita && selectedCourse.habilita.length > 0 ? (
                                        selectedCourse.habilita.map(h => (
                                            <div key={h.codigo} className="bg-sky-50/50 dark:bg-sky-900/10 p-2 rounded-lg border border-sky-100 dark:border-sky-800/30 shadow-sm flex flex-col gap-0.5 shrink-0">
                                                <div className="font-bold text-slate-700 dark:text-slate-200 text-xs">{h.nombre_completo}</div>
                                                <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold flex gap-2 uppercase">
                                                    <span>{h.codigo}</span>
                                                    <span>•</span>
                                                    <span>Semestre {h.semestre}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-slate-400 dark:text-slate-600 text-[10px] italic">No habilita otros cursos directos.</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PensumGraph;
