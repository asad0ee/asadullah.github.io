// Aether Portfolio - Creative 3D Developer
// Three.js and Interaction Logic

// Simplex 3D Noise GLSL code to be injected in the vertex shader
const simplexNoiseGLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    // Permutations
    i = mod289(i);
    vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // Gradients
    float n_ = 0.142857142857; // 1.0/7.0
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z);  // mod(p,7*7)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // Global Mouse / Interaction State
    // -------------------------------------------------------------
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const hover = { value: 0, targetValue: 0 };
    let scrollProgress = 0;
    
    const browserContainer = document.getElementById('browser-container');
    const scrollContainer = document.getElementById('scroll-container');
    
    // Mouse listener (tracks normalized coordinates between -1 and 1)
    window.addEventListener('mousemove', (e) => {
        mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
        
        // Dynamic background radial gradient parallax displacement
        const bgTranslateX = mouse.targetX * 20; // max 20px translation
        const bgTranslateY = -mouse.targetY * 20;
        document.body.style.setProperty('--bg-transform', `translate(${bgTranslateX}px, ${bgTranslateY}px)`);

        // Check if cursor is inside browser card to increase 3D displacement
        const rect = browserContainer.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
            hover.targetValue = 1.0;
        } else {
            hover.targetValue = 0.0;
        }
    });

    // Track scroll details within browser window
    scrollContainer.addEventListener('scroll', () => {
        const totalHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        if (totalHeight > 0) {
            scrollProgress = scrollContainer.scrollTop / totalHeight;
        }
        
        // Update active class on nav links based on scroll
        const sections = document.querySelectorAll('.content-section');
        let currentSectionId = 'hero';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollContainer.scrollTop >= sectionTop - sectionHeight / 3) {
                currentSectionId = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    // -------------------------------------------------------------
    // Canvas 1: Fullscreen Background (Drifting Stars)
    // -------------------------------------------------------------
    const bgCanvas = document.getElementById('bg-canvas');
    const bgScene = new THREE.Scene();
    const bgCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    bgCamera.position.z = 10;

    const bgRenderer = new THREE.WebGLRenderer({ canvas: bgCanvas, alpha: true, antialias: true });
    bgRenderer.setSize(window.innerWidth, window.innerHeight);
    bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Stars Geometry
    const starsCount = 1500;
    const starsGeometry = new THREE.BufferGeometry();
    const starsPositions = new Float32Array(starsCount * 3);
    const starsColors = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
        // Spread stars randomly
        starsPositions[i] = (Math.random() - 0.5) * 50;
        starsPositions[i + 1] = (Math.random() - 0.5) * 50;
        starsPositions[i + 2] = (Math.random() - 0.5) * 30;

        // Clean white/silver drifting stars
        starsColors[i] = 0.85 + Math.random() * 0.15;    // R
        starsColors[i + 1] = 0.85 + Math.random() * 0.15; // G
        starsColors[i + 2] = 0.9 + Math.random() * 0.1;  // B
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(starsColors, 3));

    // Soft Point Material for Stars
    const starsMaterial = new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
    });

    const starParticles = new THREE.Points(starsGeometry, starsMaterial);
    bgScene.add(starParticles);

    // -------------------------------------------------------------
    // Canvas 2: Interactive 3D Particle Sculpture (Centered)
    // -------------------------------------------------------------
    const sculptureCanvas = document.getElementById('sculpture-canvas');
    const sculptureScene = new THREE.Scene();
    
    // Camera
    const sculptureCamera = new THREE.PerspectiveCamera(
        45, 
        scrollContainer.clientWidth / scrollContainer.clientHeight, 
        0.1, 
        100
    );
    sculptureCamera.position.z = 7;

    const sculptureRenderer = new THREE.WebGLRenderer({ 
        canvas: sculptureCanvas, 
        alpha: true, 
        antialias: true 
    });
    sculptureRenderer.setSize(scrollContainer.clientWidth, scrollContainer.clientHeight);
    sculptureRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Custom Shader Material for Central Particle Sculpture
    const sculptureMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uNoiseStrength: { value: 0.25 },
            uNoiseFrequency: { value: 0.4 },
            uMouseStrength: { value: 0.45 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uHover: { value: 0.0 },
            uColorCyan: { value: new THREE.Color('#007aff') },
            uColorPurple: { value: new THREE.Color('#af52de') }
        },
        vertexShader: `
            uniform float uTime;
            uniform float uNoiseStrength;
            uniform float uNoiseFrequency;
            uniform float uMouseStrength;
            uniform vec2 uMouse;
            uniform float uHover;
            varying float vDisplacement;
            varying vec3 vPosition;

            ${simplexNoiseGLSL}

            void main() {
                vPosition = position;

                // Combine time, noise, and mouse hover interactions
                vec3 noiseInput = position * uNoiseFrequency + vec3(0.0, 0.0, uTime * 0.35);
                float noiseVal = snoise(noiseInput);

                // Displace vertices along normal vector
                // Adding extra displacement when hover is high or mouse coordinates deviate
                float distanceMultiplier = length(uMouse) * uMouseStrength;
                float displacement = noiseVal * (uNoiseStrength + (uHover * 0.2) + distanceMultiplier);

                vDisplacement = displacement;

                vec3 displacedPosition = position + normalize(position) * displacement;
                
                vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
                gl_Position = projectionMatrix * mvPosition;

                // Compute variable point size based on height and distance attenuation
                gl_PointSize = (0.07 + (noiseVal * 0.03)) * (300.0 / -mvPosition.z);
            }
        `,
        fragmentShader: `
            uniform vec3 uColorCyan;
            uniform vec3 uColorPurple;
            varying float vDisplacement;
            varying vec3 vPosition;

            void main() {
                // Render points as soft circular lights
                float dist = length(gl_PointCoord - vec2(0.5, 0.5));
                if (dist > 0.5) discard;

                float alpha = smoothstep(0.5, 0.15, dist);

                // Blend color gradient for Siri/Apple Intelligence look (Cyan, Purple, White sheen)
                float blend1 = clamp((vDisplacement + 0.35) * 1.6 + (vPosition.y * 0.15), 0.0, 1.0);
                float blend2 = clamp(vPosition.x * 0.2 + 0.5, 0.0, 1.0);
                
                vec3 baseColor = mix(uColorCyan, uColorPurple, blend1);
                vec3 finalColor = mix(baseColor, vec3(1.0, 1.0, 1.0), blend2 * 0.3); // silver sheen

                gl_FragColor = vec4(finalColor, alpha * 0.85);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    // Create a dense spherical point cloud manually (18,000 points) for Siri/Apple Intelligence look
    const sculptureGeometry = new THREE.BufferGeometry();
    const particleCount = 18000;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        
        // Randomize radius slightly to create a thick shell (mist look) rather than a paper-thin shell
        const r = 2.0 + (Math.random() - 0.5) * 0.15;
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }
    sculptureGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // We want a particle effect, so create THREE.Points
    const sculpture = new THREE.Points(sculptureGeometry, sculptureMaterial);
    sculptureScene.add(sculpture);

    // Add ambient lighting just in case, though particles use raw shaders
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sculptureScene.add(ambientLight);

    // -------------------------------------------------------------
    // Animation Loop
    // -------------------------------------------------------------
    const clock = new THREE.Clock();

    const animate = () => {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        // 1. Lerp mouse movement for premium smooth easing
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;
        
        hover.value += (hover.targetValue - hover.value) * 0.08;

        // 2. Animate Background Canvas (Drifting stars & slow rotation)
        starParticles.rotation.y = elapsedTime * 0.015;
        starParticles.rotation.x = elapsedTime * 0.005;
        
        // Add subtle mouse offset to stars rotation for deep parallax
        starParticles.position.x = mouse.x * 1.5;
        starParticles.position.y = mouse.y * 1.5;
        
        bgRenderer.render(bgScene, bgCamera);

        // 3. Animate Central Sculpture
        // Base rotation plus cursor follow
        sculpture.rotation.y = mouse.x * 0.6 + elapsedTime * 0.15;
        sculpture.rotation.x = -mouse.y * 0.6 + elapsedTime * 0.08;
        
        // Transition position and size on scroll to keep layout responsive
        // Scale down slightly and move left when scrolling into projects
        const scaleProgress = 1.0 - (scrollProgress * 0.25);
        sculpture.scale.set(scaleProgress, scaleProgress, scaleProgress);
        
        // Move sculpture offset on y axis depending on scroll progress
        sculpture.position.y = -scrollProgress * 1.2;

        // Pass updated values to shaders
        sculptureMaterial.uniforms.uTime.value = elapsedTime;
        sculptureMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);
        sculptureMaterial.uniforms.uHover.value = hover.value;

        sculptureRenderer.render(sculptureScene, sculptureCamera);
    };

    animate();

    // -------------------------------------------------------------
    // Responsive Window Resize Handling
    // -------------------------------------------------------------
    window.addEventListener('resize', () => {
        // Resize Background Canvas
        bgCamera.aspect = window.innerWidth / window.innerHeight;
        bgCamera.updateProjectionMatrix();
        bgRenderer.setSize(window.innerWidth, window.innerHeight);

        // Resize Sculpture Canvas
        const sculptureWidth = scrollContainer.clientWidth;
        const sculptureHeight = scrollContainer.clientHeight;
        
        sculptureCamera.aspect = sculptureWidth / sculptureHeight;
        sculptureCamera.updateProjectionMatrix();
        sculptureRenderer.setSize(sculptureWidth, sculptureHeight);
    });

    // -------------------------------------------------------------
    // Projects Showcase Simulator Data & Logic
    // -------------------------------------------------------------
    const projectsData = {
        stream: {
            name: "Stream (Go Viral)",
            category: "Live Streaming",
            developer: "Asadullah",
            link: "https://apps.apple.com/pk/app/stream-go-viral/id6755434754",
            rating: "4.9 ★",
            coreTech: "Agora SDK",
            age: "4+",
            desc: "Low-latency live streaming application with integrated Agora video call technology, custom AVFoundation audio/video editors, and high-fidelity native layouts.",
            tech: ["SwiftUI", "UIKit", "Agora SDK", "MVVM", "AVFoundation"],
            gradient: "linear-gradient(135deg, #ff2d55, #ff9500)",
            previewText: "Stream Live Player Interface"
        },
        buzzscanner: {
            name: "Buzzscanner Pro",
            category: "AI Utility",
            developer: "Asadullah",
            link: "https://apps.apple.com/pk/app/buzzscanner-pro/id6790825985",
            rating: "4.8 ★",
            coreTech: "Vision SDK",
            age: "4+",
            desc: "AI-powered scanner utility with real-time barcode and QR detection via Apple's Vision SDK, custom styling QR generation, and Google AdMob monetization.",
            tech: ["Swift", "Vision SDK", "AI API", "CoreData", "AdMob"],
            gradient: "linear-gradient(135deg, #4cd964, #5ac8fa)",
            previewText: "AI Scanner Camera Screen"
        },
        bebelo: {
            name: "Bebelo",
            category: "Travel & Local",
            developer: "Asadullah",
            link: "https://apps.apple.com/app/id1613322776",
            rating: "4.7 ★",
            coreTech: "Mapbox SDK",
            age: "12+",
            desc: "Interactive nightlife and bar discovery companion for Madrid. Features offline-capable Mapbox venue overlays, real-time geolocation pins, and drink price indexes.",
            tech: ["Swift", "UIKit", "Mapbox SDK", "CoreLocation", "REST API"],
            gradient: "linear-gradient(135deg, #5856d6, #007aff)",
            previewText: "Madrid Interactive Nightlife Map"
        },
        zophee: {
            name: "Zophee",
            category: "Health & Wellness",
            developer: "Asadullah",
            link: "https://apps.apple.com/pk/app/zophee/id6749799325",
            rating: "4.9 ★",
            coreTech: "AVFoundation",
            age: "4+",
            desc: "Mental wellness platform offering anxiety relief exercises, customized sleep guides, structured audio therapy sessions, and smooth layout transition animations.",
            tech: ["Swift", "SwiftUI", "AVFoundation", "MVVM", "CoreGraphics"],
            gradient: "linear-gradient(135deg, #34aadc, #1d4ed8)",
            previewText: "Wellness Audio & Meditation Session"
        },
        xploresmore: {
            name: "Xplore Smore",
            category: "Navigation",
            developer: "Asadullah",
            link: "https://apps.apple.com/app/id1552349182",
            rating: "4.8 ★",
            coreTech: "Mapbox SDK",
            age: "4+",
            desc: "Ski resort guide with fully customized offline trail maps, turn-by-turn navigation overlays, and continuous background GPS location tracking.",
            tech: ["Swift", "UIKit", "Mapbox SDK", "CoreLocation", "Firebase"],
            gradient: "linear-gradient(135deg, #007aff, #5ac8fa)",
            previewText: "Ski Slope Offline Navigation Map"
        },
        biotechpet: {
            name: "BioTech Pet",
            category: "AI Healthcare",
            developer: "Asadullah",
            link: "https://apps.apple.com/app/id1661138888",
            rating: "4.7 ★",
            coreTech: "AI Integration",
            age: "4+",
            desc: "AI genetics app analyzing pet DNA traits and providing health insights, custom kit ordering workflows, and real-time database synchronizations.",
            tech: ["Swift", "SwiftUI/UIKit", "AI Integration", "Firebase", "REST API"],
            gradient: "linear-gradient(135deg, #af52de, #ff2d55)",
            previewText: "Pet Genetic Analysis Report"
        },
        armor: {
            name: "ARMOR Asset Management",
            category: "Business Utility",
            developer: "Asadullah",
            link: "https://apps.apple.com/app/id1589139943",
            rating: "4.8 ★",
            coreTech: "Core Data",
            age: "4+",
            desc: "Fleet monitoring and corporate asset tracking suite featuring persistent local database storage, security logs, and live REST API coordination.",
            tech: ["Swift", "UIKit", "Core Data", "RESTful APIs", "Firebase"],
            gradient: "linear-gradient(135deg, #ff9500, #ff5b00)",
            previewText: "Corporate Fleet Monitoring Panel"
        },
        rokoli: {
            name: "Rokoli Driver",
            category: "Navigation",
            developer: "Asadullah",
            link: "https://apps.apple.com/app/id1594943282",
            rating: "4.6 ★",
            coreTech: "Google Maps API",
            age: "4+",
            desc: "Ambulatory and medical care transport app coordinating real-time driver dispatching, multi-stop route optimization, and live coordinate WebSockets.",
            tech: ["Swift", "UIKit", "Google Maps API", "WebSockets", "CoreLocation"],
            gradient: "linear-gradient(135deg, #ff3b30, #ff9500)",
            previewText: "Driver Real-time Route Navigation"
        },
        taxvault: {
            name: "Tax Vault",
            category: "Productivity",
            developer: "Asadullah",
            link: "https://apps.apple.com/app/id1562913098",
            rating: "4.7 ★",
            coreTech: "PDFTron SDK",
            age: "4+",
            desc: "Corporate tax document editor featuring local PDF signing, secure admin-to-client chat pipelines, and instant APNs push notifications.",
            tech: ["Swift", "UIKit", "PDFTron SDK", "Firebase", "APNs"],
            gradient: "linear-gradient(135deg, #30d158, #1d4ed8)",
            previewText: "Secure PDF Document Viewer"
        },
        inklink: {
            name: "Letts of London inkLink",
            category: "Productivity",
            developer: "Asadullah",
            link: "https://apps.apple.com/app/id1524312891",
            rating: "4.8 ★",
            coreTech: "FSCalendar",
            age: "4+",
            desc: "Interactive schedule sync app combining physical Letts paper planners via daily QR codes, custom FSCalendar layouts, and offline tasks.",
            tech: ["Swift", "UIKit", "FSCalendar", "CoreGraphics", "Vision SDK"],
            gradient: "linear-gradient(135deg, #007aff, #5856d6)",
            previewText: "Calendar Planner Dashboard"
        }
    };

    const SVGIcons = {
        stream: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`,
        buzzscanner: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"></path><line x1="7" y1="12" x2="17" y2="12"></line></svg>`,
        bebelo: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
        zophee: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>`,
        xploresmore: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3l4 8 5-5 5 15H2L8 3z"></path></svg>`,
        biotechpet: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 10.5C4.5 10.5 8 5.5 12 5.5s7.5 5 7.5 5-3.5 5-7.5 5-7.5-5-7.5-5z"></path><circle cx="12" cy="10.5" r="2"></circle></svg>`,
        armor: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
        rokoli: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect><line x1="16" y1="8" x2="20" y2="8"></line><line x1="16" y1="12" x2="23" y2="12"></line></svg>`,
        taxvault: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><path d="M12 11v6M9 14h6"></path></svg>`,
        inklink: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`
    };

    const appCards = document.querySelectorAll('.app-store-card');
    const simScreen = document.getElementById('simulator-screen');

    appCards.forEach(card => {
        card.addEventListener('click', () => {
            const appId = card.getAttribute('data-app-id');
            const data = projectsData[appId];
            if (!data) return;

            // Remove active from all
            appCards.forEach(c => c.classList.remove('active'));
            // Add active to current
            card.classList.add('active');

            // Trigger visual fade transition inside simulator
            simScreen.style.opacity = '0.2';
            simScreen.style.transform = 'scale(0.97)';
            simScreen.style.transition = 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)';

            setTimeout(() => {
                // Update header and content
                const headerIcon = simScreen.querySelector('.sim-app-icon');
                headerIcon.style.background = data.gradient;
                headerIcon.innerHTML = SVGIcons[appId];

                simScreen.querySelector('.sim-app-name').textContent = data.name;
                simScreen.querySelector('.sim-app-get-btn').href = data.link;

                const stats = simScreen.querySelectorAll('.sim-stat-value');
                stats[0].textContent = data.rating;
                stats[1].textContent = data.coreTech;
                stats[2].textContent = data.age;

                document.getElementById('sim-desc').textContent = data.desc;

                // Update Tech pills
                const techContainer = document.getElementById('sim-tech');
                techContainer.innerHTML = '';
                data.tech.forEach(t => {
                    const span = document.createElement('span');
                    span.className = 'sim-tech-pill';
                    span.textContent = t;
                    techContainer.appendChild(span);
                });

                // Update preview pattern
                const previewPattern = document.getElementById('sim-preview');
                const colors = data.gradient.replace('linear-gradient(135deg,', '').replace(')', '').split(',');
                const color1 = colors[0].trim();
                const color2 = (colors[1] || colors[0]).trim();
                previewPattern.style.background = `linear-gradient(135deg, ${color1}25, ${color2}25)`;
                previewPattern.textContent = data.previewText;

                // Fade back in
                simScreen.style.opacity = '1';
                simScreen.style.transform = 'scale(1)';
            }, 200);
        });
    });

    // -------------------------------------------------------------
    // Skills Matrix Tabs Logic
    // -------------------------------------------------------------
    const tabBtns = document.querySelectorAll('.skills-tab-btn');
    const tabPanes = document.querySelectorAll('.skills-tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Remove active class from buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');

            // Hide all tab panes
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                pane.style.display = 'none';
            });

            // Show active pane
            const activePane = document.getElementById(`tab-${targetTab}`);
            if (activePane) {
                activePane.style.display = 'grid';
                setTimeout(() => {
                    activePane.classList.add('active');
                }, 10);
            }
        });
    });

    // -------------------------------------------------------------
    // Contact Form Interactive Handling
    // -------------------------------------------------------------
    const contactForm = document.getElementById('portfolio-contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            formStatus.className = 'form-status';
            formStatus.style.opacity = 1;
            formStatus.textContent = 'Transmitting message...';

            setTimeout(() => {
                formStatus.className = 'form-status success';
                formStatus.textContent = 'Message received. We will connect soon!';
                contactForm.reset();
                
                setTimeout(() => {
                    formStatus.style.opacity = 0;
                }, 4000);
            }, 1200);
        });
    }
});
