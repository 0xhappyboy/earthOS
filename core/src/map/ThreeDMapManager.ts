import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BasemapTypeEnum, CoordinateSystemTypeEnum } from '../types';

const BASEMAP_TILE_CONFIG: Partial<Record<BasemapTypeEnum, string>> = {
    [BasemapTypeEnum.SATELLITE]: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    [BasemapTypeEnum.AMAP_SATELLITE]: "https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
    [BasemapTypeEnum.GOOGLE_SATELLITE]: "http://www.google.cn/maps/vt?lyrs=s&x={x}&y={y}&z={z}",
};

export class ThreeDMapManager {
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private controls!: OrbitControls;
    private earthMesh: THREE.Mesh | null = null;
    private container: HTMLElement;
    private animationId: number | null = null;
    private isInitialized: boolean = false;

    private tileTexture: THREE.CanvasTexture | null = null;
    private currentBasemap: BasemapTypeEnum;
    private tileUrlTemplate: string = "";

    constructor(
        container: HTMLElement,
        basemap: BasemapTypeEnum,
        center: [number, number],
        zoom: number,
        coordinateSystem: CoordinateSystemTypeEnum,
        baseMapUrl?: string
    ) {
        this.container = container;
        this.currentBasemap = basemap;

        if (basemap === BasemapTypeEnum.CUSTOMIZE && baseMapUrl) {
            this.tileUrlTemplate = baseMapUrl;
        } else {
            this.tileUrlTemplate = BASEMAP_TILE_CONFIG[basemap] || BASEMAP_TILE_CONFIG[BasemapTypeEnum.AMAP_SATELLITE]!;
        }

        setTimeout(() => {
            this.initThreeD();
        }, 100);
    }

    private initThreeD(): void {
        let width = this.container.clientWidth;
        let height = this.container.clientHeight;

        if (width === 0 || height === 0) {
            width = window.innerWidth;
            height = window.innerHeight;
        }

        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';

        const oldCanvas = this.container.querySelector('canvas');
        if (oldCanvas) oldCanvas.remove();

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050b1a);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 12);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x050b1a, 1);

        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.pointerEvents = 'auto';

        this.container.appendChild(this.renderer.domElement);

        this.addStarfield();
        this.addLights();
        this.createEarthWithTiles();
        this.initOrbitControls();
        window.addEventListener('resize', this.handleResize.bind(this));

        this.isInitialized = true;
        this.startAnimation();
    }

    private initOrbitControls(): void {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableZoom = true;
        this.controls.enableRotate = true;
        this.controls.enablePan = false;
        this.controls.zoomSpeed = 1.2;
        this.controls.rotateSpeed = 0.8;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 20;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    private addStarfield(): void {
        const geometry = new THREE.BufferGeometry();
        const count = 3000;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 500 - 200;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const stars = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.4 }));
        this.scene.add(stars);
    }

    private addLights(): void {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);
    }

    private createEarthWithTiles(): void {
        const canvas = document.createElement('canvas');
        canvas.width = 4096;
        canvas.height = 2048;

        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#1a4d8c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.tileTexture = new THREE.CanvasTexture(canvas);
        this.tileTexture.wrapS = THREE.RepeatWrapping;
        this.tileTexture.wrapT = THREE.ClampToEdgeWrapping;

        const material = new THREE.MeshStandardMaterial({
            map: this.tileTexture,
            roughness: 0.5,
            metalness: 0.1,
        });

        const geometry = new THREE.SphereGeometry(5, 512, 512);
        this.earthMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.earthMesh);
        this.loadTilesForZoom(4);
    }

    private getTileUrl(x: number, y: number, z: number): string {
        return this.tileUrlTemplate
            .replace('{z}', z.toString())
            .replace('{x}', x.toString())
            .replace('{y}', y.toString());
    }

    private loadImage(url: string): Promise<HTMLImageElement | null> {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn(`Failed: ${url}`);
                resolve(null);
            };
            img.src = url;
        });
    }

    private async loadTilesForZoom(zoom: number): Promise<void> {
        const canvas = this.tileTexture!.image as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;

        const tileCount = Math.pow(2, zoom);
        const tileW = canvas.width / tileCount;
        const tileH = canvas.height / tileCount;
        console.log(`Loading zoom ${zoom}, ${tileCount}x${tileCount} tiles...`);
        for (let x = 0; x < tileCount; x++) {
            for (let y = 0; y < tileCount; y++) {
                const url = this.getTileUrl(x, y, zoom);
                const img = await this.loadImage(url);

                if (img) {
                    const sx = x * tileW;
                    const sy = y * tileH;
                    ctx.drawImage(img, sx, sy, tileW, tileH);
                } else {
                    ctx.fillStyle = '#2a6b4a';
                    ctx.fillRect(x * tileW, y * tileH, tileW, tileH);
                }
            }
            this.tileTexture!.needsUpdate = true;
            await this.delay(10);
        }
        console.log(`Zoom ${zoom} loaded`);
        this.tileTexture!.needsUpdate = true;
        if (zoom < 8) {
            await this.delay(500);
            this.loadTilesForZoom(zoom + 1);
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private startAnimation(): void {
        const animate = () => {
            if (!this.isInitialized) return;
            if (this.controls) this.controls.update();
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    private handleResize(): void {
        if (!this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    public setZoom(zoom: number): void {
        if (this.controls) {
            const distance = Math.max(3, Math.min(20, 20 - (zoom - 1) * 0.9));
            this.controls.object.position.set(0, 0, distance);
            this.controls.update();
        }
    }

    public getZoom(): number {
        if (this.controls) {
            const distance = this.controls.target.distanceTo(this.controls.object.position);
            return Math.round((20 - distance) / 0.9) + 1;
        }
        return 0;
    }

    public setCenter(center: [number, number]): void {
        console.log('setCenter:', center);
    }

    public getCenter(): [number, number] {
        return [0, 0];
    }

    public setBasemap(basemap: BasemapTypeEnum): void {
        this.currentBasemap = basemap;
        const newUrl = BASEMAP_TILE_CONFIG[basemap];
        if (newUrl) {
            this.tileUrlTemplate = newUrl;
            this.loadTilesForZoom(4);
        }
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }

    public getEarthMesh(): THREE.Mesh | null {
        return this.earthMesh;
    }

    public getControls(): OrbitControls {
        return this.controls;
    }

    public setVisible(visible: boolean): void {
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.style.display = visible ? 'block' : 'none';
        }
    }

    public destroy(): void {
        this.isInitialized = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this.handleResize.bind(this));
        if (this.controls) this.controls.dispose();
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement) this.renderer.domElement.remove();
        }
        if (this.scene) this.scene.clear();
        this.tileTexture?.dispose();
    }
}