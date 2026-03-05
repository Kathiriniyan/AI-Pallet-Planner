import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { getLastPlan } from '../api/packApi';

export default function Pallet3DPage() {
    const navigate = useNavigate();
    const mountRef = useRef(null);
    const [legendOpen, setLegendOpen] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [codes, setCodes] = useState([]);
    const [codeColors, setCodeColors] = useState({});
    const [planData, setPlanData] = useState(null);

    useEffect(() => {
        let plan = null;
        let reqId = null;

        const initThree = async () => {
            try {
                plan = await getLastPlan();
            } catch (err) {
                try {
                    plan = JSON.parse(localStorage.getItem('lastPlan'));
                } catch (e) {
                    plan = null;
                }
            }

            if (!plan || !plan.container || !plan.pallets || plan.pallets.length === 0) {
                // Fallback to old schema if layers array is at root (not wrapped in pallets array)
                if (plan && plan.layers) {
                    plan.pallets = [{ palletId: "P1", usedHeightCm: plan.layers.reduce((s, l) => s + l.height, 0), layers: plan.layers }];
                } else {
                    setErrorMsg('No valid packing plan found. Please generate one first.');
                    return;
                }
            }
            setPlanData(plan);

            const canvasWidth = window.innerWidth;
            const canvasHeight = window.innerHeight;

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf6f7fb);

            const camera = new THREE.PerspectiveCamera(55, canvasWidth / canvasHeight, 0.1, 100000);
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setSize(canvasWidth, canvasHeight);

            if (mountRef.current) {
                mountRef.current.innerHTML = '';
                mountRef.current.appendChild(renderer.domElement);
            }

            const controls = new OrbitControls(camera, renderer.domElement);

            const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
            keyLight.position.set(1, 2, 1);
            scene.add(keyLight);
            scene.add(new THREE.AmbientLight(0xffffff, 0.6));

            const { widthCm: W, lengthCm: L, heightCm: H } = plan.container;

            // Calculate codes and colors
            const uniqueCodes = [];
            plan.pallets.forEach(pallet => {
                pallet.layers.forEach(ly => {
                    ly.placements.forEach(p => {
                        const code = p.code || p.item_code;
                        if (!uniqueCodes.includes(code)) uniqueCodes.push(code);
                    });
                });
            });
            setCodes(uniqueCodes);

            const newCodeColors = {};
            uniqueCodes.forEach((code, i) => {
                const hue = (i * 360 / Math.max(uniqueCodes.length, 1)) % 360;
                const color = new THREE.Color();
                color.setHSL(hue / 360, 0.65, 0.58);
                newCodeColors[code] = { hex: color.getHexString(), hsl: `hsl(${hue}, 65%, 58%)` };
            });
            setCodeColors(newCodeColors);

            let maxUsedHeight = 0;

            plan.pallets.forEach((pallet, palletIndex) => {
                const offsetX = palletIndex * (W + 200); // 200cm spacing

                const grid = new THREE.GridHelper(Math.max(W, L) + 50, 20);
                grid.position.set(offsetX + W / 2, 0, L / 2);
                scene.add(grid);

                if (W && L && H) {
                    const g = new THREE.BoxGeometry(W, H, L);
                    const e = new THREE.EdgesGeometry(g);
                    const m = new THREE.LineBasicMaterial({ color: 0x222222 });
                    const wire = new THREE.LineSegments(e, m);
                    wire.position.set(offsetX + W / 2, H / 2, L / 2);
                    scene.add(wire);
                }

                let currentY = 0;
                pallet.layers.forEach((layer) => {
                    layer.placements.forEach(p => {
                        const { width, length, height } = p.size;
                        const code = p.code || p.item_code;
                        const geom = new THREE.BoxGeometry(width, height, length);
                        const mat = new THREE.MeshLambertMaterial({
                            color: parseInt(newCodeColors[code].hex, 16),
                            transparent: true,
                            opacity: 0.92
                        });
                        const mesh = new THREE.Mesh(geom, mat);
                        mesh.position.set(offsetX + p.pos.x + width / 2, currentY + height / 2, p.pos.y + length / 2);
                        mesh.userData = {
                            label: `${p.name || code}\n${width}×${length}×${height} cm • ${p.pos.orientation}\nPallet: ${pallet.palletId}`
                        };
                        scene.add(mesh);

                        const edges = new THREE.EdgesGeometry(geom);
                        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 1 }));
                        line.position.copy(mesh.position);
                        scene.add(line);
                    });
                    currentY += layer.height;
                });

                maxUsedHeight = Math.max(maxUsedHeight, currentY);
            });

            // Camera target across all pallets
            const totalWidth = plan.pallets.length * (W + 200);
            camera.position.set(-W * 0.9, Math.max(maxUsedHeight, H) * 1.2 + 150, -L * 0.9);
            controls.target.set(totalWidth / 2, Math.max(maxUsedHeight, 1) / 2, L / 2);
            controls.update();

            const tooltip = document.createElement('div');
            Object.assign(tooltip.style, {
                position: 'absolute', padding: '6px 8px', background: 'rgba(0,0,0,.75)', color: '#fff',
                borderRadius: '6px', font: '12px system-ui', pointerEvents: 'none', transform: 'translate(8px, -8px)',
                whiteSpace: 'pre', display: 'none', zIndex: 100
            });
            document.body.appendChild(tooltip);

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();

            const onMove = (ev) => {
                mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(scene.children, false);
                const first = intersects.find(i => i.object.isMesh && i.object.userData && i.object.userData.label);

                if (first) {
                    tooltip.style.left = ev.clientX + 'px';
                    tooltip.style.top = ev.clientY + 'px';
                    tooltip.textContent = first.object.userData.label;
                    tooltip.style.display = 'block';
                } else {
                    tooltip.style.display = 'none';
                }
            };

            window.addEventListener('mousemove', onMove);

            const animate = () => {
                reqId = requestAnimationFrame(animate);
                renderer.render(scene, camera);
            };
            animate();

            const handleResize = () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', handleResize);

            // Cleanup
            plan._cleanup = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('resize', handleResize);
                if (reqId) cancelAnimationFrame(reqId);
                if (tooltip && tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
                if (mountRef.current) {
                    mountRef.current.innerHTML = '';
                }
                renderer.dispose();
            };
        };

        initThree();

        return () => {
            // Using the attached cleanup method closure
            const activePlan = plan;
            if (activePlan && activePlan._cleanup) {
                activePlan._cleanup();
            }
        };
    }, []);

    if (errorMsg) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
                <h1 className="text-2xl text-red-600 font-bold mb-4">Error</h1>
                <p className="text-gray-700">{errorMsg}</p>
                <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Go Back</button>
            </div>
        );
    }

    return (
        <div className="relative w-screen h-screen overflow-hidden">
            <div ref={mountRef} className="absolute inset-0 z-0"></div>

            {/* HUD overlays */}
            <button
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 z-10 px-4 py-2 bg-white/90 shadow-md rounded-lg font-semibold text-gray-700 hover:text-indigo-600 transition"
            >
                &larr; Back
            </button>

            {legendOpen && codes.length > 0 && (
                <div className="absolute top-4 right-4 z-10 bg-white/90 p-4 rounded-lg shadow-xl text-sm border border-gray-200 min-w-[200px]">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b">
                        <h3 className="font-bold text-gray-700">Legend</h3>
                        <button onClick={() => setLegendOpen(false)} className="text-gray-400 hover:text-red-500">×</button>
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto space-y-2">
                        {codes.map(code => (
                            <div key={code} className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-sm border border-gray-600" style={{ background: codeColors[code]?.hsl }}></span>
                                <span className="truncate">{code}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!legendOpen && codes.length > 0 && (
                <button
                    onClick={() => setLegendOpen(true)}
                    className="absolute top-4 right-4 z-10 px-3 py-1 bg-white/90 shadow-md rounded-lg text-sm font-semibold text-gray-700 border"
                >
                    Show Legend
                </button>
            )}

            {planData && planData.pallets && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 p-3 rounded-lg shadow-md text-sm border border-gray-200 flex gap-4">
                    {planData.pallets.map(p => (
                        <div key={p.palletId} className="flex flex-col items-center">
                            <span className="font-bold text-gray-700">{p.palletId}</span>
                            <span className="text-gray-600">{(p.utilization ? p.utilization * 100 : 0).toFixed(1)}% Utilized</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-10 bg-white/90 px-3 py-2 rounded-lg shadow-md text-xs font-medium text-gray-700 border border-gray-200">
                Drag = rotate &nbsp;•&nbsp; Scroll = zoom &nbsp;•&nbsp; Right-drag = pan
            </div>
        </div>
    );
}
