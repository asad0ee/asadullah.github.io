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
